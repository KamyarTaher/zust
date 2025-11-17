/**
 * Security Tests
 * Testing prototype pollution protection and input validation
 */

import { expect, test, describe } from "@jest/globals";
import { createStore } from "../src/index";

describe("Security", () => {
  test("prevents __proto__ pollution", () => {
    const { setDeep } = createStore({ data: {} });

    expect(() => {
      setDeep("__proto__.polluted", "yes");
    }).toThrow();

    // Verify Object.prototype is not polluted
    expect((Object.prototype as any).polluted).toBeUndefined();
  });

  test("prevents constructor pollution", () => {
    const { setDeep } = createStore({ data: {} });

    expect(() => {
      setDeep("constructor.polluted", "yes");
    }).toThrow();
  });

  test("prevents prototype pollution", () => {
    const { setDeep } = createStore({ data: {} });

    expect(() => {
      setDeep("prototype.polluted", "yes");
    }).toThrow();
  });

  test("prevents nested proto pollution", () => {
    const { setDeep } = createStore({
      data: { nested: {} },
    });

    expect(() => {
      setDeep("data.__proto__.polluted", "yes");
    }).toThrow();
  });

  test("rejects empty path", () => {
    const { setDeep } = createStore({ data: {} });

    expect(() => {
      setDeep("", "value");
    }).toThrow();
  });

  test("rejects invalid path types", () => {
    const { setDeep } = createStore({ data: {} });

    expect(() => {
      setDeep(null as any, "value");
    }).toThrow();

    expect(() => {
      setDeep(undefined as any, "value");
    }).toThrow();
  });

  test("validates initial state is object", () => {
    expect(() => {
      createStore(null as any);
    }).toThrow();

    expect(() => {
      createStore([] as any);
    }).toThrow();

    expect(() => {
      createStore("string" as any);
    }).toThrow();
  });

  test("handles malicious path segments", () => {
    const { setDeep } = createStore({ data: {} });

    const maliciousPaths = [
      "data.__proto__",
      "data.constructor",
      "data.prototype",
      "__proto__.isAdmin",
      "constructor.prototype.isAdmin",
    ];

    maliciousPaths.forEach((path) => {
      expect(() => setDeep(path, true)).toThrow();
    });
  });

  test("safe paths still work", () => {
    const { getState, setDeep } = createStore({
      user: { name: "John", __custom: "safe" },
    });

    // These should work fine
    setDeep("user.name", "Jane");
    setDeep("user.__custom", "value");

    expect(getState().user.name).toBe("Jane");
    expect(getState().user.__custom).toBe("value");
  });
});
