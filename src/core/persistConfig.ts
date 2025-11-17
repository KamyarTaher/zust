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

  // Check if localStorage/sessionStorage is available (works in both browser and test environments)
  const hasLocalStorage = typeof localStorage !== "undefined";
  const hasSessionStorage = typeof sessionStorage !== "undefined";

  if (!hasLocalStorage && !hasSessionStorage) {
    // Return a no-op storage for environments without storage
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  switch (storageType) {
    case StorageType.LOCAL:
      return hasLocalStorage ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };
    case StorageType.SESSION:
      return hasSessionStorage ? sessionStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };
    default:
      return hasLocalStorage ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };
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
   * Save state to storage (saves each field individually)
   */
  const save = async (state: T, config?: boolean | PersistConfig<T>): Promise<void> => {
    try {
      let fieldsToSave: string[];

      if (typeof config === "object") {
        // Partial persistence based on config
        fieldsToSave = Object.keys(config).filter(key => config[key as Path<T>]);
      } else if (config === true) {
        // Save all top-level fields (excluding functions/methods)
        fieldsToSave = Object.keys(state).filter(
          key => typeof state[key as keyof T] !== 'function'
        );
      } else {
        // Persistence disabled
        return;
      }

      // Save each field individually with key format: storageName-fieldName
      for (const field of fieldsToSave) {
        const key = `${storageName}-${field}`;
        const value = state[field as keyof T];
        const serialized = JSON.stringify(value);
        await storage.setItem(key, serialized);
      }
    } catch (error) {
      onError(error as Error);
      throw error;
    }
  };

  /**
   * Load state from storage (loads all fields individually)
   */
  const load = async (): Promise<Partial<T> | null> => {
    try {
      const result: Partial<T> = {};
      let hasAnyData = false;

      // Iterate through storage keys to find ones matching our prefix
      const prefix = `${storageName}-`;

      // Check if storage has a length property (like localStorage)
      if ('length' in storage && 'key' in storage) {
        const storageWithKeys = storage as StateStorage & { length: number; key: (index: number) => string | null };
        for (let i = 0; i < storageWithKeys.length; i++) {
          const key = storageWithKeys.key(i);
          if (key?.startsWith(prefix)) {
            const fieldName = key.substring(prefix.length);
            const value = await storage.getItem(key);
            if (value !== null) {
              try {
                result[fieldName as keyof T] = JSON.parse(value);
                hasAnyData = true;
              } catch (parseError) {
                onError(parseError as Error);
              }
            }
          }
        }
      }

      return hasAnyData ? result : null;
    } catch (error) {
      onError(error as Error);
      throw error;
    }
  };

  /**
   * Clear stored state (clears all fields with prefix)
   */
  const clear = async (): Promise<void> => {
    try {
      const prefix = `${storageName}-`;
      const keysToRemove: string[] = [];

      // Collect keys to remove
      if ('length' in storage && 'key' in storage) {
        const storageWithKeys = storage as StateStorage & { length: number; key: (index: number) => string | null };
        for (let i = 0; i < storageWithKeys.length; i++) {
          const key = storageWithKeys.key(i);
          if (key?.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
      }

      // Remove all matching keys
      for (const key of keysToRemove) {
        await storage.removeItem(key);
      }
    } catch (error) {
      onError(error as Error);
    }
  };

  return { save, load, clear };
}
