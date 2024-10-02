// test/store.test.ts
import { expect, test, describe } from '@jest/globals';
import { createStore, Middleware } from '../src/index';

describe('Zust Store', () => {
  test('creates a store with initial state', () => {
    const initialState = { counter: 0 };
    const { getState } = createStore(initialState);
    expect(getState().counter).toEqual(initialState.counter);
  });

  test('updates state correctly', () => {
    const { getState, setDeep } = createStore({ counter: 0 });

    // Directly update the state
    setDeep('counter', (prev) => prev + 5);

    // Verify the updated state
    expect(getState().counter).toBe(5);
  });

  test('handles nested state updates', () => {
    const { getState, setDeep } = createStore({
      user: { profile: { name: 'John' } },
    });

    // Update nested state
    setDeep('user.profile.name', 'Jane');

    // Verify the nested state update
    expect(getState().user.profile.name).toBe('Jane');
  });

  test('middleware modifies state', () => {
    // Define a middleware that doubles the counter value
    const doubleMiddleware: Middleware<{ counter: number }> = (next) => (state) => {
      return next({ ...state, counter: state.counter * 2 });
    };

    // Create store with middleware
    const { getState, setDeep } = createStore(
      { counter: 0 },
      { middleware: [doubleMiddleware] }
    );

    // Update state
    setDeep('counter', 5);

    // Verify that the middleware doubled the counter
    expect(getState().counter).toBe(10);
  });

  test('middleware chain applies in order', () => {
    // Middleware to increment the counter
    const incrementMiddleware: Middleware<{ counter: number }> = (next) => (state) => {
      return next({ ...state, counter: state.counter + 1 });
    };

    // Middleware to double the counter
    const doubleMiddleware: Middleware<{ counter: number }> = (next) => (state) => {
      return next({ ...state, counter: state.counter * 2 });
    };

    // Create store with both middlewares
    const { getState, setDeep } = createStore(
      { counter: 1 },
      { middleware: [incrementMiddleware, doubleMiddleware] }
    );

    // Update state
    setDeep('counter', 3);

    // Expected middleware application:
    // Initial: counter = 3
    // incrementMiddleware: counter = 3 + 1 = 4
    // doubleMiddleware: counter = 4 * 2 = 8

    expect(getState().counter).toBe(8);
  });
});
