// Core store
export { createStore, batch } from "./core";

// Persistence
export { createPersistConfig, StorageType, type PersisterOptions } from "./core/persistConfig";

// Middleware & Logging
export { LogLevel, type LoggingOptions } from "./middleware";

// Engine (advanced users)
export type {
  HistoryAPI,
  HistoryConfig,
  ComputedConfig,
  ComputedValues,
} from "./engine";

// Core types
export type {
  Store,
  StoreOptions,
  Plugin,
  Middleware,
  Path,
  PathValue,
  SelectorConfig,
  AsyncAction,
  SetStateAction,
} from "./types";
