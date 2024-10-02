export default {
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  external: ["react", "react-dom", "zustand"],
  format: "esm",
  plugins: [
    {
      name: 'external-modules',
      setup(build) {
        const externals = ['react', 'react-dom', 'zustand'];
        for (const mod of externals) {
          build.onResolve({ filter: new RegExp(`^${mod}$`) }, args => {
            return { path: mod, external: true };
          });
        }
      },
    },
  ],
};
