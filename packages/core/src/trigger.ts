/**
 *
 */
const CREATE_TEMP_TRIGGERS = "create_temp_triggers"

/**
 *
 */
const createCloneTriggersFunction = `
CREATE OR REPLACE FUNCTION ${CREATE_TEMP_TRIGGERS}(schema_name name, table_names name[]) RETURNS void
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
      AND event_object_table = ANY(table_names)
  )
  LOOP
    EXECUTE 'CREATE TRIGGER '
      || r.trigger_name || ' '
      || r.action_timing || ' ' || r.event_manipulation || ' '
      || 'ON pg_temp.' || r.event_object_table || ' '
      || 'FOR EACH ROW' || coalesce(' WHEN ' || r.action_condition, '') || ' '
      || r.action_statement;
  END LOOP;
END;
$$;
`.trimStart()

/**
 *
 */
const cloneTriggers = `SELECT ${CREATE_TEMP_TRIGGERS}($1, $2);`

/**
 *
 */
const dropCloneTriggersFunction = `DROP FUNCTION IF EXISTS ${CREATE_TEMP_TRIGGERS};`

/**
 *
 */
export const TRIGGERS = {
  createCloneTriggersFunction,
  cloneTriggers,
  dropCloneTriggersFunction,
}
