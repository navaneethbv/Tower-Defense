import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
  },
  test: {
    coverage: {
      provider: "v8",
      include: [
        "src/data/**/*.ts",
        "src/engine/**/*.ts",
        "src/meta/**/*.ts",
        "src/waves/**/*.ts",
      ],
      exclude: [
        "src/main.ts",
        "src/types.ts",
        "src/engine/loop.ts",
        "src/engine/render/**/*.ts",
        "src/ui/**/*.ts",
        "src/data/generated/**/*.ts",
      ],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      }
    }
  }
});
