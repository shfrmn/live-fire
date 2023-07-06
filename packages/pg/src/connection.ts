import type {Client, Pool, PoolClient} from "pg"
import {Transaction} from "./transaction"

/**
 * Connects to the database and returns a single client
 */
function connect(connection: Pool | Client): Promise<PoolClient | Client> {
  // .connect() from `pg` returns `PoolClient` when called on `Pool` and `void` when called on `Client`
  return connection.connect().then((client) => client || (connection as Client))
}

/**
 * Replaces `.query()` method on the provided connection object.
 * As a result, all user queries will be performed within test transactions
 * and on the same client, regardless of the pool settings.
 *
 * Returns the original unmodified query function for internal use.
 */
export function proxyConnection(
  connection: Pool | Client,
  client: PoolClient | Client,
): Pool["query"] {
  const runQuery = client.query.bind(client)
  connection.query = Transaction.wrap(runQuery)
  return runQuery
}

/**
 * Releases the client back to the pool if necessary (to avoid timeouts)
 * and then closes the connection to the database.
 */
async function disconnect(
  connection: Pool | Client,
  client: PoolClient | Client,
): Promise<void> {
  if (connection !== client) {
    ;(client as PoolClient).release()
  }
  await connection.end()
}

/**
 *
 */
export const Connection = {
  connect,
  proxy: proxyConnection,
  disconnect,
}
