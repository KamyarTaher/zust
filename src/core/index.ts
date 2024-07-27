import { create, StateCreator } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { persist, createJSONStorage, PersistOptions } from "zustand/middleware";
import {
  getNestedValue,
  setNestedValue,
  getLastPart,
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
} from "../types";

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

  const stateHash = stableHash(initialState);
  const optionsHash = stableHash(options);
  const storageName = `store-${prefix}-${stateHash}-${optionsHash}`;

  const storeCreator = (set: any, get: any, api: any) => {
    const finalMiddleware = combineMiddlewares(middleware);

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
        return finalMiddleware((s) => s)(newState);
      });
    };

    const persistedState = api.getState();
    const mergedInitialState = deepMerge(initialState, persistedState);

    const store: Store<T> = {
      ...mergedInitialState,
      setDeep,
      dispatch: async (action) => {
        const state = get();
        await action(state, setDeep);
      },
      subscribe: (listener) => set(null, true, listener),
    };

    Object.entries(computedValues).forEach(([key, selector]) => {
      Object.defineProperty(store, key, {
        get: () => selector(get()),
        enumerable: true,
      });
    });

    plugins.forEach((plugin) => {
      if (plugin.onInit) plugin.onInit(store);
      if (plugin.middleware) middleware.push(plugin.middleware);
    });

    return store;
  };

  let finalStoreCreator: any = storeCreator;

  if (logging) {
    finalStoreCreator = loggingMiddleware(finalStoreCreator);
  }

  if (persistOption) {
    const persistConfig: PersistOptions<Store<T>, unknown> = {
      name: storageName,
      storage: createJSONStorage(() => localStorage),
    };

    if (typeof persistOption === "object") {
      (persistConfig as any).partialize = (state: Store<T>) =>
        Object.fromEntries(
          Object.entries(persistOption)
            .filter(([_, v]) => v)
            .map(([k]) => [k, state[k as keyof T]])
        ) as Partial<T>;
    } else if (typeof persistOption === "function") {
      (persistConfig as any).partialize = persistOption;
    }

    finalStoreCreator = persist(
      finalStoreCreator as StateCreator<Store<T>, [], []>,
      persistConfig
    );
  }
  const useStore = create<Store<T>>(finalStoreCreator);

  function useSelectors<S extends SelectorConfig<T>[]>(...selectors: S) {
    return useStore(
      useShallow((state) => {
        return selectors.reduce((acc, selector) => {
          const [path, alias] = (selector as string).split(":") as [
            string,
            string | undefined
          ];
          const key = alias || getLastPart(path);
          (acc as any)[key] = getNestedValue(state, path);
          return acc;
        }, {} as any);
      })
    );
  }

  devToolsPlugin(useStore, storageName, initialState);

  return {
    useSelectors,
    setDeep: useStore.getState().setDeep,
    subscribe: useStore.getState().subscribe,
    getState: useStore.getState,
    useStore,
  };
}
