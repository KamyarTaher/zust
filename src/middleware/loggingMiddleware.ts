/**
 * A middleware function that logs state changes.
 *
 * @param storeCreator - The original store creation function.
 * @returns A new store creation function that includes logging functionality.
 */
export function loggingMiddleware(storeCreator: any) {
  return (set: any, get: any, api: any) => {
    return storeCreator(
      (args: any) => {
        console.log("Applying state changes:", args);
        set(args);
        console.log("New state:", get());
      },
      get,
      api
    );
  };
}
