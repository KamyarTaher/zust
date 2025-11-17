/**
 * Computed Values Engine - Cached computed values with dependency tracking
 * Inspired by MobX observables and Vue computed properties
 */

import { getNestedValue } from "./pathUtils";

/**
 * Computed value configuration
 */
export interface ComputedConfig<T, R> {
  /** Computation function */
  compute: (state: T) => R;
  /** Dependencies (paths) that trigger recomputation */
  deps?: string[];
  /** Whether to cache the result (default: true) */
  cache?: boolean;
}

/**
 * Computed value definition for store options
 */
export type ComputedValues<T> = Record<string, ComputedConfig<T, unknown> | ((state: T) => unknown)>;

/**
 * Internal computed value entry
 */
interface ComputedEntry<T, R> {
  config: Required<ComputedConfig<T, R>>;
  cachedValue?: R;
  lastDeps?: unknown[];
  computeCount: number;
}

/**
 * Computed values manager
 */
export class ComputedEngine<T extends object> {
  private computedMap = new Map<string, ComputedEntry<T, unknown>>();

  constructor(
    private getState: () => T,
    computedValues: ComputedValues<T> = {}
  ) {
    // Initialize computed values
    Object.entries(computedValues).forEach(([key, config]) => {
      this.addComputed(key, config);
    });
  }

  /**
   * Add a computed value
   */
  addComputed<R>(
    key: string,
    config: ComputedConfig<T, R> | ((state: T) => R)
  ): void {
    // Normalize config
    const normalized: Required<ComputedConfig<T, R>> =
      typeof config === "function"
        ? { compute: config, deps: [], cache: true }
        : {
            compute: config.compute,
            deps: config.deps ?? [],
            cache: config.cache ?? true,
          };

    this.computedMap.set(key, {
      config: normalized as Required<ComputedConfig<T, unknown>>,
      computeCount: 0,
    });
  }

  /**
   * Get computed value (with caching)
   */
  get<R>(key: string): R | undefined {
    const entry = this.computedMap.get(key) as ComputedEntry<T, R> | undefined;

    if (!entry) {
      return undefined;
    }

    const state = this.getState();

    // Check if we need to recompute
    if (entry.config.cache && this.shouldUseCache(entry, state)) {
      return entry.cachedValue;
    }

    // Compute new value
    try {
      const value = entry.config.compute(state);
      entry.computeCount++;

      if (entry.config.cache) {
        entry.cachedValue = value;
        entry.lastDeps = this.getDependencyValues(entry.config.deps, state);
      }

      return value;
    } catch (error) {
      console.error(`[Zust Computed] Error computing "${key}":`, error);
      return entry.cachedValue; // Return cached value on error
    }
  }

  /**
   * Check if cached value should be used
   */
  private shouldUseCache<R>(entry: ComputedEntry<T, R>, state: T): boolean {
    // No cache available
    if (entry.cachedValue === undefined || entry.lastDeps === undefined) {
      return false;
    }

    // No dependencies specified - always recompute
    if (entry.config.deps.length === 0) {
      return false;
    }

    // Check if dependencies changed
    const currentDeps = this.getDependencyValues(entry.config.deps, state);

    if (currentDeps.length !== entry.lastDeps.length) {
      return false;
    }

    // Compare each dependency
    for (let i = 0; i < currentDeps.length; i++) {
      if (!Object.is(currentDeps[i], entry.lastDeps[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get values for all dependencies
   */
  private getDependencyValues(deps: string[], state: T): unknown[] {
    return deps.map((dep) => {
      try {
        return getNestedValue(state, dep);
      } catch (error) {
        console.warn(`[Zust Computed] Failed to get dependency "${dep}":`, error);
        return undefined;
      }
    });
  }

  /**
   * Invalidate cache for specific computed value
   */
  invalidate(key: string): void {
    const entry = this.computedMap.get(key);
    if (entry) {
      delete entry.cachedValue;
      delete entry.lastDeps;
    }
  }

  /**
   * Invalidate all caches
   */
  invalidateAll(): void {
    this.computedMap.forEach((entry) => {
      delete entry.cachedValue;
      delete entry.lastDeps;
    });
  }

  /**
   * Get statistics for debugging
   */
  getStats(): Record<string, { computeCount: number; cached: boolean }> {
    const stats: Record<string, { computeCount: number; cached: boolean }> = {};

    this.computedMap.forEach((entry, key) => {
      stats[key] = {
        computeCount: entry.computeCount,
        cached: entry.cachedValue !== undefined,
      };
    });

    return stats;
  }

  /**
   * Check if a path should invalidate computed values
   */
  shouldInvalidate(changedPath: string): string[] {
    const toInvalidate: string[] = [];

    this.computedMap.forEach((entry, key) => {
      // Check if any dependency matches the changed path
      for (const dep of entry.config.deps) {
        if (this.pathMatches(dep, changedPath)) {
          toInvalidate.push(key);
          break;
        }
      }
    });

    return toInvalidate;
  }

  /**
   * Check if two paths match (supports wildcards)
   */
  private pathMatches(pattern: string, path: string): boolean {
    if (pattern === path) return true;

    // Check if path starts with pattern (for nested matches)
    if (path.startsWith(pattern + ".")) return true;

    // Support wildcard matching (future enhancement)
    return false;
  }

  /**
   * Define computed values as getters on an object
   */
  defineGetters(target: Record<string, unknown>): void {
    this.computedMap.forEach((_, key) => {
      Object.defineProperty(target, key, {
        get: () => this.get(key),
        enumerable: true,
        configurable: true,
      });
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.computedMap.clear();
  }
}
