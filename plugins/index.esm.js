// src/plugins/devTools.ts
function devToolsPlugin(useStore, storageName, initialState) {
  if (typeof window !== "undefined" && window.__REDUX_DEVTOOLS_EXTENSION__) {
    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
      name: storageName
    });
    devTools.init(initialState);
    useStore().subscribe((state) => {
      devTools.send("State Update", state);
    });
  }
}
export {
  devToolsPlugin
};
