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
export function setupTestHooks(options: TestHooks): (t: Tap.Test) => void {
  const {before, beforeEach, afterEach, after} = options
  return (t) => {
    t.before(before)
    t.beforeEach(beforeEach)
    t.afterEach(afterEach)
    t.teardown(after)
  }
}
