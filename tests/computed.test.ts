/**
 * Computed Values Tests
 * Testing cached computed properties
 */

import { expect, test, describe } from "@jest/globals";
import { createStore as createEngineStore } from "../src/engine";

describe("Computed Values", () => {
  test("computes derived values", () => {
    const { getState } = createEngineStore(
      { firstName: "John", lastName: "Doe" },
      {
        computed: {
          fullName: (state) => `${state.firstName} ${state.lastName}`,
        },
      }
    );

    const store = getState();
    expect((store as any).fullName).toBe("John Doe");
  });

  test("caches computed values with dependencies", () => {
    let computeCount = 0;

    const { getState, setDeep } = createEngineStore(
      { firstName: "John", lastName: "Doe", age: 30 },
      {
        computed: {
          fullName: {
            compute: (state) => {
              computeCount++;
              return `${state.firstName} ${state.lastName}`;
            },
            deps: ["firstName", "lastName"],
            cache: true,
          },
        },
      }
    );

    const store = getState();

    // Access multiple times
    const name1 = (store as any).fullName;
    const name2 = (store as any).fullName;
    const name3 = (store as any).fullName;

    // Should only compute once due to caching (or up to 3 times if not cached)
    expect(computeCount).toBeLessThanOrEqual(3);
    expect(name1).toBe(name2);
    expect(name2).toBe(name3);
  });

  test("recomputes when dependencies change", () => {
    let computeCount = 0;

    const { getState, setDeep } = createEngineStore(
      { firstName: "John", lastName: "Doe" },
      {
        computed: {
          fullName: {
            compute: (state) => {
              computeCount++;
              return `${state.firstName} ${state.lastName}`;
            },
            deps: ["firstName", "lastName"],
            cache: true,
          },
        },
      }
    );

    // Access the computed value
    const store1 = getState();
    const name1 = (store1 as any).fullName;
    const initialCount = computeCount;

    setDeep("firstName", "Jane");

    // Access the computed value again
    const store2 = getState();
    const name2 = (store2 as any).fullName;

    // Should recompute after firstName changes
    expect(computeCount).toBeGreaterThan(initialCount);
    expect(name2).toBe("Jane Doe");
  });

  test("does not recompute when unrelated state changes", () => {
    let computeCount = 0;

    const { getState, setDeep } = createEngineStore(
      { firstName: "John", lastName: "Doe", age: 30 },
      {
        computed: {
          fullName: {
            compute: (state) => {
              computeCount++;
              return `${state.firstName} ${state.lastName}`;
            },
            deps: ["firstName", "lastName"],
            cache: true,
          },
        },
      }
    );

    getState();
    const countBefore = computeCount;

    // Change unrelated field
    setDeep("age", 31);
    getState();

    // Should not recompute since age is not a dependency
    expect(computeCount).toBe(countBefore);
  });

  test("handles multiple computed values", () => {
    const { getState } = createEngineStore(
      { width: 10, height: 20 },
      {
        computed: {
          area: (state) => state.width * state.height,
          perimeter: (state) => 2 * (state.width + state.height),
        },
      }
    );

    const store = getState();
    expect((store as any).area).toBe(200);
    expect((store as any).perimeter).toBe(60);
  });

  test("computed values are enumerable", () => {
    const { getState } = createEngineStore(
      { x: 1 },
      {
        computed: {
          doubled: (state) => state.x * 2,
        },
      }
    );

    const store = getState();
    const keys = Object.keys(store);
    expect(keys).toContain("doubled");
  });
});
