import typescript from "@rollup/plugin-typescript"; // Use the official plugin
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.cjs.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
  ],
  external: ["react", "react-dom", "zustand"],
  plugins: [
    typescript({
      tsconfig: "tsconfig.json",
      declaration: true,
      declarationDir: "./dist/types",
    }),
    peerDepsExternal(),
    resolve(),
    commonjs(),
    json(),
  ],
};
