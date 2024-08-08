import { StateCreator, StoreApi, UseBoundStore } from "zustand";

// Les types existants restent inchangés
export type Primitive = string | number | boolean | null | undefined;
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;
export type StoreHook<T> = () => {
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
} & T;
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
export type Path<T> = NestedPaths<T>;
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
export type SetStateAction<T> = T | ((prevState: T) => T);
export type Middleware<T extends object> = (
  next: (state: T) => T
) => (state: T) => T;
export type Plugin<T extends object> = {
  onInit?: (store: Store<T>) => void;
  middleware?: Middleware<T>;
};
export type PersistConfig<T> = { [K in Path<T>]?: boolean };
export type StoreOptions<T extends object> = {
  persist?: boolean | PersistConfig<T>;
  logging?: boolean;
  middleware?: Middleware<T>[];
  computedValues?: { [key: string]: (state: T) => any };
  plugins?: Plugin<T>[];
  prefix?: string;
};
export type AsyncAction<T> = (
  state: T,
  setNestedState: <P extends Path<T>>(
    path: P,
    action: SetStateAction<PathValue<T, P>>
  ) => void
) => Promise<void>;
export type Store<T> = T & {
  setDeep: <P extends Path<T>>(
    path: P,
    action: SetStateAction<PathValue<T, P>>
  ) => void;
  dispatch: (action: AsyncAction<T>) => Promise<void>;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
};
export type SelectorConfig<T> = Path<T> | `${Path<T>}:${string}`;
export type GetLastPart<T extends string> = T extends `${string}.${infer Last}`
  ? GetLastPart<Last>
  : T;

// Mise à jour du type SelectorResult
export type SelectorResult<T, S extends SelectorConfig<T>[]> = {
  [K in S[number] as K extends `${string}:${infer Alias}`
    ? Alias
    : K extends `${infer Path}`
    ? Path extends `${string}.${infer Last}`
      ? Last
      : Path
    : never]: K extends `${infer P}:${string}`
    ? P extends Path<T>
      ? PathValue<T, P>
      : never
    : K extends Path<T>
    ? PathValue<T, K>
    : never;
};

// Mise à jour du type StoreCreationResult
export type StoreCreationResult<T extends object> = {
  useStore: UseBoundStore<StoreApi<Store<T>>>;
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

// Nouveau type pour le créateur de store
export type StoreCreator<T extends object> = StateCreator<Store<T>, [], []>;
