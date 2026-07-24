import { defineConfig } from "vitest/config";

// Backend tests only (convex-test), per
// https://docs.convex.dev/testing/convex-test
export default defineConfig({
  test: {
    include: ["convex/**/*.test.ts"],
    // Approximates the Convex runtime better than node
    environment: "edge-runtime",
  },
});
