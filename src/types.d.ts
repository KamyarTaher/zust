/**
 * A type representing primitive values (string, number, boolean, null, undefined).
 */
export type Primitive = string | number | boolean | null | undefined;

/**
 * A type that represents a deep partial version of a type `T`.
 * All properties of `T` become optional, recursively.
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/**
 * A type representing a Zustand store hook with a subscribe method.
 * This type ensures that the `subscribe` method is present in the returned store.
 */
export type StoreHook<T> = () => {
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
} & T;

/**
 * A type that computes all possible nested paths for an object type `T`.
 * This includes paths like "key1.key2" for nested objects.
 */
export type NestedPaths<T> = T extends Primitive
  ? never
  : T extends any[]
  ? never
  : {
      [K in keyof T]: K extends string
        ? T[K] extends Primitive
          ? K
          : `${K}` | `${K}.${NestedPaths<T[K]>}`
        : never;
    }[keyof T];

/**
 * A type alias for nested paths within an object type `T`.
 * This type is used for specifying paths to nested properties.
 */
export type Path<T> = NestedPaths<T>;

/**
 * A type that represents the value at a given path `P` in an object type `T`.
 * Uses template literal types to resolve deeply nested values.
 */
export type PathValue<
  T,
  P extends Path<T>
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

/**
 * A type that represents either a value of type `T` or a function that takes
 * the previous state and returns a new state.
 */
export type SetStateAction<T> = T | ((prevState: T) => T);

/**
 * A type for middleware functions that modify or enhance store operations.
 * Middleware functions wrap the next function and return a new function.
 */
export type Middleware<T extends object> = (
  next: (state: T) => T
) => (state: T) => T;

/**
 * A type for plugins that can enhance or modify store behavior.
 * Plugins can include an initialization function and middleware.
 */
export type Plugin<T extends object> = {
  onInit?: (store: Store<T>) => void;
  middleware?: Middleware<T>;
};

/**
 * A type for configuration settings to control which parts of the state are persisted.
 */
export type PersistConfig<T> = {
  [K in Path<T>]?: boolean;
};

/**
 * Options for creating a store, including persistence, logging, middleware, etc.
 */
export type StoreOptions<T extends object> = {
  persist?: boolean | PersistConfig<T>;
  logging?: boolean;
  middleware?: Middleware<T>[];
  computedValues?: { [key: string]: (state: T) => any };
  plugins?: Plugin<T>[];
  prefix?: string;
};

/**
 * A type for asynchronous actions that can modify the store's state.
 */
export type AsyncAction<T> = (
  state: T,
  setNestedState: <P extends Path<T>>(
    path: P,
    action: SetStateAction<PathValue<T, P>>
  ) => void
) => Promise<void>;

/**
 * The main store type that includes state management functions:
 * - `setDeep` for deep updates,
 * - `dispatch` for asynchronous actions,
 * - `subscribe` for state change listeners.
 */
export type Store<T> = T & {
  setDeep: <P extends Path<T>>(
    path: P,
    action: SetStateAction<PathValue<T, P>>
  ) => void;
  dispatch: (action: AsyncAction<T>) => Promise<void>;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
};

/**
 * Configuration for selectors, which can either be a path or a path with an alias.
 */
export type SelectorConfig<T> = Path<T> | `${Path<T>}:${string}`;

/**
 * A type to extract the last part of a path string, used for aliases in selectors.
 */
export type GetLastPart<T extends string> = T extends `${string}.${infer Last}`
  ? GetLastPart<Last>
  : T;

/**
 * The result type of applying selectors to the store state.
 * Maps selector paths to their resolved values.
 */
export type SelectorResult<T, S extends SelectorConfig<T>[]> = {
  [K in S[number] as K extends `${string}:${infer A}`
    ? A
    : K extends string
    ? GetLastPart<K>
    : never]: K extends `${infer P}:${string}`
    ? PathValue<T, P & Path<T>>
    : K extends Path<T>
    ? PathValue<T, K>
    : never;
};

/**
 * The result type of creating a store, including hooks for state access, updates, and subscription.
 */
export type StoreCreationResult<T> = {
  useStore: () => Store<T>;
  useSelectors: <S extends SelectorConfig<T>[]>(
    ...selectors: S
  ) => SelectorResult<T, S>;
  getState: () => T;
  setDeep: <P extends Path<T>>(
    path: P,
    action: SetStateAction<PathValue<T, P>>
  ) => void;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
};
