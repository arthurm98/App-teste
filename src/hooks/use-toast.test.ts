import test from "node:test"
import assert from "node:assert"
import { reducer, TOAST_LIMIT, type State, type Action, type ToasterToast } from "./use-toast.ts"

test("use-toast reducer", async (t) => {
  const initialState: State = { toasts: [] }

  await t.test("ADD_TOAST adds a toast", () => {
    const toast: ToasterToast = { id: "1", title: "Test Toast", open: true }
    const action: Action = { type: "ADD_TOAST", toast }
    const newState = reducer(initialState, action)

    assert.strictEqual(newState.toasts.length, 1)
    assert.deepStrictEqual(newState.toasts[0], toast)
  })

  await t.test("ADD_TOAST respects TOAST_LIMIT", () => {
    const toast1: ToasterToast = { id: "1", title: "First", open: true }
    const toast2: ToasterToast = { id: "2", title: "Second", open: true }

    let state = reducer(initialState, { type: "ADD_TOAST", toast: toast1 })
    state = reducer(state, { type: "ADD_TOAST", toast: toast2 })

    assert.strictEqual(state.toasts.length, TOAST_LIMIT)
    assert.strictEqual(state.toasts[0].id, "2")
  })

  await t.test("UPDATE_TOAST updates an existing toast", () => {
    const toast: ToasterToast = { id: "1", title: "Original", open: true }
    const state: State = { toasts: [toast] }

    const action: Action = {
      type: "UPDATE_TOAST",
      toast: { id: "1", title: "Updated" }
    }
    const newState = reducer(state, action)

    assert.strictEqual(newState.toasts[0].title, "Updated")
    assert.strictEqual(newState.toasts[0].open, true)
  })

  await t.test("DISMISS_TOAST sets open to false", (t) => {
    const originalSetTimeout = global.setTimeout
    // @ts-ignore
    global.setTimeout = () => {}

    try {
      const toast: ToasterToast = { id: "1", title: "Test", open: true }
      const state: State = { toasts: [toast] }

      const action: Action = { type: "DISMISS_TOAST", toastId: "1" }
      const newState = reducer(state, action)

      assert.strictEqual(newState.toasts[0].open, false)
    } finally {
      // @ts-ignore
      global.setTimeout = originalSetTimeout
    }
  })

  await t.test("DISMISS_TOAST without toastId dismisses all", () => {
    const originalSetTimeout = global.setTimeout
    // @ts-ignore
    global.setTimeout = () => {}

    try {
      const state: State = {
        toasts: [
          { id: "1", title: "T1", open: true },
          { id: "2", title: "T2", open: true }
        ]
      }

      const action: Action = { type: "DISMISS_TOAST" }
      const newState = reducer(state, action)

      assert.strictEqual(newState.toasts[0].open, false)
      assert.strictEqual(newState.toasts[1].open, false)
    } finally {
      // @ts-ignore
      global.setTimeout = originalSetTimeout
    }
  })

  await t.test("REMOVE_TOAST removes a specific toast", () => {
    const state: State = {
      toasts: [
        { id: "1", title: "T1", open: true },
        { id: "2", title: "T2", open: true }
      ]
    }

    const action: Action = { type: "REMOVE_TOAST", toastId: "1" }
    const newState = reducer(state, action)

    assert.strictEqual(newState.toasts.length, 1)
    assert.strictEqual(newState.toasts[0].id, "2")
  })

  await t.test("REMOVE_TOAST without toastId removes all", () => {
    const state: State = {
      toasts: [
        { id: "1", title: "T1", open: true },
        { id: "2", title: "T2", open: true }
      ]
    }

    const action: Action = { type: "REMOVE_TOAST" }
    const newState = reducer(state, action)

    assert.strictEqual(newState.toasts.length, 0)
  })
})
