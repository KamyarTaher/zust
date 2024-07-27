import type { DeepPartial, Middleware } from "../types";

/**
 * Retrieves the value at a nested path within an object.
 *
 * @param obj - The object to traverse.
 * @param path - The path to the desired value.
 * @returns The value at the specified path, or undefined if the path does not exist.
 */
export function getNestedValue<T>(obj: T, path: string): any {
  return path
    .split(".")
    .reduce((acc: any, part: string) => acc && acc[part], obj);
}

/**
 * Sets the value at a nested path within an object.
 *
 * @param obj - The object to modify.
 * @param path - The path to the value to set.
 * @param value - The value to set at the specified path.
 */
export function setNestedValue<T>(obj: T, path: string, value: any): void {
  const parts = path.split(".");
  const lastPart = parts.pop()!;
  const target = parts.reduce((acc: any, part: string) => {
    if (!(part in acc)) {
      acc[part] = {};
    }
    return acc[part];
  }, obj);
  target[lastPart] = value;
}

/**
 * Retrieves the last part of a dot-separated path.
 *
 * @param path - The path string.
 * @returns The last part of the path.
 */
export function getLastPart(path: string): string {
  return path.split(".").pop()!;
}

/**
 * Deeply merges two objects.
 *
 * @param target - The target object to merge into.
 * @param source - The source object to merge from.
 * @returns The merged object.
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: DeepPartial<T>
): T {
  if (!isObject(source)) {
    return target;
  }

  const output = { ...target };

  Object.keys(source).forEach((key) => {
    if (key in target) {
      const targetValue = target[key as keyof T];
      const sourceValue = source[key as keyof DeepPartial<T>];

      if (isObject(targetValue) && isObject(sourceValue)) {
        output[key as keyof T] = deepMerge(
          targetValue,
          sourceValue as DeepPartial<T[keyof T]>
        );
      } else if (sourceValue !== undefined) {
        output[key as keyof T] = sourceValue as T[keyof T];
      }
    }
  });

  return output;
}

/**
 * Checks if a value is a non-null object.
 *
 * @param item - The value to check.
 * @returns True if the value is a non-null object, otherwise false.
 */
function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === "object" && !Array.isArray(item);
}

/**
 * Generates a stable hash from an object.
 *
 * @param obj - The object to hash.
 * @returns The stable hash as a string.
 */
export function stableHash(obj: object): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Combines multiple middleware functions into a single middleware function.
 *
 * @param middlewares - The array of middleware functions to combine.
 * @returns The combined middleware function.
 */
export const combineMiddlewares = <T extends object>(
  middlewares: Middleware<T>[]
): Middleware<T> => {
  return middlewares.reduce(
    (combinedMiddleware, middleware) => (next) =>
      middleware(combinedMiddleware(next)),
    (next: (state: T) => T) => next
  );
};
