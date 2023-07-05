import type {Client, Pool} from "pg"
import {Triggers} from "./trigger"
import {Tables} from "./table"

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
    !(tables || [])
      .concat(schema)
      .every((symbol) => PG_SYMBOL_REGEX.test(symbol))
  ) {
    throw new Error(`Invalid symbol name`)
  }

  const statements = [
    Tables.createFunction,
    ...(triggers ? [Triggers.createFunction] : []),
  ]

  return {
    before: async () => {
      await connection.query(statements.join("\n"))
      await connection.query(Tables.create, [schema, tables])
      if (triggers) {
        await connection.query(Triggers.create, [schema, tables])
      }
    },
    beforeEach: () => connection.query("BEGIN"),
    afterEach: () => connection.query("COMMIT"),
    after: () => connection.end(),
  }
}
