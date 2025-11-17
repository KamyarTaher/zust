/**
 * Enhanced Path Utilities - Supports objects, arrays, and mixed paths
 * Example: "users.0.posts.5.title" or "user.profile.name"
 */

/**
 * Dangerous property names that could lead to prototype pollution.
 */
const DANGEROUS_PROPS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Cached path parsing results for performance
 */
const pathCache = new Map<string, string[]>();
const MAX_CACHE_SIZE = 1000;

/**
 * Path segment type
 */
export type PathSegment = {
  key: string;
  isArray: boolean;
  index?: number;
};

/**
 * Validates a path segment to prevent prototype pollution attacks.
 *
 * @param segment - The path segment to validate.
 * @throws {Error} If the segment is dangerous or invalid.
 */
function validatePathSegment(segment: string): void {
  if (!segment || typeof segment !== "string") {
    throw new Error("[Zust] Invalid path segment: must be a non-empty string");
  }
  if (DANGEROUS_PROPS.has(segment)) {
    throw new Error(`[Zust] Forbidden path segment: "${segment}"`);
  }
}

/**
 * Parse and validate a path string into segments
 *
 * @param path - Dot-separated path (e.g., "user.posts.0.title")
 * @returns Array of path segments
 */
export function parsePath(path: string): string[] {
  if (!path || typeof path !== "string") {
    throw new Error("[Zust] Path must be a non-empty string");
  }

  // Check cache first
  const cached = pathCache.get(path);
  if (cached) {
    return cached;
  }

  // Parse and validate
  const parts = path.split(".");
  parts.forEach(validatePathSegment);

  // Cache the result
  if (pathCache.size >= MAX_CACHE_SIZE) {
    // Clear cache when it gets too large (simple LRU would be better)
    const firstKey = pathCache.keys().next().value;
    if (firstKey) {
      pathCache.delete(firstKey);
    }
  }
  pathCache.set(path, parts);

  return parts;
}

/**
 * Get value at nested path with array support
 *
 * @param obj - The object to traverse
 * @param path - Dot-separated path
 * @returns The value at the path or undefined
 */
export function getNestedValue<T, R = unknown>(
  obj: T,
  path: string
): R | undefined {
  if (!path) return obj as unknown as R;

  const parts = parsePath(path);
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array indices
    if (Array.isArray(current)) {
      const index = parseInt(part, 10);
      if (isNaN(index)) {
        throw new Error(
          `[Zust] Invalid array index "${part}" in path "${path}". Expected a number.`
        );
      }
      if (index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current as R | undefined;
}

/**
 * Set value at nested path with array support (creates intermediate objects/arrays)
 *
 * @param obj - The object to modify (will be mutated)
 * @param path - Dot-separated path
 * @param value - The value to set
 */
export function setNestedValue<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown
): void {
  if (!path) {
    throw new Error("[Zust] Cannot set empty path");
  }

  const parts = parsePath(path);

  // Handle single-segment paths (e.g., "counter")
  if (parts.length === 1) {
    const key = parts[0];
    if (!key) {
      throw new Error("[Zust] Invalid path segment");
    }
    (obj as Record<string, unknown>)[key] = value;
    return;
  }

  const lastPart = parts.pop();
  if (!lastPart) {
    throw new Error("[Zust] Invalid path: cannot extract last part");
  }
  let current: Record<string, unknown> | unknown[] = obj;

  // Navigate to the parent of the target
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) {
      throw new Error("[Zust] Invalid path segment");
    }
    const nextPart = parts[i + 1];

    if (Array.isArray(current)) {
      const index = parseInt(part, 10);
      if (isNaN(index)) {
        throw new Error(
          `[Zust] Invalid array index "${part}" in path "${path}". Expected a number.`
        );
      }

      // Extend array if needed
      while (current.length <= index) {
        current.push(undefined);
      }

      // Create intermediate structure if needed
      if (current[index] === null || current[index] === undefined) {
        // Check if next part is a number (array) or string (object)
        const nextIndex = nextPart !== undefined ? parseInt(nextPart, 10) : NaN;
        current[index] = isNaN(nextIndex) ? {} : [];
      }

      current = current[index] as Record<string, unknown> | unknown[];
    } else {
      // Create intermediate structure if needed
      if (!(part in current) || current[part] === null || current[part] === undefined) {
        // Check if next part is a number (array) or string (object)
        const nextIndex = nextPart !== undefined ? parseInt(nextPart, 10) : NaN;
        current[part] = isNaN(nextIndex) ? {} : [];
      }

      current = current[part] as Record<string, unknown> | unknown[];
    }
  }

  // Set the final value
  if (Array.isArray(current)) {
    const index = parseInt(lastPart, 10);
    if (isNaN(index)) {
      throw new Error(
        `[Zust] Invalid array index "${lastPart}" in path "${path}". Expected a number.`
      );
    }

    // Extend array if needed
    while (current.length <= index) {
      current.push(undefined);
    }

    current[index] = value;
  } else {
    current[lastPart] = value;
  }
}

/**
 * Delete value at nested path
 *
 * @param obj - The object to modify
 * @param path - Dot-separated path
 * @returns true if deletion was successful
 */
export function deleteNestedValue<T extends Record<string, unknown>>(
  obj: T,
  path: string
): boolean {
  if (!path) {
    return false;
  }

  const parts = parsePath(path);
  const lastPart = parts.pop();

  if (!lastPart) {
    return false;
  }

  let current: Record<string, unknown> | unknown[] = obj;

  // Navigate to parent
  for (const part of parts) {
    if (current === null || current === undefined) {
      return false;
    }

    if (Array.isArray(current)) {
      const index = parseInt(part, 10);
      if (isNaN(index) || index < 0 || index >= current.length) {
        return false;
      }
      current = current[index] as Record<string, unknown> | unknown[];
    } else if (typeof current === "object") {
      if (!(part in current)) {
        return false;
      }
      current = current[part] as Record<string, unknown> | unknown[];
    } else {
      return false;
    }
  }

  // Delete the value
  if (Array.isArray(current)) {
    const index = parseInt(lastPart, 10);
    if (isNaN(index) || index < 0 || index >= current.length) {
      return false;
    }
    current.splice(index, 1);
    return true;
  } else if (typeof current === "object" && current !== null) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    return delete current[lastPart];
  }

  return false;
}

/**
 * Check if path exists in object
 *
 * @param obj - The object to check
 * @param path - Dot-separated path
 * @returns true if path exists
 */
export function hasPath<T>(obj: T, path: string): boolean {
  const value = getNestedValue(obj, path);
  return value !== undefined;
}

/**
 * Get the last part of a path
 *
 * @param path - Dot-separated path
 * @returns The last segment
 */
export function getLastPart(path: string): string {
  const parts = parsePath(path);
  const lastPart = parts[parts.length - 1];

  if (!lastPart) {
    throw new Error("[Zust] Invalid path: cannot extract last part");
  }

  return lastPart;
}

/**
 * Get the parent path
 *
 * @param path - Dot-separated path
 * @returns Parent path or empty string if no parent
 */
export function getParentPath(path: string): string {
  const parts = parsePath(path);
  parts.pop();
  return parts.join(".");
}

/**
 * Check if path matches a pattern (supports wildcards)
 *
 * @param path - The path to check
 * @param pattern - Pattern with optional * wildcard
 * @returns true if path matches pattern
 */
export function matchPath(path: string, pattern: string): boolean {
  if (path === pattern) return true;
  if (!pattern.includes("*")) return false;

  const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  return regex.test(path);
}
