import { persist, createJSONStorage } from "zustand/middleware";
import type { PersistConfig, Path } from "../types";

/**
 * Creates a persistence configuration object that specifies which paths in the state should be persisted.
 *
 * @param paths - The paths in the state to be persisted.
 * @returns The persistence configuration object.
 */
export function createPersistConfig<T>(...paths: Path<T>[]): PersistConfig<T> {
  return paths.reduce((config, path) => {
    config[path] = true;
    return config;
  }, {} as PersistConfig<T>);
}

/**
 * Creates a persister middleware for Zustand stores.
 *
 * @param storeCreator - The original store creator function.
 * @param persistOption - A boolean or an object specifying which parts of the state to persist.
 * @param storageName - The name to use for the storage key.
 * @returns The store creator function wrapped with persistence capabilities.
 */
export function createPersister(
  storeCreator: any,
  persistOption: boolean | PersistConfig<any>,
  storageName: string
) {
  const persistConfig: any = {
    name: storageName,
    storage: createJSONStorage(() => localStorage),
    partialize:
      typeof persistOption === "object"
        ? (state: any) => {
            // Retain only the specified parts of the state for persistence
            return Object.keys(persistOption).reduce((persisted, key) => {
              if (persistOption[key]) {
                persisted[key] = state[key];
              }
              return persisted;
            }, {} as any);
          }
        : (state: any) => state,
  };

  return persist(storeCreator, persistConfig);
}
