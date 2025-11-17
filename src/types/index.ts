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
 * This includes paths like "key1.key2" for nested objects and array indices.
 */
export type NestedPaths<T> = T extends Primitive
    ? never
    : T extends readonly (infer U)[]
    ? `${number}` | `${number}.${NestedPaths<U>}`
    : {
        [K in keyof T]: K extends string
        ? T[K] extends Primitive
        ? K
        : T[K] extends readonly (infer U)[]
        ? K | `${K}.${number}` | `${K}.${number}.${NestedPaths<U>}`
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
 * Supports array indices like "todos.0.done" or "todos.${number}.done".
 */
export type PathValue<
    T,
    P extends Path<T>
> = P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
    ? Rest extends Path<T[K]>
    ? PathValue<T[K], Rest>
    : never
    : K extends `${number}`
    ? T extends readonly (infer U)[]
    ? Rest extends Path<U>
    ? PathValue<U, Rest>
    : never
    : never
    : never
    : P extends keyof T
    ? T[P]
    : P extends `${number}`
    ? T extends readonly (infer U)[]
    ? U
    : never
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
 * History configuration options
 */
export type HistoryConfig = {
    enabled: boolean;
    maxSize?: number;
    debounceMs?: number;
};

/**
 * Computed value configuration
 */
export interface ComputedConfig<T, R = unknown> {
    /** Computation function */
    compute: (state: T) => R;
    /** Dependencies (paths) that trigger recomputation */
    deps?: string[];
    /** Whether to cache the result (default: true) */
    cache?: boolean;
}

/**
 * Computed values can be either a simple function or an extended config
 */
export type ComputedValues<T> = Record<string, ComputedConfig<T, unknown> | ((state: T) => unknown)>;

/**
 * Options for creating a store, including persistence, logging, middleware, etc.
 */
export type StoreOptions<T extends object> = {
    persist?: boolean | PersistConfig<T>;
    logging?: boolean;
    middleware?: Middleware<T>[];
    computedValues?: ComputedValues<T>;
    plugins?: Plugin<T>[];
    prefix?: string;
    history?: HistoryConfig;
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
 * History API interface
 */
export interface HistoryAPI {
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    clear: () => void;
    jump: (index: number) => void;
}

/**
 * The main store type that includes state management functions:
 * - `setDeep` for deep updates,
 * - `dispatch` for asynchronous actions,
 * - `subscribe` for state change listeners,
 * - `subscribePath` for path-specific listeners,
 * - `deleteDeep` for deleting nested properties,
 * - `hasPath` for checking path existence,
 * - `history` for time-travel debugging (optional).
 */
export type Store<T> = T & {
    setDeep: <P extends Path<T>>(
        path: P,
        action: SetStateAction<PathValue<T, P>>
    ) => void;
    dispatch: (action: AsyncAction<T>) => Promise<void>;
    subscribe: (listener: (state: T, prevState: T) => void) => () => void;
    subscribePath: (
        path: string,
        callback: (newValue: unknown, oldValue: unknown, fullState: T) => void
    ) => () => void;
    deleteDeep: (path: string) => boolean;
    hasPath: (path: string) => boolean;
    history?: HistoryAPI;
};

/**
 * Configuration for selectors, which can be:
 * - A state path (e.g., "user.name")
 * - A state path with alias (e.g., "user.name:userName")
 * - A computed value key (e.g., "fullName", "cartTotal")
 * - An array path (e.g., "todos.0.done" or "cart.${number}.quantity")
 */
export type SelectorConfig<T> = Path<T> | `${Path<T>}:${string}` | string;

/**
 * A type to extract the last part of a path string, used for aliases in selectors.
 */
export type GetLastPart<T extends string> = T extends `${string}.${infer Last}`
    ? GetLastPart<Last>
    : T;

/**
 * The result type of applying selectors to the store state.
 * Maps selector paths to their resolved values.
 * For computed values and dynamic array paths, the type is unknown since it can't be inferred statically.
 */
export type SelectorResult<T, S extends SelectorConfig<T>[]> = {
    [K in S[number]as K extends `${string}:${infer A}`
    ? A
    : K extends string
    ? GetLastPart<K>
    : never]: K extends `${infer P}:${string}`
    ? P extends Path<T>
    ? PathValue<T, P & Path<T>>
    : unknown
    : K extends Path<T>
    ? PathValue<T, K>
    : unknown;
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