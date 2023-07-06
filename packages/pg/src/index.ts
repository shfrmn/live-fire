import type {Client, Pool} from "pg"
import {Connection} from "./connection"
import {Tables} from "./table"
import {Transaction} from "./transaction"
import {Triggers} from "./trigger"

/**
 *
 */
const PG_SYMBOL_REGEX = /^[A-z]{1,63}$/

/**
 *
 */
export interface CreatePgTestHooks {
  connection: Client | Pool
  schema?: string
  tables?: string[]
  triggers?: boolean
}

/**
 *
 */
interface TestHooks {
  before: () => any
  beforeEach: () => any
  afterEach: () => any
  after: () => any
}

/**
 *
 */
export function createPgTestHooks(options: CreatePgTestHooks): TestHooks {
  const {connection, schema = "public", tables, triggers = true} = options
  if (
    ![...(tables || []), schema].every((symbol) => PG_SYMBOL_REGEX.test(symbol))
  ) {
    throw new Error(`Invalid symbol name`)
  }

  const statements = [
    Tables.createFunction,
    ...(triggers ? [Triggers.createFunction] : []),
  ]

  /**
   * Allows sharing state between test hooks.
   *
   * Currently stores selected `client` instance that all queries should be run on
   * and the unmodified `.query()` function.
   */
  const state = Connection.connect(connection).then((client) => {
    return {client, runQuery: Connection.proxy(connection, client)}
  })

  return {
    before: async () => {
      const {runQuery} = await state
      await runQuery(statements.join("\n"))
      await runQuery(Tables.create, [schema, tables])
      if (triggers) {
        await runQuery(Triggers.create, [schema, tables])
      }
    },
    beforeEach: () => state.then(({runQuery}) => runQuery(Transaction.begin)),
    afterEach: () => state.then(({runQuery}) => runQuery(Transaction.commit)),
    after: () => {
      return state.then(({client}) => Connection.disconnect(connection, client))
    },
  }
}
