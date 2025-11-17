import type { StoreHook } from "../types";

/**
 * Redux DevTools Extension interface.
 */
interface ReduxDevToolsExtension {
  connect(options: { name: string }): {
    init(state: unknown): void;
    send(action: string, state: unknown): void;
    disconnect(): void;
  };
}

/**
 * Window interface with Redux DevTools Extension.
 */
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevToolsExtension;
  }
}

/**
 * A plugin function that integrates the Zustand store with Redux DevTools.
 * This allows you to inspect and debug state changes in the Redux DevTools extension.
 *
 * @param useStore - A Zustand store hook used to subscribe to state changes.
 * @param storageName - The name to display in Redux DevTools for this store.
 * @param initialState - The initial state of the store to initialize DevTools.
 * @throws {Error} If the parameters are invalid.
 */
export function devToolsPlugin<T extends object>(
  useStore: StoreHook<T>,
  storageName: string,
  initialState: T
): void {
  // Validate inputs
  if (typeof useStore !== "function") {
    throw new Error("useStore must be a function");
  }

  if (!storageName || typeof storageName !== "string") {
    throw new Error("storageName must be a non-empty string");
  }

  // Only run in browser environment
  if (typeof window === "undefined") {
    return;
  }

  // Check if Redux DevTools Extension is available
  if (!window.__REDUX_DEVTOOLS_EXTENSION__) {
    return;
  }

  try {
    // Access Redux DevTools extension
    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
      name: storageName,
    });

    // Initialize DevTools with the initial state
    devTools.init(initialState);

    // Subscribe to store changes and send updates to DevTools
    const unsubscribe = useStore().subscribe((state: T) => {
      try {
        devTools.send("State Update", state);
      } catch (error) {
        console.error("[Zust DevTools] Failed to send state update:", error);
      }
    });

    // Cleanup function for hot module replacement
    if (typeof module !== "undefined" && (module as { hot?: unknown }).hot) {
      (module as { hot?: { dispose?: (callback: () => void) => void } }).hot?.dispose?.(() => {
        try {
          unsubscribe();
          devTools.disconnect();
        } catch (error) {
          console.error("[Zust DevTools] Failed to cleanup:", error);
        }
      });
    }
  } catch (error) {
    console.error("[Zust DevTools] Failed to initialize DevTools plugin:", error);
  }
}
