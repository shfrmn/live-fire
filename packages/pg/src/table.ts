/**
 *
 */
const FUNCTION_NAME = "pg_temp.create_temp_tables"

/**
 *
 */
const CREATE_TEMP_TABLES_FUNCTION = `
SELECT set_config('search_path', 'pg_temp', false);
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
    EXECUTE 'CREATE TEMP TABLE IF NOT EXISTS' || ' "' || r.table_name || '" '
      || '(LIKE "' || r.table_schema || '"."' || r.table_name || '" INCLUDING ALL) ON COMMIT DELETE ROWS';
  END LOOP;
END;
$$;
`

/**
 *
 */
const CREATE_TEMP_TABLES = `SELECT ${FUNCTION_NAME}($1, $2);`

/**
 *
 */
export const Tables = {
  createFunction: CREATE_TEMP_TABLES_FUNCTION,
  create: CREATE_TEMP_TABLES,
}
