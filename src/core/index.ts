/**
 * Core Store - Now using standalone engine (no Zustand!)
 * This file maintains API compatibility while using our enhanced engine
 */

import {
  createStore as createStandaloneStore,
  batch,
  type StoreOptions as EngineOptions,
  type Middleware,
  type Plugin,
} from "../engine";

// Re-export types from types/index
import type {
  Store,
  StoreOptions,
  Path,
  PathValue,
  SetStateAction,
  SelectorConfig,
  SelectorResult,
} from "../types";

/**
 * Convert our enhanced options to engine options
 */
function convertOptions<T extends object>(
  options: StoreOptions<T>
): EngineOptions<T> {
  return {
    persist: options.persist as boolean | Record<string, boolean> | undefined,
    logging: options.logging,
    middleware: options.middleware,
    computed: options.computedValues, // Map computedValues -> computed
    plugins: options.plugins as import("../engine").Plugin<T>[] | undefined,
    prefix: options.prefix,
    history: options.history, // Pass through history config
  };
}

/**
 * Store creation result with our type system
 */
export interface StoreCreationResult<T> {
  useStore: () => Store<T>;
  useSelectors: <S extends SelectorConfig<T>[]>(
    ...selectors: S
  ) => SelectorResult<T, S>;
  getState: () => Store<T>;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void;
  setDeep: <P extends Path<T>>(
    path: P,
    action: SetStateAction<PathValue<T, P>>
  ) => void;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
  subscribePath: (
    path: string,
    callback: (newValue: unknown, oldValue: unknown, fullState: T) => void
  ) => () => void;
  destroy: () => void;
  history?: import("../engine").HistoryAPI;
}

/**
 * Creates a store using the standalone engine
 *
 * @param initialState - The initial state
 * @param options - Store configuration options
 * @returns Store creation result with hooks and utilities
 */
export function createStore<T extends object>(
  initialState: T,
  options: StoreOptions<T> = {}
): StoreCreationResult<T> {
  // Convert options format
  const engineOptions = convertOptions(options);

  // Create store using standalone engine
  const engine = createStandaloneStore(initialState, engineOptions);

  // Wrap and return with our type system
  return {
    useStore: engine.useStore as () => Store<T>,
    useSelectors: engine.useSelectors as <S extends SelectorConfig<T>[]>(
      ...selectors: S
    ) => SelectorResult<T, S>,
    getState: engine.getState as () => Store<T>,
    setState: engine.setState,
    setDeep: engine.setDeep as <P extends Path<T>>(
      path: P,
      action: SetStateAction<PathValue<T, P>>
    ) => void,
    subscribe: engine.subscribe,
    subscribePath: engine.subscribePath,
    destroy: engine.destroy,
    history: engine.history,
  };
}

// Re-export batch utility
export { batch };
export type { Middleware, Plugin };
