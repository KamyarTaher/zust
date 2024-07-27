import type { StoreHook } from "../types";

/**
 * A plugin function that integrates the Zustand store with Redux DevTools.
 * This allows you to inspect and debug state changes in the Redux DevTools extension.
 *
 * @param useStore - A Zustand store hook used to subscribe to state changes.
 * @param storageName - The name to display in Redux DevTools for this store.
 * @param initialState - The initial state of the store to initialize DevTools.
 */
export function devToolsPlugin<T>(
  useStore: StoreHook<T>,
  storageName: string,
  initialState: T
) {
  if (
    typeof window !== "undefined" &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION__
  ) {
    // Access Redux DevTools extension
    const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
      name: storageName,
    });

    // Initialize DevTools with the initial state
    devTools.init(initialState);

    // Subscribe to store changes and send updates to DevTools
    useStore().subscribe((state: T) => {
      devTools.send("State Update", state);
    });
  }
}
