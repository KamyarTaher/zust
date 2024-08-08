import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import {
  getNestedValue,
  setNestedValue,
  combineMiddlewares,
  stableHash,
  deepMerge,
} from "./utils";
import { createPersister } from "./persistConfig";
import { loggingMiddleware } from "../middleware";
import { devToolsPlugin } from "../plugins";
import type {
  StoreOptions,
  Store,
  StoreCreationResult,
  SelectorConfig,
  Path,
  PathValue,
  SetStateAction,
  SelectorResult,
  StoreCreator,
} from "../types";
import { StoreApi, UseBoundStore } from "zustand";

/**
 * Creates a generic store with advanced features like nested state management,
 * middleware support, computed values, plugins, and state persistence.
 *
 * @param initialState - The initial state of the store.
 * @param options - Configuration options for the store.
 * @returns The created store and utility functions.
 */
export function createStore<T extends object>(
  initialState: T,
  options: StoreOptions<T> = {}
): StoreCreationResult<T> {
  const {
    persist: persistOption = false,
    logging = false,
    middleware = [],
    computedValues = {},
    plugins = [],
    prefix = "",
  } = options;

  // Create a stable hash based on the structure and initial values of the state
  const stateHash = stableHash(initialState);
  // Use the options object's hash as an additional identifier
  const optionsHash = stableHash(options);
  // Combine hashes to create a unique but stable storage name
  const storageName = `store-${prefix}-${stateHash}-${optionsHash}`;

  const storeCreator = (set: any, get: any, api: any) => {
    const history = { past: [] as T[], future: [] as T[] };
    const listeners: ((state: T, prevState: T) => void)[] = [];

    const finalMiddleware = combineMiddlewares(middleware);

    /**
     * Sets a nested state value.
     *
     * @param path - Path to the nested value.
     * @param action - The new value or a function to produce the new value.
     */
    const setDeep = <P extends Path<T>>(
      path: P,
      action: SetStateAction<PathValue<T, P>>
    ) => {
      set((state: T) => {
        const newState = { ...state };
        const value =
          typeof action === "function"
            ? (action as Function)(getNestedValue(state, path))
            : action;
        setNestedValue(newState, path, value);

        // Save state history for undo/redo functionality
        history.past.push(JSON.parse(JSON.stringify(state)));
        history.future = [];

        const finalState = finalMiddleware((s) => s)(newState);

        // Notify listeners about the state change
        listeners.forEach((listener) => listener(finalState, state));
        return finalState;
      });
    };

    // Merge initial state with any persisted state
    const persistedState = api.getState();
    const mergedInitialState = deepMerge(initialState, persistedState);

    const store: Store<T> = {
      ...mergedInitialState,
      setDeep,
      dispatch: async (action) => {
        const state = get();
        await action(state, setDeep);
      },
      subscribe: (listener) => {
        listeners.push(listener);
        return () => {
          const index = listeners.indexOf(listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        };
      },
    };

    // Define computed values as properties on the store
    Object.entries(computedValues).forEach(([key, selector]) => {
      Object.defineProperty(store, key, {
        get: () => selector(get()),
        enumerable: true,
      });
    });

    // Initialize plugins and add their middlewares
    plugins.forEach((plugin) => {
      if (plugin.onInit) {
        plugin.onInit(store);
      }
      if (plugin.middleware) {
        middleware.push(plugin.middleware);
      }
    });

    return store;
  };

  let finalStoreCreator: any = storeCreator;

  // Add logging middleware if enabled
  if (logging) {
    finalStoreCreator = loggingMiddleware(finalStoreCreator);
  }

  // Add persistence middleware if enabled
  if (persistOption) {
    finalStoreCreator = createPersister(
      finalStoreCreator,
      persistOption,
      storageName
    );
  }

  const useStore: UseBoundStore<StoreApi<Store<T>>> = createWithEqualityFn<
    Store<T>
  >(storeCreator as StoreCreator<T>, shallow);

  /**
   * Custom hook to use selected parts of the state.
   *
   * @param selectors - List of selectors in the format "path:alias".
   * @returns The selected state values.
   */
  const useSelectors = <S extends SelectorConfig<T>[]>(
    ...selectors: S
  ): SelectorResult<T, S> => {
    return useStore((state) => {
      return selectors.reduce((acc, selector) => {
        const [path, alias] = (selector as string).split(":") as [
          string,
          string | undefined
        ];
        const key = alias || path.split(".").pop()!;
        (acc as any)[key] = getNestedValue(state, path);
        return acc;
      }, {} as SelectorResult<T, S>);
    });
  };

  // Initialize dev tools plugin
  devToolsPlugin(useStore, storageName, initialState);

  return {
    useStore,
    useSelectors,
    setDeep: useStore.getState().setDeep,
    subscribe: useStore.getState().subscribe,
    getState: useStore.getState,
  };
}
