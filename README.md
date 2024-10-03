# Zust State Management
[![npm version](https://img.shields.io/npm/v/zust)](https://www.npmjs.com/package/zust)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)

A lightweight and powerful state management library built on top of [Zustand](https://github.com/pmndrs/zustand). Zust provides a simple API and a minimalistic approach for managing application state with ease.

## Live Example

Check out this interactive example on CodeSandbox to see Zust in action:

[Open CodeSandbox Example](https://codesandbox.io/p/sandbox/zust-playground-34lrrp)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Usage with Aliases](#usage-with-aliases)
  - [Central Store vs. Multiple Stores](#central-store-vs-multiple-stores)
- [Persistence](#persistence)
- [API Reference](#api-reference)
  - [`createStore`](#createstore)
  - [`createPersistConfig`](#createpersistconfig)
  - [`loggingMiddleware`](#loggingmiddleware)
  - [`devToolsPlugin`](#devtoolsplugin)
- [Options](#options)
- [Tests](#tests)
- [License](#license)
- [Contributors ✨](#contributors-)

## Installation

Install `zust` using npm or bun:

To install `zust`, use one of the following commands:

```
npm install zust
```

or

```
bun install zust
```

## Usage

Here is a basic example of how to use Zust:

```javascript
import { createStore } from 'zust';

// Define the initial state
const initialState = {
  user: { name: 'John', age: 30 },
  settings: { theme: 'light' as "light" | "dark" },
};

// Create the store
const { useSelectors, setDeep } = createStore(initialState);

function ExampleComponent() {
  // Select state values
  const { name, theme } = useSelectors('user.name', 'settings.theme');

  // Update state values
  const updateName = () => setDeep('user.name', 'Jane');
  const toggleTheme = () => setDeep('settings.theme', (prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <div>
      <p>User Name: {name}</p>
      <p>Theme: {theme}</p>
      <button onClick={updateName}>Update User Name</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### Usage with Aliases

Aliases help avoid conflicts and clarify the usage of deeply nested properties. Use aliases by appending `:` to the path.

```javascript
import { createStore } from 'zust';

const initialState = {
  user: {
    profile: { name: 'John', email: 'john@example.com' },
    profile2: { name: 'Albert', email: 'albert@example.com' },
  },
  settings: { theme: 'dark' },
};

const { useSelectors, setDeep } = createStore(initialState);

function ExampleComponent() {
  const { name, secondName, theme } = useSelectors(
    'user.profile.name:name',
    'user.profile2.name:secondName',
    'settings.theme'
  );

  const updateSecondName = () => setDeep('user.profile2.name', 'Jane');

  return (
    <div>
      <p>User Name: {name}</p>
      <p>Second User Name: {secondName}</p>
      <p>Theme: {theme}</p>
      <button onClick={updateSecondName}>Update Second User Name</button>
    </div>
  );
}
```

### Central Store vs. Multiple Stores

You can create a single central store or multiple smaller stores, depending on your application's needs.

**Single Central Store Example:**

```javascript
import { createStore } from 'zust';

const initialState = {
  user: { name: 'John', age: 30 },
  settings: { theme: 'light' },
};

const { useSelectors, setDeep } = createStore(initialState);
```

**Multiple Smaller Stores Example:**

```javascript
import { createStore } from 'zust';

// User store
const userState = {
  name: 'John',
  age: 30,
};

const { useSelectors: useUserSelectors, setDeep: setUserDeep } = createStore(userState);

// Settings store
const settingsState = {
  theme: 'light',
};

const { useSelectors: useSettingsSelectors, setDeep: setSettingsDeep } = createStore(settingsState);

```

## Persistence

Zust allows you to persist parts of your state using localStorage. You can choose to persist entire branches or specific paths.

```javascript
import { createStore, createPersistConfig } from 'zust';

const initialState = {
  user: { name: 'John', age: 30 },
  settings: { theme: 'light', language: 'en' },
};

// Create the store with persistence
const { useSelectors, setDeep } = createStore(initialState, {
  persist: createPersistConfig('user', 'settings.theme'),
});

```
To persist the entire store, set `persist` to `true`:

```javascript
const { useSelectors, setDeep } = createStore(initialState, {
  persist: true,
});
```

## API Reference

### `createStore`

Creates a Zust store with the provided initial state and options.

**Parameters:**

- `initialState`: The initial state of the store.
- `options`: (optional): Configuration options.

**Returns:**

An object containing:

- `useStore`: The Zust store hook.
- `useSelectors`: A hook to select state values.
- `setDeep`: A function to update state values.
- `subscribe`: A function to subscribe to state changes.

### `createPersistConfig`

Creates a configuration object for state persistence.

**Parameters:**

- `...paths`: State paths to persist.

**Returns:**

A configuration object for persistence.

### `loggingMiddleware`

A middleware function for logging state changes.

#### Usage:

```javascript
const options = {
  middleware: [loggingMiddleware],
};

const { useSelectors, setDeep } = createStore(initialState, options);

```

### `devToolsPlugin`

Integrates the store with Redux DevTools for state debugging.

#### Usage:

```javascript
import { createStore, devToolsPlugin } from 'zust';

const initialState = { /* ... */ };

const { useStore } = createStore(initialState);

devToolsPlugin(useStore, 'MyZustStore', initialState);
```

## Options

### `StoreOptions<T>`

- **`persist?: boolean | PersistConfig<T>`**: : Enable or configure state persistence.

- **`prefix?: string`**: Prefix for the localStorage key.

- **`logging?: boolean`**: Enable console logging of state changes.

- **`middleware?: Middleware<T>[]`**: Array of middleware functions.

- **`computedValues?: { [key: string]: (state: T) => any }`**: Define computed values.

- **`plugins?: Plugin<T>[]`**: Array of plugins to enhance store behavior.


## Tests

Zust includes tests to verify its functionality:

- **Integration Tests**: Ensure hooks and state updates work correctly.
- **Unit Tests**: Test store creation, state updates, and middleware.

Contributions and pull requests for additional tests are welcome.

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
