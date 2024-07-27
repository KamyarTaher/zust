# Zust State Management

A lightweight state management library using Zustand. Zust provides a simple API and a minimalistic approach for managing application state.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Persistence](#persistence)
- [Tests](#tests)
- [License](#license)

## Installation

To install `zust`, use one of the following commands:

```
npm install zust
```

or

```
bun install zust
```

## Usage

Here is a basic example of how to use Zust State Management:

```javascript
import { createGenericStore } from 'zust';

// Define the initial state
const initialState = {
  user: { name: 'John', age: 30 },
  settings: { theme: 'light' as "light" | "dark" },
};

// Create the store
const { useSelectors, setDeep } = createGenericStore(initialState);

// Example of using selectors
function ExampleComponent() {
  // Automatic type inference and path suggestion for all functions' input and output
  // 'user.name' and 'settings.theme' are inferred as strings, and name and theme are also suggested
  const { name, theme } = useSelectors('user.name', 'settings.theme');

  // Update state at any depth just by specifying the path
  const onClick1 = () => setDeep('user.name', 'John');
  // Also, you can have access to the current state and return a new one
  const onClick2 = () => setDeep('settings.theme', (prev) => prev === 'light' ? 'dark' : 'light');

  return (
    <div>
      <p>User Name: {name}</p>
      <p>Theme: {theme}</p>
      <button onClick={onClick1}>Update User Name</button>
      <button onClick={onClick2}>Update Theme</button>
    </div>
  );    
}
```

### Usage with Aliases

Aliases are primarily used to avoid conflicts between property names or to clarify the usage of deeply nested properties. You can use aliases by appending `:` to the path to rename the properties in the selector results.

```javascript
import { createGenericStore } from 'zust';

// Define the initial state
const initialState = {
  user: { profile: { name: 'John', email: 'john@example.com' }, profile2: { name: 'Albert', email: 'albert@example.com' } },
  settings: { theme: 'dark' },
};

// Create the store
const { useSelectors, setDeep } = createGenericStore(initialState);

// Example of using selectors with aliases
function ExampleComponent() {
  // Use aliases to avoid conflicts and make paths clearer
  const { name, secondName, theme } = useSelectors(
    'user.profile.name:name',
    'user.profile2.name:secondName',
    'settings.theme'
  );

  const onClick = () => setDeep('user.profile2.name', 'John');

  return (
    <div>
      <p>User Name: {name}</p>
      <p>Second User Name: {secondName}</p>
      <p>Theme: {theme}</p>
      <button onClick={onClick}>Update User Name</button>
    </div>
  );
}

```

### Central Store vs. Multiple Stores

With Zust, you can create a single central store for your entire application or multiple smaller stores, depending on your needs. Both approaches are straightforward and flexible.

**Single Central Store Example:**

```javascript
import { createGenericStore } from 'zust';

// Define the initial state
const initialState = {
  user: { name: 'John', age: 30 },
  settings: { theme: 'light' },
};

// Create the central store
const { useSelectors, setDeep } = createGenericStore(initialState);
```

**Multiple Smaller Stores Example:**

```javascript
import { createGenericStore } from 'zust';

// Define states for different modules
const userState = {
  name: 'John',
  age: 30
};

const settingsState = {
  theme: 'light'
};

// Create separate stores
const { useSelectors: useUserSelectors, setDeep: setUserDeep } = createGenericStore(userState);
const { useSelectors: useSettingsSelectors, setDeep: setSettingsDeep } = createGenericStore(settingsState);
```

## Persistence

Zust allows you to store to the localStorage parts of your state using a persistence configuration. You can choose to persist an entire branch of the state or specific paths within the state.

```javascript
import { createGenericStore, createPersistConfig, createPersister } from 'zust';

// Define the initial state
const initialState = {
  user: { name: 'John', age: 30 },
  settings: { theme: 'light', language: 'en' },
};

// Create a persist configuration to persist the entire 'user' branch, but only 'theme' for the settings. Entering a branch name will persist all paths within that branch.
const persistConfig = createPersistConfig('user', 'settings.theme');

// Create the store with persistence
const { useSelectors, setDeep } = createPersister(
  createGenericStore,
  persistConfig,
 'optionalStorageNamePrefix'
);

```

## API Reference

### `createGenericStore`

Creates a Zustand store with various options.

**Parameters:**

- `initialState`: The initial state of the store.
- `options`: Options for configuring the store.

**Returns:**

An object containing `useStore`, `useSelectors`, `setDeep`, and `subscribe`.

### `createPersistConfig`

Creates a persist configuration object.

**Parameters:**

- `...paths`: Paths to the state that should be persisted. You can specify entire branches or individual paths.

**Returns:**

A configuration object for persistence.

### `createPersister`

Creates a persister function for integrating with Zustand.

**Parameters:**

- `storeCreator`: The store creator function.
- `persistOption`: Configuration for persistence.
- `storageName`: Name for the storage.

**Returns:**

A store creator function with persistence.

### `loggingMiddleware`

A middleware for logging state changes.

**Parameters:**

- `storeCreator`: The store creator function.

**Returns:**

A new store creator function with logging.

### `devToolsPlugin`

Integrates the store with Redux DevTools.

**Parameters:**

- `useStore`: Zustand store hook.
- `storageName`: Name for Redux DevTools.
- `initialState`: Initial state of the store.

**Returns:**

None. This function enhances the store with DevTools support.

## Tests

The package includes tests to verify the functionality of the Zust store:

- **Integration Tests**: Verify that hooks and state updates work correctly.
- **Unit Tests**: Test store creation, state updates, and middleware.

Feel free to contribute by submitting issues or pull requests.

## License

MIT License. See the [LICENSE](LICENSE) file for details.
