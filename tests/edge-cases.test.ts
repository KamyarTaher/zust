/**
 * Edge Cases Tests
 * Testing boundary conditions and unusual scenarios
 */

import { expect, test, describe } from "@jest/globals";
import { createStore } from "../src/index";

describe("Edge Cases", () => {
  test("handles very deep nesting", () => {
    const { getState, setDeep } = createStore({
      a: { b: { c: { d: { e: { f: { g: "deep" } } } } } },
    });

    setDeep("a.b.c.d.e.f.g", "very deep");
    expect(getState().a.b.c.d.e.f.g).toBe("very deep");
  });

  test("handles rapid state updates", () => {
    const { getState, setDeep } = createStore({ counter: 0 });

    for (let i = 0; i < 100; i++) {
      setDeep("counter", i);
    }

    expect(getState().counter).toBe(99);
  });

  test("handles undefined values", () => {
    const { getState, setDeep } = createStore({
      data: { value: "exists" },
    });

    setDeep("data.value", undefined);
    expect(getState().data.value).toBeUndefined();
  });

  test("handles null values", () => {
    const { getState, setDeep } = createStore({
      data: { value: "exists" },
    });

    setDeep("data.value", null);
    expect(getState().data.value).toBeNull();
  });

  test("handles boolean values", () => {
    const { getState, setDeep } = createStore({
      flags: { isActive: false },
    });

    setDeep("flags.isActive", true);
    expect(getState().flags.isActive).toBe(true);
  });

  test("handles number values including 0", () => {
    const { getState, setDeep } = createStore({
      count: 100,
    });

    setDeep("count", 0);
    expect(getState().count).toBe(0);
  });

  test("handles empty strings", () => {
    const { getState, setDeep } = createStore({
      text: "hello",
    });

    setDeep("text", "");
    expect(getState().text).toBe("");
  });

  test("handles special characters in keys", () => {
    const { getState, setDeep } = createStore({
      "special-key": { "another-key": "value" },
    });

    setDeep("special-key.another-key", "updated");
    expect(getState()["special-key"]["another-key"]).toBe("updated");
  });

  test("handles large objects", () => {
    const largeObj: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      largeObj[`key${i}`] = i;
    }

    const { getState, setDeep } = createStore({ data: largeObj });

    setDeep("data.key500", 9999);
    expect(getState().data.key500).toBe(9999);
  });

  test("handles concurrent updates", async () => {
    const { getState, setDeep } = createStore({ a: 0, b: 0, c: 0 });

    await Promise.all([
      Promise.resolve(setDeep("a", 1)),
      Promise.resolve(setDeep("b", 2)),
      Promise.resolve(setDeep("c", 3)),
    ]);

    const state = getState();
    expect(state.a).toBe(1);
    expect(state.b).toBe(2);
    expect(state.c).toBe(3);
  });

  test("getState returns consistent reference", () => {
    const { getState } = createStore({ value: 1 });

    const state1 = getState();
    const state2 = getState();

    expect(state1).toBe(state2); // Same reference
  });

  test("handles Date objects", () => {
    const now = new Date();
    const { getState, setDeep } = createStore({
      timestamp: now,
    });

    const newDate = new Date("2024-01-01");
    setDeep("timestamp", newDate);

    expect(getState().timestamp).toBe(newDate);
  });

  test("handles RegExp objects", () => {
    const pattern = /test/gi;
    const { getState, setDeep } = createStore({
      regex: pattern,
    });

    const newPattern = /new/gi;
    setDeep("regex", newPattern);

    expect(getState().regex).toBe(newPattern);
  });

  test("handles Map and Set", () => {
    const map = new Map([["key", "value"]]);
    const set = new Set([1, 2, 3]);

    const { getState, setDeep } = createStore({
      map,
      set,
    });

    const newMap = new Map([["new", "data"]]);
    setDeep("map", newMap);

    expect(getState().map).toBe(newMap);
  });
});
