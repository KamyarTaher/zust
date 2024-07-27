import { expect, test, describe } from "bun:test";
import { createStore, Middleware } from "../src/index";

describe("Zust Store", () => {
  test("creates a store with initial state", () => {
    const initialState = { counter: 0 };
    const { getState } = createStore(initialState);
    expect(getState().counter).toEqual(initialState.counter);
  });

  test("updates state correctly", async () => {
    const { getState, setDeep } = createStore({ counter: 0 });

    // Directly update the state
    setDeep("counter", 5);

    // Wait for state to update
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify the updated state
    expect(getState().counter).toBe(5);
  });

  test("handles nested state updates", async () => {
    const { getState, setDeep } = createStore({
      user: { profile: { name: "John" } },
    });

    // Update nested state
    setDeep("user.profile.name", "Jane");

    // Wait for state to update
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify the nested state update
    expect(getState().user.profile.name).toBe("Jane");
  });

  test("middleware modifies state", async () => {
    // Define a middleware that doubles the counter value
    const doubleMiddleware: Middleware<{ counter: number }> =
      (next) => (state) => {
        return next({ ...state, counter: state.counter * 2 });
      };

    // Create store with middleware
    const { getState, setDeep } = createStore(
      { counter: 0 },
      { middleware: [doubleMiddleware] }
    );

    // Update state
    setDeep("counter", 5);

    // Wait for state to update
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify that the middleware doubled the counter
    expect(getState().counter).toBe(10);
  });
});
