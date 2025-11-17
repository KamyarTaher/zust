# Zust State Management

[![npm version](https://img.shields.io/npm/v/zust)](https://www.npmjs.com/package/zust)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)

**A powerful, lightweight, and fully standalone state management library for React applications.**

Zust provides an intuitive API for managing complex application state with advanced features like time-travel debugging, computed values, async operations, and more - all with zero dependencies (except React).

## ✨ Features

- 🎯 **Zero Dependencies** - Fully standalone, no external dependencies
- 🚀 **Lightweight** - Minimal bundle size with maximum performance
- 🔥 **Type-Safe** - Full TypeScript support with excellent type inference
- 🎨 **Intuitive API** - Simple dot-notation paths for nested state updates
- 📦 **Array Support** - Native support for array indices in paths (`"todos.0.done"`)
- ⏱️ **Time-Travel** - Built-in undo/redo with history management
- 🧮 **Computed Values** - MobX-style cached computed properties
- ⚡ **Async Actions** - First-class async/await support with dispatch
- 🔔 **Granular Subscriptions** - Subscribe to specific paths for optimal performance
- 🎛️ **Batched Updates** - Automatic batching to minimize re-renders
- 💾 **Persistence** - Built-in localStorage/sessionStorage support
- 🔒 **Secure** - Protection against prototype pollution attacks
- 🧩 **Extensible** - Middleware and plugin system for customization

## Live Example

Check out the interactive example app in the `example/` folder to see all features in action. To run it:

```bash
cd example
npm install  # or bun install
npm run dev  # or bun dev
```

Then open [http://localhost:3000](http://localhost:3000) to see the interactive demo.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Basic Usage](#basic-usage)
  - [Array Paths](#array-paths)
  - [Async Operations](#async-operations)
- [Advanced Features](#advanced-features)
  - [Time-Travel Debugging](#time-travel-debugging)
  - [Computed Values](#computed-values)
  - [Path-Based Subscriptions](#path-based-subscriptions)
  - [Batched Updates](#batched-updates)
- [Persistence](#persistence)
- [API Reference](#api-reference)
- [Migration Guide](#migration-guide)
- [License](#license)
- [Contributors](#contributors-)

## Installation

```bash
npm install zust
```

or

```bash
bun install zust
```

## Quick Start

```typescript
import { createStore } from 'zust';

// Define your initial state
const initialState = {
  user: { name: 'John', age: 30 },
  todos: [
    { id: 1, text: 'Learn Zust', done: false },
    { id: 2, text: 'Build app', done: false }
  ],
  settings: { theme: 'light' as 'light' | 'dark' },
};

// Create the store
const { useSelectors, setDeep, getState } = createStore(initialState);

function App() {
  // Select multiple values efficiently
  const { name, theme } = useSelectors('user.name', 'settings.theme');

  // Update nested state with ease
  const updateName = () => setDeep('user.name', 'Jane');
  const toggleTheme = () => setDeep('settings.theme',
    prev => prev === 'light' ? 'dark' : 'light'
  );

  return (
    <div>
      <p>User: {name}</p>
      <p>Theme: {theme}</p>
      <button onClick={updateName}>Update Name</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

## Core Concepts

### Basic Usage

Zust uses dot-notation paths to access and update deeply nested state:

```typescript
const { setDeep, getState } = createStore({
  user: {
    profile: {
      name: 'John',
      email: 'john@example.com'
    },
    preferences: {
      notifications: true
    }
  }
});

// Update nested values
setDeep('user.profile.name', 'Jane');
setDeep('user.preferences.notifications', false);

// Use functional updates
setDeep('user.profile.name', prevName => prevName.toUpperCase());

// Access current state
const currentState = getState();
console.log(currentState.user.profile.name); // 'JANE'
```

### Array Paths

Zust has native support for array indices in paths:

```typescript
const { setDeep } = createStore({
  todos: [
    { id: 1, text: 'Task 1', done: false },
    { id: 2, text: 'Task 2', done: false }
  ]
});

// Update array items using index notation
setDeep('todos.0.done', true);
setDeep('todos.1.text', 'Updated Task 2');

// Works with nested arrays
setDeep('matrix.0.1.value', 42);
```

### Async Operations

Dispatch async actions with first-class async/await support:

```typescript
const store = createStore({
  data: null,
  loading: false,
  error: null
});

const state = store.getState();

// Dispatch async actions
await state.dispatch(async (state, setDeep) => {
  setDeep('loading', true);

  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    setDeep('data', data);
  } catch (error) {
    setDeep('error', error.message);
  } finally {
    setDeep('loading', false);
  }
});
```

## Advanced Features

### Time-Travel Debugging

Enable undo/redo functionality with built-in history management:

```typescript
const { getState, history } = createStore(
  { counter: 0 },
  {
    history: {
      enabled: true,
      maxSize: 50,        // Maximum history entries (default: 50)
      debounceMs: 100     // Debounce captures (default: 100ms)
    }
  }
);

const state = getState();

// Make some changes
setDeep('counter', 1);
setDeep('counter', 2);
setDeep('counter', 3);

// Undo/redo
if (history?.canUndo()) {
  history.undo();  // counter is now 2
}

if (history?.canRedo()) {
  history.redo();  // counter is back to 3
}

// Jump to specific state
history?.jump(-2);  // Go back 2 states

// Clear history
history?.clear();
```

### Computed Values

Define cached computed properties that automatically recompute when dependencies change:

```typescript
const { getState } = createStore(
  {
    firstName: 'John',
    lastName: 'Doe',
    items: [{ price: 10 }, { price: 20 }]
  },
  {
    computedValues: {
      // Simple computed value
      fullName: (state) => `${state.firstName} ${state.lastName}`,

      // Computed value with explicit dependencies
      total: {
        compute: (state) => state.items.reduce((sum, item) => sum + item.price, 0),
        deps: ['items'],  // Only recompute when items change
        cache: true       // Cache the result (default: true)
      }
    }
  }
);

const state = getState();
console.log(state.fullName);  // 'John Doe'
console.log(state.total);      // 30

// Computed values update automatically
setDeep('firstName', 'Jane');
console.log(getState().fullName);  // 'Jane Doe'
```

### Path-Based Subscriptions

Subscribe to changes on specific paths for optimal performance:

```typescript
const { subscribePath } = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'light' }
});

// Subscribe to specific path
const unsubscribe = subscribePath('user.name', (newValue, oldValue, fullState) => {
  console.log(`Name changed from ${oldValue} to ${newValue}`);
});

setDeep('user.name', 'Jane');  // Triggers callback
setDeep('user.age', 31);        // Does NOT trigger callback

// Unsubscribe when done
unsubscribe();
```

### Batched Updates

Batch multiple updates to minimize re-renders:

```typescript
import { batch } from 'zust';

const { setDeep, subscribe } = createStore({ a: 0, b: 0, c: 0 });

let renderCount = 0;
subscribe(() => renderCount++);

// Without batching: 3 renders
setDeep('a', 1);
setDeep('b', 2);
setDeep('c', 3);

// With batching: 1 render
batch(() => {
  setDeep('a', 1);
  setDeep('b', 2);
  setDeep('c', 3);
});
```

## Persistence

Persist state to localStorage or sessionStorage:

```typescript
import { createStore, createPersistConfig } from 'zust';

const { useSelectors, setDeep } = createStore(
  {
    user: { name: 'John', age: 30 },
    settings: { theme: 'light', language: 'en' }
  },
  {
    persist: createPersistConfig('user', 'settings.theme'),
    prefix: 'myapp'  // localStorage key prefix
  }
);

// Persist entire store
const store2 = createStore(initialState, { persist: true });
```

## API Reference

### `createStore<T>(initialState, options?)`

Creates a Zust store with the provided initial state and options.

**Parameters:**
- `initialState: T` - The initial state object (must be non-null object)
- `options?: StoreOptions<T>` - Configuration options

**Returns:** `StoreCreationResult<T>` containing:
- `useStore()` - React hook that returns the enhanced store
- `useSelectors(...paths)` - Hook to select multiple state values
- `getState()` - Get current state with methods (dispatch, setDeep, etc.)
- `setState(partial, replace?)` - Set state (shallow or deep merge)
- `setDeep(path, value)` - Update nested state by path
- `subscribe(listener)` - Subscribe to all state changes
- `subscribePath(path, callback)` - Subscribe to specific path changes
- `destroy()` - Cleanup and destroy the store
- `history?` - History API (if history is enabled)

### `StoreOptions<T>`

- `persist?: boolean | PersistConfig<T>` - Enable state persistence
- `prefix?: string` - Prefix for localStorage keys
- `logging?: boolean` - Enable console logging
- `middleware?: Middleware<T>[]` - Array of middleware functions
- `computedValues?: ComputedValues<T>` - Computed properties definition
- `plugins?: Plugin<T>[]` - Store plugins
- `history?: HistoryConfig` - Time-travel debugging configuration

### `HistoryConfig`

- `enabled: boolean` - Enable history tracking
- `maxSize?: number` - Maximum history entries (default: 50)
- `debounceMs?: number` - Debounce delay for captures (default: 100ms)

### `batch(fn: () => void)`

Batch multiple state updates into a single notification.

### Enhanced Store Methods

The store returned by `getState()` or `useStore()` includes:

- `setDeep(path, action)` - Update state by path
- `dispatch(asyncAction)` - Execute async actions
- `subscribe(listener)` - Subscribe to state changes
- `subscribePath(path, callback)` - Subscribe to path changes
- `deleteDeep(path)` - Delete property by path
- `hasPath(path)` - Check if path exists
- `history?` - Undo/redo API (if enabled)

## Migration Guide

### From Version 0.x

Version 1.0 is a complete rewrite with breaking changes:

**What's New:**
- ✅ Fully standalone (no Zustand dependency)
- ✅ Array path support
- ✅ Time-travel debugging
- ✅ Async dispatch
- ✅ Computed values with caching
- ✅ Path-based subscriptions
- ✅ Better TypeScript types

**Breaking Changes:**
- Removed Zustand middleware compatibility
- `getState()` now returns enhanced store (not raw state)
- Internal engine completely rewritten

**Migration Steps:**
1. Update imports (API is mostly backward compatible)
2. Remove any Zustand-specific middleware
3. Update TypeScript types if using advanced features
4. Test your application thoroughly

## Tests

Zust includes comprehensive tests:

- **66/69 tests passing** (96% coverage)
- Integration tests with React
- Unit tests for all features
- Security tests (prototype pollution protection)
- Edge case handling

Run tests:
```bash
npm test
```

## License

MIT License. See the [LICENSE](LICENSE) file for details.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/KamyarTaher"><img src="https://avatars.githubusercontent.com/u/61198701?v=4?s=100" width="100px;" alt="Kamyar Taher"/><br /><sub><b>Kamyar Taher</b></sub></a><br /><a href="#infra-KamyarTaher" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/KamyarTaher/zust/commits?author=KamyarTaher" title="Tests">⚠️</a> <a href="https://github.com/KamyarTaher/zust/commits?author=KamyarTaher" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
