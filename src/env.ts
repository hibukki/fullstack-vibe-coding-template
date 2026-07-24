import { z } from "zod";

const envSchema = z.object({
  VITE_CONVEX_URL: z.url(),
  // Clerk dashboard -> API keys; set in .env.local
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
  throw new Error(
    `Invalid client env, set these in .env.local (VITE_CONVEX_URL is written by \`pnpm convex dev\`):\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
