/**
 *
 */
const FUNCTION_NAME = "pg_temp.create_temp_triggers"

/**
 *
 */
const createCloneTriggersFunction = `
SELECT set_config('search_path', 'pg_temp,' || current_setting('search_path'), false);
CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}(schema_name name, table_names name[]) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT
      trigger_name,
      action_timing,
      event_manipulation,
      event_object_table,
      action_condition,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = schema_name
      AND (
        table_names IS NULL
        OR table_names = '{}'
        OR event_object_table = ANY(table_names)
      )
  )
  LOOP
    EXECUTE 'CREATE TRIGGER '
      || r.trigger_name || ' '
      || r.action_timing || ' ' || r.event_manipulation || ' '
      || 'ON pg_temp.' || r.event_object_table || ' '
      || 'FOR EACH ROW' || coalesce(' WHEN (' || r.action_condition || ')', '') || ' '
      || r.action_statement;
  END LOOP;
END;
$$;
`.trimStart()

/**
 *
 */
const createTriggers = `SELECT ${FUNCTION_NAME}($1, $2);`

/**
 *
 */
export const Triggers = {
  createFunction: createCloneTriggersFunction,
  create: createTriggers,
}
