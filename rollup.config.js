// rollup.config.js
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.cjs.js",
        format: "cjs",
        sourcemap: true,
        exports: "named",
        interop: "auto",
      },
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    external: ["react", "react-dom", "react/jsx-runtime"],
    plugins: [
      peerDepsExternal(),
      nodeResolve({
        extensions: [".ts", ".tsx", ".js", ".jsx"],
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "./dist/types",
        sourceMap: true,
        exclude: ["**/*.test.ts", "**/*.test.tsx", "tests/**/*"],
      }),
    ],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
    },
  },
  {
    input: "./dist/types/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
    external: [/\.css$/],
  },
];
