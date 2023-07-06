import type {Pool, QueryResult} from "pg"

/**
 *
 */
const SAVEPOINT_NAME = "checkpoint"

/**
 *
 */
const CREATE_SAVEPOINT = `SAVEPOINT ${SAVEPOINT_NAME};`

/**
 *
 */
const RELEASE_SAVEPOINT = `RELEASE SAVEPOINT ${SAVEPOINT_NAME};`

/**
 *
 */
const ROLLBACK_TO_SAVEPOINT = `ROLLBACK TO SAVEPOINT ${SAVEPOINT_NAME};`

/**
 *
 */
const BEGIN_TRANSACTION = `BEGIN; ${CREATE_SAVEPOINT}`

/**
 *
 */
const COMMIT_TRANSACTION = `COMMIT;`

/**
 * Creates a function to perform queries within multi-query test transactions.
 *
 * Should the provided query complete successfully, the function will redeclare
 * the save point within a transaction, however if the query fails it will rollback.
 *
 * This is important because a test might contain assertions for multiple failing queries
 * one after another, but a PostgreSQL transaction without any save points would only
 * allow one query to fail and would then ignore everything after that until the transaction ends.
 */
function wrap(runQuery: Pool["query"]): Pool["query"] {
  async function runQueryInTransaction(
    ...args: Parameters<typeof runQuery>
  ): Promise<QueryResult<any>> {
    try {
      const result = await runQuery(args[0], args[1])
      await runQuery(`${RELEASE_SAVEPOINT} ${CREATE_SAVEPOINT}`)
      return result
    } catch (err) {
      await runQuery(ROLLBACK_TO_SAVEPOINT)
      throw err
    }
  }
  return runQueryInTransaction as Pool["query"]
}

/**
 *
 */
export const Transaction = {
  wrap,
  begin: BEGIN_TRANSACTION,
  commit: COMMIT_TRANSACTION,
}
