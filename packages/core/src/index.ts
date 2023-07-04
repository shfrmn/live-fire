import type {Client, Pool} from "pg"
import {TRIGGERS} from "./trigger"

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
  tables: string[]
  functions?: boolean
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
  const {
    connection,
    schema = "public",
    tables,
    functions = false,
    triggers = false,
  } = options

  if (!PG_SYMBOL_REGEX.test(schema)) {
    throw new Error(`Invalid schema name`)
  }

  const statements = tables
    .filter((table) => PG_SYMBOL_REGEX.test(table))
    .map((table) => {
      return `CREATE TEMP TABLE "${table}" (LIKE "${table}" INCLUDING ALL) ON COMMIT DELETE ROWS;`
    })

  if (statements.length !== tables.length || !PG_SYMBOL_REGEX.test(schema)) {
    throw new Error(`Invalid schema or table name`)
  }

  if (triggers) {
    statements.push(TRIGGERS.createCloneTriggersFunction)
  }

  if (functions || triggers) {
    statements.push(`SET search_path TO pg_temp, "${schema}";`)
  }

  const query = statements.join("\n").trim()

  return {
    before: async () => {
      await connection.query(query)
      if (triggers) {
        await connection.query(TRIGGERS.cloneTriggers, [schema, tables])
        await connection.query(TRIGGERS.dropCloneTriggersFunction)
      }
    },
    beforeEach: () => connection.query("BEGIN"),
    afterEach: () => connection.query("COMMIT"),
    after: () => connection.end(),
  }
}
