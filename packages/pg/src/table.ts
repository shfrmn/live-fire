/**
 *
 */
const FUNCTION_NAME = "pg_temp.create_temp_tables"

/**
 *
 */
const createTempTablesFunction = `
CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}(schema_name name, table_names name[]) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT * FROM information_schema.tables
    WHERE table_schema = schema_name
      AND (
        table_names IS NULL
        OR table_names = '{}'
        OR table_name = ANY(table_names)
      )
  )
  LOOP
    EXECUTE 'CREATE TEMP TABLE' || ' "' || r.table_name || '" '
      || '(LIKE "' || r.table_name || '" INCLUDING ALL) ON COMMIT DELETE ROWS';
  END LOOP;
END;
$$;
`.trimStart()

/**
 *
 */
const createTempTables = `SELECT ${FUNCTION_NAME}($1, $2);`

/**
 *
 */
export const Tables = {
  createFunction: createTempTablesFunction,
  create: createTempTables,
}
