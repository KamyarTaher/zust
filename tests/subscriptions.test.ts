/**
 * Subscription Tests
 * Testing global and path-based subscriptions
 */

import { expect, test, describe } from "@jest/globals";
import { createStore } from "../src/index";

describe("Subscriptions", () => {
  test("subscribes to all state changes", () => {
    const { setDeep, subscribe } = createStore({ counter: 0 });
    let notified = false;

    subscribe(() => {
      notified = true;
    });

    setDeep("counter", 5);
    expect(notified).toBe(true);
  });

  test("receives new and old state in listener", () => {
    const { setDeep, subscribe } = createStore({ counter: 0 });
    let newState: { counter: number } | undefined;
    let oldState: { counter: number } | undefined;

    subscribe((newS, oldS) => {
      newState = newS;
      oldState = oldS;
    });

    setDeep("counter", 5);

    expect(oldState.counter).toBe(0);
    expect(newState.counter).toBe(5);
  });

  test("unsubscribe stops notifications", () => {
    const { setDeep, subscribe } = createStore({ counter: 0 });
    let callCount = 0;

    const unsubscribe = subscribe(() => {
      callCount++;
    });

    setDeep("counter", 1);
    expect(callCount).toBe(1);

    unsubscribe();
    setDeep("counter", 2);
    expect(callCount).toBe(1); // Still 1, not called again
  });

  test("subscribePath only fires for specific path", () => {
    const { setDeep, subscribePath } = createStore({
      user: { name: "John", age: 30 },
    });

    let nameChanges = 0;
    let ageChanges = 0;

    subscribePath("user.name", () => nameChanges++);
    subscribePath("user.age", () => ageChanges++);

    setDeep("user.name", "Jane");
    expect(nameChanges).toBe(1);
    expect(ageChanges).toBe(0);

    setDeep("user.age", 31);
    expect(nameChanges).toBe(1);
    expect(ageChanges).toBe(1);
  });

  test("subscribePath receives old and new values", () => {
    const { setDeep, subscribePath } = createStore({
      user: { name: "John" },
    });

    let oldValue: unknown;
    let newValue: unknown;

    subscribePath("user.name", (newVal, oldVal) => {
      newValue = newVal;
      oldValue = oldVal;
    });

    setDeep("user.name", "Jane");

    expect(oldValue).toBe("John");
    expect(newValue).toBe("Jane");
  });

  test("multiple subscribers receive updates", () => {
    const { setDeep, subscribe } = createStore({ counter: 0 });
    const calls: number[] = [];

    subscribe(() => calls.push(1));
    subscribe(() => calls.push(2));
    subscribe(() => calls.push(3));

    setDeep("counter", 5);

    expect(calls.length).toBe(3);
    expect(calls).toEqual([1, 2, 3]);
  });

  test("subscribePath unsubscribe works", () => {
    const { setDeep, subscribePath } = createStore({
      counter: 0,
    });

    let callCount = 0;
    const unsubscribe = subscribePath("counter", () => callCount++);

    setDeep("counter", 1);
    expect(callCount).toBe(1);

    unsubscribe();
    setDeep("counter", 2);
    expect(callCount).toBe(1);
  });
});
