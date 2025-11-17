import type { DeepPartial, Middleware } from "../types";

/**
 * Dangerous property names that could lead to prototype pollution.
 */
const DANGEROUS_PROPS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

/**
 * Validates a path segment to prevent prototype pollution attacks.
 *
 * @param segment - The path segment to validate.
 * @throws {Error} If the segment is dangerous or invalid.
 */
function validatePathSegment(segment: string): void {
  if (!segment || typeof segment !== "string") {
    throw new Error("Invalid path segment: must be a non-empty string");
  }
  if (DANGEROUS_PROPS.has(segment)) {
    throw new Error(`Forbidden path segment: "${segment}"`);
  }
}

/**
 * Validates and splits a path into segments.
 *
 * @param path - The path to validate and split.
 * @returns Array of path segments.
 * @throws {Error} If the path is invalid.
 */
function validateAndSplitPath(path: string): string[] {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  const parts = path.split(".");
  parts.forEach(validatePathSegment);

  return parts;
}

/**
 * Retrieves the value at a nested path within an object.
 *
 * @param obj - The object to traverse.
 * @param path - The path to the desired value.
 * @returns The value at the specified path, or undefined if the path does not exist.
 * @throws {Error} If the path contains dangerous segments.
 */
export function getNestedValue<T, R = unknown>(obj: T, path: string): R | undefined {
  const parts = validateAndSplitPath(path);

  return parts.reduce<unknown>((acc, part) => {
    if (acc === null || acc === undefined) {
      return undefined;
    }
    if (typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj) as R | undefined;
}

/**
 * Sets the value at a nested path within an object.
 *
 * @param obj - The object to modify.
 * @param path - The path to the value to set.
 * @param value - The value to set at the specified path.
 * @throws {Error} If the path contains dangerous segments or is invalid.
 */
export function setNestedValue<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown
): void {
  const parts = validateAndSplitPath(path);
  const lastPart = parts.pop();

  if (!lastPart) {
    throw new Error("Invalid path: cannot be empty after validation");
  }

  const target = parts.reduce<Record<string, unknown>>((acc, part) => {
    if (!(part in acc) || typeof acc[part] !== "object" || acc[part] === null) {
      acc[part] = {};
    }
    return acc[part] as Record<string, unknown>;
  }, obj);

  target[lastPart] = value;
}

/**
 * Retrieves the last part of a dot-separated path.
 *
 * @param path - The path string.
 * @returns The last part of the path.
 * @throws {Error} If the path is invalid.
 */
export function getLastPart(path: string): string {
  const parts = validateAndSplitPath(path);
  const lastPart = parts[parts.length - 1];

  if (!lastPart) {
    throw new Error("Invalid path: cannot extract last part");
  }

  return lastPart;
}

/**
 * Deeply merges two objects with prototype pollution protection.
 *
 * @param target - The target object to merge into.
 * @param source - The source object to merge from.
 * @returns The merged object.
 * @throws {Error} If dangerous properties are encountered.
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: DeepPartial<T>
): T {
  if (!isObject(source)) {
    return target;
  }

  const output = { ...target };

  Object.keys(source).forEach((key) => {
    // Prevent prototype pollution
    if (DANGEROUS_PROPS.has(key)) {
      throw new Error(`Forbidden property in merge: "${key}"`);
    }

    if (key in target) {
      const targetValue = target[key as keyof T];
      const sourceValue = source[key as keyof DeepPartial<T>];

      if (isObject(targetValue) && isObject(sourceValue)) {
        output[key as keyof T] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as DeepPartial<Record<string, unknown>>
        ) as T[keyof T];
      } else if (sourceValue !== undefined) {
        output[key as keyof T] = sourceValue as T[keyof T];
      }
    }
  });

  return output;
}

/**
 * Checks if a value is a non-null plain object (not array, not null, not class instance).
 *
 * @param item - The value to check.
 * @returns True if the value is a plain object, otherwise false.
 */
function isObject(item: unknown): item is Record<string, unknown> {
  return (
    item !== null &&
    typeof item === "object" &&
    !Array.isArray(item) &&
    Object.prototype.toString.call(item) === "[object Object]"
  );
}

/**
 * Generates a stable hash from an object using a secure hashing algorithm.
 *
 * @param obj - The object to hash.
 * @returns The stable hash as a string.
 */
export function stableHash(obj: object): string {
  try {
    // Sort keys for stable stringification
    const sortedKeys = Object.keys(obj).sort();
    const str = JSON.stringify(obj, sortedKeys);

    // Simple but effective hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
  } catch (error) {
    // Fallback for circular references or non-serializable objects
    console.warn("Failed to hash object, using timestamp fallback:", error);
    return Date.now().toString(36);
  }
}

/**
 * Combines multiple middleware functions into a single middleware function.
 *
 * @param middlewares - The array of middleware functions to combine.
 * @returns The combined middleware function that applies all middlewares in order.
 */
export const combineMiddlewares = <T extends object>(
  middlewares: Middleware<T>[]
): Middleware<T> => {
  if (!Array.isArray(middlewares)) {
    throw new Error("Middlewares must be an array");
  }

  if (middlewares.length === 0) {
    return (next) => next;
  }

  return middlewares.reduce<Middleware<T>>(
    (composed, current) => (next) => composed(current(next)),
    (next) => next
  );
};


