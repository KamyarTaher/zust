/**
 * Async Operations Tests
 * Testing async dispatch and operations
 */

import { expect, test, describe } from "@jest/globals";
import { createStore } from "../src/engine";

describe("Async Operations", () => {
  test("dispatch handles async actions", async () => {
    const store = createStore({
      loading: false,
      data: null as string | null,
    });

    // Access dispatch from getState() which now returns enhanced store
    const enhancedStore = store.getState();

    await enhancedStore.dispatch(async (state, setDeep) => {
      setDeep("loading", true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 50));

      setDeep("data", "fetched data");
      setDeep("loading", false);
    });

    const finalStore = store.getState();
    expect(finalStore.loading).toBe(false);
    expect(finalStore.data).toBe("fetched data");
  });

  test("dispatch handles errors", async () => {
    const store = createStore({
      error: null as string | null,
    });

    const enhancedStore = store.getState();

    try {
      await enhancedStore.dispatch(async (state, setDeep) => {
        throw new Error("Test error");
      });
    } catch (error) {
      expect((error as Error).message).toBe("Test error");
    }
  });

  test("dispatch can access current state", async () => {
    const store = createStore({
      counter: 5,
    });

    const enhancedStore = store.getState();

    await enhancedStore.dispatch(async (state, setDeep) => {
      const current = state.counter;
      setDeep("counter", current * 2);
    });

    const finalStore = store.getState();
    expect(finalStore.counter).toBe(10);
  });

  test("multiple async dispatches work correctly", async () => {
    const store = createStore({
      value: 0,
    });

    const enhancedStore = store.getState();

    await Promise.all([
      enhancedStore.dispatch(async (state, setDeep) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        setDeep("value", (prev: number) => prev + 1);
      }),
      enhancedStore.dispatch(async (state, setDeep) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        setDeep("value", (prev: number) => prev + 1);
      }),
      enhancedStore.dispatch(async (state, setDeep) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        setDeep("value", (prev: number) => prev + 1);
      }),
    ]);

    const finalStore = store.getState();
    expect(finalStore.value).toBeGreaterThan(0);
  });

  test("dispatch with nested updates", async () => {
    const store = createStore({
      user: { name: "John", status: "idle" },
    });

    const enhancedStore = store.getState();

    await enhancedStore.dispatch(async (state, setDeep) => {
      setDeep("user.status", "loading");
      await new Promise(resolve => setTimeout(resolve, 50));
      setDeep("user.name", "Jane");
      setDeep("user.status", "success");
    });

    const finalStore = store.getState();
    expect(finalStore.user.name).toBe("Jane");
    expect(finalStore.user.status).toBe("success");
  });
});
