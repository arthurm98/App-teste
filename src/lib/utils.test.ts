import test from "node:test"
import assert from "node:assert"
import { cn } from "./utils.ts";

test("cn utility", async (t) => {
  await t.test("merges multiple class names", () => {
    assert.strictEqual(cn("base", "extra"), "base extra")
  })

  await t.test("handles conditional classes", () => {
    assert.strictEqual(cn("base", true && "active", false && "hidden"), "base active")
    assert.strictEqual(cn("base", { active: true, hidden: false }), "base active")
  })

  await t.test("resolves Tailwind CSS class conflicts", () => {
    // twMerge should ensure that the last conflicting class wins
    assert.strictEqual(cn("p-4 p-8"), "p-8")
    assert.strictEqual(cn("text-red-500 text-blue-500"), "text-blue-500")
  })

  await t.test("handles edge cases", () => {
    assert.strictEqual(cn("base", null, undefined, ""), "base")
    assert.strictEqual(cn(), "")
  })

  await t.test("merges complex inputs and handles shorthand overrides", () => {
    // p-2 overrides both px-4 and py-1
    assert.strictEqual(
      cn("px-2 py-1 bg-red-500", { "bg-blue-500": true, "px-4": true }, "p-2"),
      "bg-blue-500 p-2"
    )
  })
})
