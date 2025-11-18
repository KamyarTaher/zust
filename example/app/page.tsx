"use client";

import { useSelectors, setDeep, history, fetchPosts, type AppState, type AppStateWithComputed } from "@/lib/store";
import { batch, createStore } from "zust";
import { useEffect, useState } from "react";

export default function Home() {
  const { theme } = useSelectors("theme");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.className = theme;
    }
  }, [theme]);

  return (
    <div className="container">
      <div className="header">
        <h1>🚀 Zust State Management</h1>
        <p>Comprehensive demo showcasing all powerful features</p>
      </div>

      <button
        className="theme-toggle"
        onClick={() => setDeep("theme", theme === "light" ? "dark" : "light")}
        title="Toggle theme"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      <div className="grid">
        {/* Basic State Management */}
        <BasicStateDemo />

        {/* Array Paths */}
        <ArrayPathsDemo />

        {/* Time-Travel Debugging */}
        <TimeTravelDemo />

        {/* Computed Values */}
        <ComputedValuesDemo />

        {/* Async Dispatch */}
        <AsyncDispatchDemo />

        {/* Shopping Cart with Batching */}
        <ShoppingCartDemo />

        {/* Persistence Demo */}
        <PersistenceDemo />
      </div>
    </div>
  );
}

function BasicStateDemo() {
  const { name, email, age } = useSelectors("user.name", "user.email", "user.age");

  return (
    <div className="card">
      <h2>Basic State Management</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>Update nested state with dot notation</p>

      <div>
        <input
          type="text"
          value={name || ""}
          onChange={(e) => setDeep("user.name", e.target.value)}
          placeholder="Name"
        />
        <input
          type="email"
          value={email || ""}
          onChange={(e) => setDeep("user.email", e.target.value)}
          placeholder="Email"
        />
        <input
          type="number"
          value={age ?? ""}
          onChange={(e) => setDeep("user.age", parseInt(e.target.value) || 0)}
          placeholder="Age"
        />
      </div>

      <div
        style={{ marginTop: "1rem", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}
      >
        <strong>Live Values:</strong>
        <div>Name: {name}</div>
        <div>Email: {email}</div>
        <div>Age: {age}</div>
      </div>
    </div>
  );
}

function ArrayPathsDemo() {
  const { todos } = useSelectors("todos");
  const todosList = todos || [];

  return (
    <div className="card">
      <h2>Array Paths</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        Access array items with index notation: todos.0.done
      </p>

      {Array.isArray(todosList) &&
        todosList.map((todo, index) => (
          <div key={todo.id} className={`todo-item ${todo.done ? "completed" : ""}`}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => setDeep(`todos.${index}.done`, (prev: boolean) => !prev)}
            />
            <span style={{ flex: 1 }}>{todo.text}</span>
          </div>
        ))}

      <button
        onClick={() =>
          setDeep("todos", (prev: AppState["todos"]) => [
            ...(Array.isArray(prev) ? prev : []),
            { id: Date.now(), text: "New Task", done: false },
          ])
        }
        style={{ marginTop: "1rem", width: "100%" }}
      >
        Add Todo
      </button>
    </div>
  );
}

function TimeTravelDemo() {
  const { counter } = useSelectors("counter");

  return (
    <div className="card">
      <h2>Time-Travel Debugging</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        Undo/redo with built-in history management
      </p>

      <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
        <div style={{ fontSize: "3rem", fontWeight: "700", color: "#667eea" }}>{counter}</div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button onClick={() => setDeep("counter", (c: number) => c + 1)} style={{ flex: 1 }}>
          Increment
        </button>
        <button onClick={() => setDeep("counter", (c: number) => c - 1)} style={{ flex: 1 }}>
          Decrement
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={() => history?.undo()} disabled={!history?.canUndo()} style={{ flex: 1 }}>
          ⏪ Undo
        </button>
        <button onClick={() => history?.redo()} disabled={!history?.canRedo()} style={{ flex: 1 }}>
          Redo ⏩
        </button>
      </div>

      <button
        onClick={() => history?.clear()}
        style={{ marginTop: "0.5rem", width: "100%", opacity: 0.7 }}
      >
        Clear History
      </button>
    </div>
  );
}

function ComputedValuesDemo() {
  const state = useSelectors("fullName", "completedTodos", "activeTodos", "user.name", "user.age") as unknown as AppStateWithComputed & { name: string; age: number };
  const fullName = state.fullName;
  const completedTodos = state.completedTodos;
  const activeTodos = state.activeTodos;
  const name = state.name;
  const age = state.age;

  return (
    <div className="card">
      <h2>Computed Values (Interactive)</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        Cached computed properties with dependency tracking. Change name/age to see fullName update!
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={name || ""}
          onChange={(e) => setDeep("user.name", e.target.value)}
          placeholder="Name"
          style={{ marginBottom: "0.5rem" }}
        />
        <input
          type="number"
          value={age ?? ""}
          onChange={(e) => setDeep("user.age", parseInt(e.target.value) || 0)}
          placeholder="Age"
        />
      </div>

      <div
        style={{ marginBottom: "1rem", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}
      >
        <strong>Computed Full Name:</strong>
        <div style={{ fontSize: "1.25rem", color: "#667eea", marginTop: "0.5rem" }}>{fullName}</div>
      </div>

      <div className="stats">
        <div className="stat-box">
          <div className="label">Completed</div>
          <div className="value">{completedTodos}</div>
        </div>
        <div className="stat-box">
          <div className="label">Active</div>
          <div className="value">{activeTodos}</div>
        </div>
      </div>
    </div>
  );
}

function AsyncDispatchDemo() {
  const { posts, loading, error } = useSelectors("posts", "loading", "error");
  const postsList = posts || [];

  return (
    <div className="card">
      <h2>Async Dispatch</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>First-class async/await support</p>

      <button
        onClick={fetchPosts}
        disabled={loading}
        style={{ width: "100%", marginBottom: "1rem" }}
      >
        {loading ? "Loading..." : "Fetch Posts"}
      </button>

      {error && <div className="error">Error: {error}</div>}

      {loading && <div className="loading">Fetching posts...</div>}

      {Array.isArray(postsList) &&
        postsList.slice(0, 3).map((post) => (
          <div key={post.id} className="post">
            <h3>{post.title}</h3>
            <p>{post.body.substring(0, 100)}...</p>
          </div>
        ))}
    </div>
  );
}

function ShoppingCartDemo() {
  const state = useSelectors("cart", "cartTotal", "cartItemCount") as unknown as AppStateWithComputed;
  const cart = state.cart || [];
  const cartTotal = state.cartTotal || 0;
  const cartItemCount = state.cartItemCount || 0;

  const updateQuantity = (index: number, delta: number) => {
    batch(() => {
      setDeep(`cart.${index}.quantity`, (q: number) => Math.max(0, q + delta));
    });
  };

  return (
    <div className="card">
      <h2>Shopping Cart + Batching</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>Batch updates to minimize re-renders</p>

      {Array.isArray(cart) &&
        cart.map((item, index) => (
          <div key={item.id} className="cart-item">
            <div>
              <strong>{item.name}</strong>
              <div style={{ fontSize: "0.875rem", color: "#666" }}>
                ${item.price} × {item.quantity}
              </div>
            </div>
            <div className="cart-controls">
              <button onClick={() => updateQuantity(index, -1)}>-</button>
              <span style={{ minWidth: "30px", textAlign: "center" }}>{item.quantity}</span>
              <button onClick={() => updateQuantity(index, 1)}>+</button>
            </div>
          </div>
        ))}

      <div className="stats" style={{ marginTop: "1rem" }}>
        <div className="stat-box">
          <div className="label">Total Items</div>
          <div className="value">{cartItemCount}</div>
        </div>
        <div className="stat-box">
          <div className="label">Total Price</div>
          <div className="value">${cartTotal}</div>
        </div>
      </div>
    </div>
  );
}

// Separate persistence store to demonstrate the feature
const persistStore = createStore(
  {
    notes: "",
    savedAt: null as string | null,
  },
  {
    persist: true,
    prefix: "zust-persist-demo",
  }
);

function PersistenceDemo() {
  const { useSelectors, setDeep } = persistStore;
  const { notes, savedAt } = useSelectors("notes", "savedAt");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="card">
      <h2>Persistence (localStorage)</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        Data persists across page reloads. Try refreshing the page!
      </p>

      <textarea
        value={notes || ""}
        onChange={(e) => {
          setDeep("notes", e.target.value);
          setDeep("savedAt", new Date().toLocaleTimeString());
        }}
        placeholder="Type your notes here... (auto-saved to localStorage)"
        rows={6}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
      />

      <div
        style={{ padding: "0.75rem", background: "#f8f9fa", borderRadius: "8px", fontSize: "0.875rem" }}
        suppressHydrationWarning
      >
        {mounted && savedAt ? (
          <>
            <strong>Last saved:</strong> {savedAt}
          </>
        ) : (
          <span style={{ color: "#999" }}>Type something to save...</span>
        )}
      </div>

      <button
        onClick={() => {
          if (typeof window !== "undefined") {
            localStorage.removeItem("zust-persist-demo-notes");
            localStorage.removeItem("zust-persist-demo-savedAt");
            setDeep("notes", "");
            setDeep("savedAt", null);
          }
        }}
        style={{ marginTop: "1rem", width: "100%", opacity: 0.7 }}
      >
        Clear Saved Data
      </button>
    </div>
  );
}
