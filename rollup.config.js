// rollup.config.js
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";

export default [
  // First build configuration for JavaScript files
  {
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
      peerDepsExternal(),
      resolve(),
      commonjs(),
      json(),
      typescript({
        tsconfig: "tsconfig.json",
        useTsconfigDeclarationDir: true,
        clean: true,
      }),
    ],
  },
  // Second build configuration for TypeScript declarations
  {
    input: "./src/types.d.ts",
    output: [{ file: "dist/types/types.d.ts", format: "es" }],
    plugins: [dts()],
  },
];
