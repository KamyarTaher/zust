// src/middleware/loggingMiddleware.ts
function loggingMiddleware(storeCreator) {
  return (set, get, api) => {
    return storeCreator((args) => {
      console.log("Applying state changes:", args);
      set(args);
      console.log("New state:", get());
    }, get, api);
  };
}
export {
  loggingMiddleware
};
