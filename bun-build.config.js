export default [
  {
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    external: ["react", "react-dom", "zustand"],
    format: "esm",
    outfile: "index.esm.js",
  },
  {
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    external: ["react", "react-dom", "zustand"],
    format: "cjs",
    outfile: "index.cjs.js",
  },
];
