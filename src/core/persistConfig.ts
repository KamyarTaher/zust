/**
 * Standalone Persistence - No Zustand dependency
 * Simplified version that works with our engine
 */

import type { PersistConfig, Path } from "../types";

/**
 * Storage type options for persistence.
 */
export enum StorageType {
  LOCAL = "local",
  SESSION = "session",
  CUSTOM = "custom",
}

/**
 * Storage interface (compatible with Web Storage API)
 */
export interface StateStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

/**
 * Options for configuring persistence.
 */
export interface PersisterOptions<T> {
  /** The type of storage to use */
  storageType?: StorageType;
  /** Custom storage implementation */
  customStorage?: StateStorage;
  /** Function to handle storage errors */
  onError?: (error: Error) => void;
  /** Whether to migrate data from old versions */
  version?: number;
  /** Migration function for version updates */
  migrate?: (persistedState: unknown, version: number) => T | Promise<T>;
}

/**
 * Creates a persistence configuration object that specifies which paths in the state should be persisted.
 *
 * @param paths - The paths in the state to be persisted.
 * @returns The persistence configuration object.
 * @throws {Error} If paths array is empty or contains invalid paths.
 */
export function createPersistConfig<T>(...paths: Path<T>[]): PersistConfig<T> {
  if (paths.length === 0) {
    throw new Error("[Zust] At least one path must be specified for persistence");
  }

  return paths.reduce((config, path) => {
    if (!path || typeof path !== "string") {
      throw new Error(`[Zust] Invalid path: ${path}`);
    }
    config[path] = true;
    return config;
  }, {} as PersistConfig<T>);
}

/**
 * Get the storage implementation based on type
 */
function getStorage(
  storageType: StorageType,
  customStorage?: StateStorage
): StateStorage {
  if (storageType === StorageType.CUSTOM) {
    if (!customStorage) {
      throw new Error("[Zust] Custom storage must be provided when using StorageType.CUSTOM");
    }
    return customStorage;
  }

  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    // Return a no-op storage for server-side rendering
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  switch (storageType) {
    case StorageType.LOCAL:
      return localStorage;
    case StorageType.SESSION:
      return sessionStorage;
    default:
      return localStorage;
  }
}

/**
 * Create a persister for the store (simplified standalone version)
 *
 * NOTE: This is a simplified implementation. Full persistence would require
 * deeper integration with the store engine. For now, this provides basic
 * storage functionality.
 *
 * @param storageName - Storage key name
 * @param options - Persistence options
 * @returns Functions to save/load state
 */
export function createPersister<T extends object>(
  storageName: string,
  options: PersisterOptions<T> = {}
): {
  save: (state: T, config?: boolean | PersistConfig<T>) => Promise<void>;
  load: () => Promise<Partial<T> | null>;
  clear: () => Promise<void>;
} {
  const {
    storageType = StorageType.LOCAL,
    customStorage,
    onError = (error: Error) => console.error("[Zust Persist]", error),
  } = options;

  const storage = getStorage(storageType, customStorage);

  /**
   * Save state to storage
   */
  const save = async (state: T, config?: boolean | PersistConfig<T>): Promise<void> => {
    try {
      let dataToSave: Partial<T>;

      if (typeof config === "object") {
        // Partial persistence based on config
        dataToSave = {};
        for (const key of Object.keys(config)) {
          if (config[key as Path<T>]) {
            dataToSave[key as keyof T] = state[key as keyof T];
          }
        }
      } else {
        // Save entire state
        dataToSave = state;
      }

      const serialized = JSON.stringify(dataToSave);
      await storage.setItem(storageName, serialized);
    } catch (error) {
      onError(error as Error);
    }
  };

  /**
   * Load state from storage
   */
  const load = async (): Promise<Partial<T> | null> => {
    try {
      const item = await storage.getItem(storageName);
      if (!item) return null;

      return JSON.parse(item) as Partial<T>;
    } catch (error) {
      onError(error as Error);
      return null;
    }
  };

  /**
   * Clear stored state
   */
  const clear = async (): Promise<void> => {
    try {
      await storage.removeItem(storageName);
    } catch (error) {
      onError(error as Error);
    }
  };

  return { save, load, clear };
}
