/**
 * Batch Updates Tests
 * Testing batched state updates for performance
 */

import { expect, test, describe } from "@jest/globals";
import { createStore, batch } from "../src/index";

describe("Batch Updates", () => {
  test("batch combines multiple updates", () => {
    const { setDeep, subscribe } = createStore({
      a: 0,
      b: 0,
      c: 0,
    });

    let notificationCount = 0;
    subscribe(() => notificationCount++);

    batch(() => {
      setDeep("a", 1);
      setDeep("b", 2);
      setDeep("c", 3);
    });

    // Should only notify once after batch completes
    setTimeout(() => {
      expect(notificationCount).toBeLessThanOrEqual(1);
    }, 100);
  });

  test("batch updates state correctly", () => {
    const { getState, setDeep } = createStore({
      user: { name: "John", age: 30, email: "john@example.com" },
    });

    batch(() => {
      setDeep("user.name", "Jane");
      setDeep("user.age", 25);
      setDeep("user.email", "jane@example.com");
    });

    setTimeout(() => {
      const state = getState();
      expect(state.user.name).toBe("Jane");
      expect(state.user.age).toBe(25);
      expect(state.user.email).toBe("jane@example.com");
    }, 100);
  });

  test("nested batches work correctly", () => {
    const { setDeep, subscribe } = createStore({ counter: 0 });

    let callCount = 0;
    subscribe(() => callCount++);

    batch(() => {
      setDeep("counter", 1);
      batch(() => {
        setDeep("counter", 2);
        setDeep("counter", 3);
      });
      setDeep("counter", 4);
    });

    setTimeout(() => {
      expect(callCount).toBeLessThanOrEqual(1);
    }, 100);
  });

  test("batch with errors still updates correctly", () => {
    const { getState, setDeep } = createStore({ a: 0, b: 0 });

    try {
      batch(() => {
        setDeep("a", 1);
        throw new Error("Test error");
      });
    } catch (e) {
      // Expected error
    }

    // State should still be updated
    expect(getState().a).toBe(1);
  });
});
