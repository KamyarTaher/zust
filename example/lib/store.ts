/**
 * Zust Demo Store - Showcasing All Features
 */
import { createStore } from "zust";

// Clear any corrupted localStorage data from previous versions
if (typeof window !== "undefined") {
  // Clear zust-demo prefixed items
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("zust-demo")) {
      localStorage.removeItem(key);
    }
  });
}

// Define the state type
export interface AppState {
  // Basic state
  user: {
    name: string;
    email: string;
    age: number;
  };

  // Array state (for array path demo)
  todos: Array<{
    id: number;
    text: string;
    done: boolean;
  }>;

  // Counter for time-travel demo
  counter: number;

  // Async data fetching
  posts: Array<{
    id: number;
    title: string;
    body: string;
  }>;
  loading: boolean;
  error: string | null;

  // Theme
  theme: "light" | "dark";

  // Shopping cart for computed values
  cart: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
}

// Initial state
const initialState: AppState = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    age: 30,
  },
  todos: [
    { id: 1, text: "Learn Zust", done: false },
    { id: 2, text: "Build awesome app", done: false },
    { id: 3, text: "Deploy to production", done: false },
  ],
  counter: 0,
  posts: [],
  loading: false,
  error: null,
  theme: "light",
  cart: [
    { id: 1, name: "MacBook Pro", price: 2499, quantity: 1 },
    { id: 2, name: "Magic Mouse", price: 99, quantity: 2 },
    { id: 3, name: "AirPods Pro", price: 249, quantity: 1 },
  ],
};

// Create the store with all features enabled
export const store = createStore(initialState, {
  // Enable time-travel debugging
  history: {
    enabled: true,
    maxSize: 50,
    debounceMs: 100,
  },

  // Add computed values
  computedValues: {
    // Simple computed value
    fullName: (state) => `${state.user.name} (${state.user.age})`,

    // Computed with dependencies
    cartTotal: {
      compute: (state) =>
        state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      deps: ["cart"],
      cache: true,
    },

    cartItemCount: {
      compute: (state) => state.cart.reduce((sum, item) => sum + item.quantity, 0),
      deps: ["cart"],
      cache: true,
    },

    completedTodos: {
      compute: (state) => state.todos.filter((todo) => todo.done).length,
      deps: ["todos"],
      cache: true,
    },

    activeTodos: {
      compute: (state) => state.todos.filter((todo) => !todo.done).length,
      deps: ["todos"],
      cache: true,
    },
  },

  // Persistence disabled for demo to avoid localStorage conflicts
  // persist: true,
  // prefix: "zust-demo",
});

// Export hooks and methods
export const { useStore, useSelectors, getState, setDeep, subscribe, subscribePath, history } =
  store;

// Async action example
export const fetchPosts = async () => {
  const state = getState();

  await state.dispatch(async (state, setDeep) => {
    setDeep("loading", true);
    setDeep("error", null);

    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
      const data = await response.json();

      setDeep("posts", data);
    } catch (error) {
      setDeep("error", (error as Error).message);
    } finally {
      setDeep("loading", false);
    }
  });
};
