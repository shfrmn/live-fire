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
interface SetupTestHooks extends TestHooks {
  testPrefix?: string
}

/**
 *
 */
export function setupTestHooks(options: SetupTestHooks): (t: Tap.Test) => void {
  const {testPrefix, before, beforeEach, afterEach, after} = options
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
