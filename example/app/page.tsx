"use client";

import { useSelectors, setDeep, history, fetchPosts } from "@/lib/store";
import { batch } from "zust";
import { useEffect } from "react";

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
      </div>
    </div>
  );
}

function BasicStateDemo() {
  const { name, email, age } = useSelectors("user.name", "user.email", "user.age");

  return (
    <div className="card">
      <h2>Basic State Management</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        Update nested state with dot notation
      </p>

      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setDeep("user.name", e.target.value)}
          placeholder="Name"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setDeep("user.email", e.target.value)}
          placeholder="Email"
        />
        <input
          type="number"
          value={age}
          onChange={(e) => setDeep("user.age", parseInt(e.target.value) || 0)}
          placeholder="Age"
        />
      </div>

      <div style={{ marginTop: "1rem", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
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

  return (
    <div className="card">
      <h2>Array Paths</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        Access array items with index notation: todos.0.done
      </p>

      {todos?.map((todo, index) => (
        <div key={todo.id} className={`todo-item ${todo.done ? "completed" : ""}`}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => setDeep(`todos.${index}.done`, !todo.done)}
          />
          <span style={{ flex: 1 }}>{todo.text}</span>
        </div>
      ))}

      <button
        onClick={() =>
          setDeep("todos", (prev: any[]) => [
            ...prev,
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
        <button
          onClick={() => setDeep("counter", (c: number) => c + 1)}
          style={{ flex: 1 }}
        >
          Increment
        </button>
        <button
          onClick={() => setDeep("counter", (c: number) => c - 1)}
          style={{ flex: 1 }}
        >
          Decrement
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => history?.undo()}
          disabled={!history?.canUndo()}
          style={{ flex: 1 }}
        >
          ⏪ Undo
        </button>
        <button
          onClick={() => history?.redo()}
          disabled={!history?.canRedo()}
          style={{ flex: 1 }}
        >
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
  const state = useSelectors("fullName", "completedTodos", "activeTodos", "todos");
  const fullName = (state as any).fullName;
  const completedTodos = (state as any).completedTodos;
  const activeTodos = (state as any).activeTodos;

  return (
    <div className="card">
      <h2>Computed Values</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        Cached computed properties with dependency tracking
      </p>

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

      <div style={{ marginTop: "1rem", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
        <strong>Computed Full Name:</strong>
        <div style={{ fontSize: "1.25rem", color: "#667eea", marginTop: "0.5rem" }}>
          {fullName}
        </div>
      </div>
    </div>
  );
}

function AsyncDispatchDemo() {
  const { posts, loading, error } = useSelectors("posts", "loading", "error");

  return (
    <div className="card">
      <h2>Async Dispatch</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        First-class async/await support
      </p>

      <button onClick={fetchPosts} disabled={loading} style={{ width: "100%", marginBottom: "1rem" }}>
        {loading ? "Loading..." : "Fetch Posts"}
      </button>

      {error && <div className="error">Error: {error}</div>}

      {loading && <div className="loading">Fetching posts...</div>}

      {posts?.slice(0, 3).map((post) => (
        <div key={post.id} className="post">
          <h3>{post.title}</h3>
          <p>{post.body.substring(0, 100)}...</p>
        </div>
      ))}
    </div>
  );
}

function ShoppingCartDemo() {
  const state = useSelectors("cart", "cartTotal", "cartItemCount");
  const cart = state.cart;
  const cartTotal = (state as any).cartTotal;
  const cartItemCount = (state as any).cartItemCount;

  const updateQuantity = (index: number, delta: number) => {
    batch(() => {
      setDeep(`cart.${index}.quantity`, (q: number) => Math.max(0, q + delta));
    });
  };

  return (
    <div className="card">
      <h2>Shopping Cart + Batching</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        Batch updates to minimize re-renders
      </p>

      {cart?.map((item, index) => (
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
