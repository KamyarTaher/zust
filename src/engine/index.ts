/**
 * Main Standalone Store Implementation - No Zustand dependency
 * Combines all engines into the ultimate state manager
 */

import { useSyncExternalStore, useCallback, useRef } from "react";
import { createStoreEngine, batch } from "./createStore";
import {
  getNestedValue,
  setNestedValue,
  deleteNestedValue,
  hasPath,
  getLastPart,
} from "./pathUtils";
import { HistoryManager, type HistoryConfig, type HistoryAPI } from "./historyManager";
import {
  ComputedEngine,
  type ComputedValues,
  type ComputedConfig,
} from "./computedEngine";
import { createPersister } from "../core/persistConfig";

/**
 * Middleware function type
 */
export type Middleware<T extends object> = (
  next: (state: T) => T
) => (state: T) => T;

/**
 * Plugin type
 */
export interface Plugin<T extends object> {
  onInit?: (store: EnhancedStore<T>) => void;
  middleware?: Middleware<T>;
}

/**
 * Async action type
 */
export type AsyncAction<T> = (
  state: T,
  setDeep: <P extends string>(path: P, action: unknown | ((prev: unknown) => unknown)) => void
) => Promise<void>;

/**
 * Store options
 */
export interface StoreOptions<T extends object> {
  /** Enable persistence */
  persist?: boolean | Record<string, boolean>;
  /** Enable logging */
  logging?: boolean;
  /** Middleware functions */
  middleware?: Middleware<T>[];
  /** Computed values with caching */
  computed?: ComputedValues<T>;
  /** Plugins */
  plugins?: Plugin<T>[];
  /** Storage prefix */
  prefix?: string;
  /** History configuration */
  history?: HistoryConfig;
}

/**
 * Enhanced store methods
 */
export interface EnhancedStoreMethods<T extends object> {
  setDeep: <P extends string>(
    path: P,
    action: unknown | ((prev: unknown) => unknown)
  ) => void;
  dispatch: (action: AsyncAction<T>) => Promise<void>;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
  subscribePath: (
    path: string,
    callback: (newValue: unknown, oldValue: unknown, fullState: T) => void
  ) => () => void;
  history?: HistoryAPI;
  deleteDeep: (path: string) => boolean;
  hasPath: (path: string) => boolean;
}

/**
 * Enhanced store with all features (state + methods)
 */
export type EnhancedStore<T extends object> = T & EnhancedStoreMethods<T>;

/**
 * Store creation result
 */
export interface StoreCreationResult<T extends object> {
  useStore: () => EnhancedStore<T>;
  useSelectors: <Paths extends string[]>(
    ...selectors: Paths
  ) => Record<string, unknown>;
  getState: () => EnhancedStore<T>;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void;
  setDeep: <P extends string>(path: P, action: unknown | ((prev: unknown) => unknown)) => void;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
  subscribePath: (
    path: string,
    callback: (newValue: unknown, oldValue: unknown, fullState: T) => void
  ) => () => void;
  destroy: () => void;
  history?: HistoryAPI;
}

/**
 * Shallow equality for objects
 */
function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Combine multiple middleware functions
 */
function combineMiddlewares<T extends object>(
  middlewares: Middleware<T>[]
): Middleware<T> {
  if (!Array.isArray(middlewares) || middlewares.length === 0) {
    return (next) => next;
  }

  return middlewares.reduce<Middleware<T>>(
    (composed, current) => (next) => composed(current(next)),
    (next) => next
  );
}

/**
 * Create an enhanced standalone store
 */
export function createStore<T extends object>(
  initialState: T,
  options: StoreOptions<T> = {}
): StoreCreationResult<T> {
  // Validate initial state
  if (!initialState || typeof initialState !== "object" || Array.isArray(initialState)) {
    throw new Error("[Zust] Initial state must be a non-null object");
  }

  const {
    middleware = [],
    computed = {},
    plugins = [],
    history: historyConfig,
    persist,
    prefix = "zust",
  } = options;

  // Create persister if persistence is enabled
  const persister = persist
    ? createPersister<T>(prefix, {})
    : null;

  // Debounce timer for persistence
  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  const PERSIST_DEBOUNCE_MS = 100;

  // Create core store engine with initial state
  const engine = createStoreEngine<T>(initialState);

  // Load persisted state asynchronously and hydrate
  if (persister) {
    persister.load().then((persistedState) => {
      if (persistedState && Object.keys(persistedState).length > 0) {
        // Merge persisted state with current state
        const currentState = engine.getState();
        const hydratedState = { ...currentState, ...persistedState };
        engine.setState(hydratedState as Partial<T>, true);
      }
    }).catch((error) => {
      console.error("[Zust] Failed to load persisted state:", error);
    });
  }

  // Create computed engine
  const computedEngine = new ComputedEngine(engine.getState, computed);

  // Create history manager (if enabled)
  const historyManager = historyConfig?.enabled
    ? new HistoryManager<T>(
        initialState,
        (state) => engine.setState(state as Partial<T>, true),
        historyConfig
      )
    : null;

  // Combine all middleware
  const finalMiddleware = combineMiddlewares(middleware);

  // Create setDeep function
  const setDeep = <P extends string>(
    path: P,
    action: unknown | ((prev: unknown) => unknown)
  ): void => {
    try {
      const currentState = engine.getState();

      // Create a deep copy to avoid mutating the current state
      // Using structuredClone for safer deep cloning (supports Date, Map, Set, etc.)
      const newState = (typeof structuredClone !== "undefined"
        ? structuredClone(currentState)
        : JSON.parse(JSON.stringify(currentState))) as Record<string, unknown>;

      const currentValue = getNestedValue(currentState, path);
      const value = typeof action === "function"
        ? (action as (prev: unknown) => unknown)(currentValue)
        : action;

      setNestedValue(newState, path, value);

      // Apply middleware
      const finalState = finalMiddleware((s) => s)(newState as T);

      // Update state (pass the whole state with replace=true to avoid shallow merge issues)
      engine.setState(finalState as Partial<T>, true);

      // Persist state with debouncing if enabled
      if (persister) {
        if (persistTimer) {
          clearTimeout(persistTimer);
        }
        persistTimer = setTimeout(() => {
          persister.save(finalState, persist).catch((error) => {
            console.error("[Zust] Failed to persist state:", error);
          });
        }, PERSIST_DEBOUNCE_MS);
      }

      // Capture history
      if (historyManager) {
        historyManager.capture(finalState);
      }

      // Invalidate affected computed values
      const toInvalidate = computedEngine.shouldInvalidate(path);
      toInvalidate.forEach((key) => computedEngine.invalidate(key));
    } catch (error) {
      console.error(`[Zust] Failed to set deep value at path "${path}":`, error);
      throw error;
    }
  };

  // Create enhanced store object
  const createEnhancedStore = (): EnhancedStore<T> => {
    const state = engine.getState();
    const enhancedStore = {
      ...state,
      setDeep,
      dispatch: async (action: AsyncAction<T>) => {
        try {
          const currentState = engine.getState();
          await action(currentState, setDeep);
        } catch (error) {
          console.error("[Zust] Error dispatching action:", error);
          throw error;
        }
      },
      subscribe: engine.subscribe,
      subscribePath: engine.subscribePath,
      deleteDeep: (path: string) => {
        const newState = { ...engine.getState() } as Record<string, unknown>;
        const deleted = deleteNestedValue(newState, path);
        if (deleted) {
          engine.setState(newState as Partial<T>);
        }
        return deleted;
      },
      hasPath: (path: string) => hasPath(engine.getState(), path),
    } as EnhancedStore<T>;

    // Add computed values as getters
    computedEngine.defineGetters(enhancedStore as unknown as Record<string, unknown>);

    // Add history API if enabled
    if (historyManager) {
      enhancedStore.history = historyManager.getAPI();
    }

    return enhancedStore;
  };

  // Initialize plugins
  const enhancedStore = createEnhancedStore();
  plugins.forEach((plugin) => {
    try {
      if (plugin.onInit) {
        plugin.onInit(enhancedStore);
      }
      if (plugin.middleware) {
        middleware.push(plugin.middleware);
      }
    } catch (error) {
      console.error("[Zust] Error initializing plugin:", error);
    }
  });

  // React hook to use the store
  const useStore = (): EnhancedStore<T> => {
    const state = useSyncExternalStore(
      engine.subscribe,
      engine.getState,
      engine.getState
    );

    return {
      ...state,
      ...enhancedStore,
    } as EnhancedStore<T>;
  };

  // React hook to use selectors with memoization
  const useSelectors = <Paths extends string[]>(
    ...selectors: Paths
  ): Record<string, unknown> => {
    // Cache to store the last snapshot
    const cache = useRef<{
      state: T | null;
      snapshot: Record<string, unknown> | null;
    }>({ state: null, snapshot: null });

    // Memoize the selector function
    const selector = useCallback(
      (state: T): Record<string, unknown> => {
        // Check if state hasn't changed
        if (cache.current.state === state && cache.current.snapshot) {
          return cache.current.snapshot;
        }

        const result: Record<string, unknown> = {};

        for (const path of selectors) {
          try {
            const [fullPath, alias] = (path as string).split(":") as [string, string | undefined];
            const key = alias ?? getLastPart(fullPath);
            result[key] = getNestedValue(state, fullPath);
          } catch (error) {
            console.error(`[Zust] Error selecting path "${path}":`, error);
            result[path] = undefined;
          }
        }

        // Cache the result with shallow equality check
        if (cache.current.snapshot && shallowEqual(cache.current.snapshot, result)) {
          return cache.current.snapshot;
        }

        cache.current = { state, snapshot: result };
        return result;
      },
      [selectors.join(",")]
    );

    return useSyncExternalStore(
      engine.subscribe,
      () => selector(engine.getState()),
      () => selector(engine.getState())
    );
  };

  // Cleanup function
  const destroy = (): void => {
    // Clear any pending persist timer
    if (persistTimer) {
      clearTimeout(persistTimer);
    }

    engine.destroy();
    computedEngine.destroy();
    if (historyManager) {
      historyManager.destroy();
    }
  };

  // Cache for getState to return consistent reference
  let cachedEnhancedStore: EnhancedStore<T> | null = null;
  let lastRawState: T | null = null;

  // Create a getState wrapper that includes computed values and methods
  const getStateWithComputed = (): EnhancedStore<T> => {
    const state = engine.getState();

    // Return cached version if state hasn't changed
    if (cachedEnhancedStore && lastRawState === state) {
      return cachedEnhancedStore;
    }

    const enhanced = {
      ...state,
      setDeep,
      dispatch: async (action: AsyncAction<T>) => {
        try {
          const currentState = engine.getState();
          await action(currentState, setDeep);
        } catch (error) {
          console.error("[Zust] Error dispatching action:", error);
          throw error;
        }
      },
      subscribe: engine.subscribe,
      subscribePath: engine.subscribePath,
      deleteDeep: (path: string) => {
        const newState = typeof structuredClone !== "undefined"
          ? structuredClone(engine.getState())
          : JSON.parse(JSON.stringify(engine.getState()));
        const deleted = deleteNestedValue(newState, path);
        if (deleted) {
          engine.setState(newState as Partial<T>, true);
        }
        return deleted;
      },
      hasPath: (path: string) => hasPath(engine.getState(), path),
    } as EnhancedStore<T>;

    // Add computed values as getters
    computedEngine.defineGetters(enhanced as unknown as Record<string, unknown>);

    // Add history API if enabled
    if (historyManager) {
      enhanced.history = historyManager.getAPI();
    }

    // Cache for next call
    cachedEnhancedStore = enhanced;
    lastRawState = state;

    return enhanced;
  };

  return {
    useStore,
    useSelectors,
    getState: getStateWithComputed,
    setState: engine.setState,
    setDeep,
    subscribe: engine.subscribe,
    subscribePath: engine.subscribePath,
    destroy,
    history: historyManager?.getAPI(),
  };
}

// Re-export utilities
export { batch };
export type { HistoryAPI, HistoryConfig, ComputedConfig, ComputedValues };
