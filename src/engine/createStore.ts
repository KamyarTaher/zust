/**
 * Core Store Engine - Standalone implementation without zustand
 * Uses React's useSyncExternalStore for optimal React 18+ integration
 */

import { useSyncExternalStore } from "react";

/**
 * Listener function that gets called when state changes
 */
type Listener<T> = (state: T, prevState: T) => void;

/**
 * Path-specific listener
 */
type PathListener<T> = {
  path: string;
  callback: (newValue: unknown, oldValue: unknown, fullState: T) => void;
};

/**
 * Subscription cleanup function
 */
type Unsubscribe = () => void;

/**
 * Core store API
 */
export interface StoreEngine<T extends object> {
  /** Get the current state */
  getState: () => T;

  /** Set the entire state or update partially */
  setState: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void;

  /** Subscribe to all state changes */
  subscribe: (listener: Listener<T>) => Unsubscribe;

  /** Subscribe to specific path changes */
  subscribePath: (path: string, callback: PathListener<T>["callback"]) => Unsubscribe;

  /** Destroy the store and cleanup */
  destroy: () => void;
}

/**
 * Batch update queue
 */
interface BatchQueue {
  updates: Array<() => void>;
  pending: boolean;
  timeout: ReturnType<typeof setTimeout> | null;
}

/**
 * Global batch queue for batched updates
 */
const batchQueue: BatchQueue = {
  updates: [],
  pending: false,
  timeout: null,
};

/**
 * Execute all queued updates
 */
function flushBatchQueue(): void {
  if (batchQueue.timeout) {
    clearTimeout(batchQueue.timeout);
    batchQueue.timeout = null;
  }

  const updates = [...batchQueue.updates];
  batchQueue.updates = [];
  batchQueue.pending = false;

  updates.forEach((update) => update());
}

/**
 * Batch multiple state updates into a single render
 */
export function batch(callback: () => void): void {
  const wasBatching = batchQueue.pending;
  batchQueue.pending = true;

  try {
    callback();
  } finally {
    if (!wasBatching) {
      // Schedule flush for next tick
      batchQueue.timeout = setTimeout(flushBatchQueue, 0);
    }
  }
}

/**
 * Shallow equality check for objects
 */
function shallowEqual<T>(objA: T, objB: T): boolean {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is((objA as Record<string, unknown>)[key], (objB as Record<string, unknown>)[key])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Get value at path (supports arrays and objects)
 */
function getPathValue<T>(obj: T, path: string): unknown {
  if (!path) return obj;

  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array indices
    if (Array.isArray(current)) {
      const index = parseInt(part, 10);
      if (isNaN(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Create a standalone store engine
 *
 * @param initialState - The initial state
 * @returns Store engine with getState, setState, subscribe, and destroy methods
 */
export function createStoreEngine<T extends object>(
  initialState: T
): StoreEngine<T> {
  let state: T = initialState;
  const listeners = new Set<Listener<T>>();
  const pathListeners = new Map<string, Set<PathListener<T>["callback"]>>();

  /**
   * Get the current state
   */
  const getState = (): T => state;

  /**
   * Notify all listeners of state change
   */
  const notifyListeners = (prevState: T, newState: T): void => {
    // Notify global listeners
    listeners.forEach((listener) => {
      try {
        listener(newState, prevState);
      } catch (error) {
        console.error("[Zust] Error in listener:", error);
      }
    });

    // Notify path-specific listeners
    pathListeners.forEach((callbacks, path) => {
      const oldValue = getPathValue(prevState, path);
      const newValue = getPathValue(newState, path);

      if (!Object.is(oldValue, newValue)) {
        callbacks.forEach((callback) => {
          try {
            callback(newValue, oldValue, newState);
          } catch (error) {
            console.error(`[Zust] Error in path listener for "${path}":`, error);
          }
        });
      }
    });
  };

  /**
   * Set state (with optional batching)
   */
  const setState = (
    partial: Partial<T> | ((state: T) => Partial<T>),
    replace = false
  ): void => {
    const prevState = state;
    const nextPartial = typeof partial === "function" ? partial(state) : partial;

    // Create new state
    const nextState = replace
      ? (nextPartial as T)
      : { ...state, ...nextPartial };

    // Only update if state actually changed
    if (!Object.is(prevState, nextState)) {
      state = nextState;

      // Schedule notification (batched or immediate)
      if (batchQueue.pending) {
        batchQueue.updates.push(() => notifyListeners(prevState, nextState));
      } else {
        notifyListeners(prevState, nextState);
      }
    }
  };

  /**
   * Subscribe to state changes
   */
  const subscribe = (listener: Listener<T>): Unsubscribe => {
    if (typeof listener !== "function") {
      throw new Error("[Zust] Listener must be a function");
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  /**
   * Subscribe to path-specific changes
   */
  const subscribePath = (
    path: string,
    callback: PathListener<T>["callback"]
  ): Unsubscribe => {
    if (!path || typeof path !== "string") {
      throw new Error("[Zust] Path must be a non-empty string");
    }

    if (typeof callback !== "function") {
      throw new Error("[Zust] Callback must be a function");
    }

    if (!pathListeners.has(path)) {
      pathListeners.set(path, new Set());
    }

    const callbacks = pathListeners.get(path)!;
    callbacks.add(callback);

    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        pathListeners.delete(path);
      }
    };
  };

  /**
   * Cleanup and destroy the store
   */
  const destroy = (): void => {
    listeners.clear();
    pathListeners.clear();
  };

  return {
    getState,
    setState,
    subscribe,
    subscribePath,
    destroy,
  };
}

/**
 * React hook to use the store
 */
export function useStore<T extends object>(
  store: StoreEngine<T>
): T {
  return useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState // For SSR
  );
}

/**
 * React hook to use a selector from the store
 */
export function useStoreSelector<T extends object, R>(
  store: StoreEngine<T>,
  selector: (state: T) => R
): R {
  // Memoize the selector with shallow equality
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()) // For SSR
  );
}

/**
 * React hook to use multiple selectors with shallow equality (optimized)
 */
export function useShallowSelector<T extends object, R extends object>(
  store: StoreEngine<T>,
  selector: (state: T) => R
): R {
  // Use a ref to store previous result for shallow comparison
  let lastResult: R | undefined;

  return useSyncExternalStore(
    (callback) => {
      return store.subscribe(() => {
        const nextResult = selector(store.getState());
        if (!lastResult || !shallowEqual(lastResult, nextResult)) {
          lastResult = nextResult;
          callback();
        }
      });
    },
    () => {
      const result = selector(store.getState());
      lastResult = result;
      return result;
    },
    () => {
      const result = selector(store.getState());
      lastResult = result;
      return result;
    }
  );
}
