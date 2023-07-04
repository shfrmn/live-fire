import {createPgTestHooks, CreatePgTestHooks} from "@pg-live-test/core"

/**
 *
 */
interface SetupPgTestHooks extends CreatePgTestHooks {
  testPrefix?: string
}

/**
 *
 */
export function setupPgTestHooks(
  options: SetupPgTestHooks,
): (t: Tap.Test) => void {
  const {testPrefix} = options
  const {before, beforeEach, afterEach, after} = createPgTestHooks(options)
  return (t) => {
    if (testPrefix && !new RegExp(`^${testPrefix}`, "i").test(t.name)) {
      return
    }
    t.before(before)
    t.beforeEach(beforeEach)
    t.afterEach(afterEach)
    t.teardown(after)
  }
}
