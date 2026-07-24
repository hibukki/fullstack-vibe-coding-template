/// <reference types="vite/client" />

// Lets convexTest find the function modules (automatic discovery breaks under
// vitest 4). https://docs.convex.dev/testing/convex-test - but its
// `!(*.*.*)` extglob matches nothing in Vite 6+ (tinyglobby), hence negations.
export const modules = import.meta.glob([
  "./**/*.ts",
  "./_generated/*.js",
  "!./**/*.test.ts",
  "!./**/*.d.ts",
  "!./test.setup.ts",
]);
