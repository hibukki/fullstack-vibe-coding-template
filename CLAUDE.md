Always follow the guidelines in this file, unless explicitly told otherwise by the user or overided in the CLAUDE.local.md file.

## Project Overview

- Full-stack TypeScript app: React + Vite + TanStack Router (frontend), Convex (backend), Clerk (auth)
- Development: Run `pnpm dev` with the `run_in_background` parameter to start both frontend and backend servers. Monitor output using the BashOutput tool
- If `pnpm dev` fails due to requiring interactive input, ask the user to run `pnpm convex dev --once` first in a separate terminal
- Import alias: `@/` maps to `src/` directory
- Tailwind CSS 4 + shadcn/ui: CSS vars and `@theme inline` in `src/index.css`, no tailwind.config.js
- Components live in `src/components/ui/` — add new ones with `pnpx shadcn@latest add <name>` or copy from [ui.shadcn.com](https://ui.shadcn.com)
- Environment variables: Client vars need `VITE_` prefix, Convex vars set in dashboard
- Package manager: Always use `pnpm` and `pnpx`, NOT `npm` or `npx`
- See @README.md for project-specific information

## Git Workflow

- Commit small pieces of work when possible
- If the user wants to roll back, use git to find the relevant commit to reset to

### Example good commit messages

- `pnpm install @convex-dev/aggregate`
- `rename: is_malicious -> maliciousness_score` (this commit might be part of a bigger refactor)
- `users: add getCurrentUserOrNull, getCurrentUserOrCrash`
- `schema: users: add bio`
- `frontend: calendar: add month view`

## Testing & Validation

- Before pushing:
  - Check background process output for Convex backend errors.
  - Run `pnpm lint`
  - Review with `git diff origin/main` (or whatever branch makes sense)
- Manual UI testing: use the **dev-browser** skill (see the `dev-browser-clerk-testing` skill for signing in, resizing for mobile/tablet/desktop, and reading console output)
- Test account: `claude+clerk_test@example.com`, code `424242`. Use slowly/pressSequentially to trigger auto distribution
- Convex in tests: Use `ConvexTestingHelper` for queries/mutations
- Test cleanup: Use `testingMutation` from `convex/testingFunctions.ts` for cleanup functions - prevents accidental production use
- If you run into an issue you don't know how to fix, look for relevant documentation or a reference implementation

## Convex

- `_creationTime` and `_id` are automatically added to all documents.
- Adding required fields breaks existing data - if early in development, ask the user to clear the database. Otherwise, plan migration.
- Always throw `ConvexError` for user-facing errors; frontend reads `error.data`, not `error.message`
- Queries have 16MB/10s limits - always use indexes, never full table scans
- Paginated queries: use `.paginate(paginationOpts)` with `paginationOptsValidator`
- Scheduled tasks: `ctx.scheduler.runAfter(delay, internal.module.function, args)` or `ctx.scheduler.runAt(timestamp, ...)`
- Unique fields: enforce in mutation logic, indexes don't guarantee uniqueness
- Soft delete: add `deletedAt: v.optional(v.number())` field instead of `.delete()`
- System tables: access `_scheduled_functions` and `_storage` with `ctx.db.system.get` and `ctx.db.system.query`
- Default query order is ascending by `_creationTime`
- Transactions are per-mutation - can't span multiple mutations. Calling multiple queries/mutation in a single action may introduce race conditions.
- Hot reload issues: Restart if schema changes don't apply or types are stuck
- Use `import { Doc, Id } from "./_generated/dataModel";` and `v.id("table")` for type safety.
- Add `"use node";` to the top of files containing actions that use Node.js built-in modules (can't contain queries and mutations)
- `"use node";` is NOT needed for fetch, only use it for other Node.js built-ins
- Convex + Clerk: Always use Convex's auth hooks (`useConvexAuth`) and components (`<Authenticated>`, `<Unauthenticated>`, `<AuthLoading>`) instead of Clerk's hooks/components. This ensures auth tokens are properly validated by the Convex backend.
- Import data with `pnpm convex import --table tableName file.json`

### Function guidelines

- Import `query`, `internalQuery`, `mutation`, `internalMutation`, `action`, `internalAction` from `./_generated/server` and call to register functions.
- Use `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction` to call functions from other functions. e.g.: `import { api, internal } from "./_generated/api";` and then `ctx.runQuery(internal.module.function, { arg })`.
- If calling functions causes unexpected type errors, try adding a type annotation (helps circularity): `const result: string = await ctx.runQuery(api.module.function, { arg });`
- Actions can't directly access DB - use `ctx.runQuery` / `ctx.runMutation`

### Validator guidelines

- Always use an args validator for functions
- `v.bigint()` is deprecated for representing signed 64-bit integers. Use `v.int64()` instead.
- Use `v.record()` for defining a record type. `v.map()` and `v.set()` are not supported.

### Query guidelines

- Do NOT use `filter` in queries. Instead, define an index in the schema and use `withIndex` instead.
- Convex queries do NOT support `.delete()`. Instead, `.collect()` the results, iterate over them, and call `ctx.db.delete(row._id)` on each result.
- Use `.unique()` to get a single document from a query. This method will throw an error if there are multiple documents that match the query.
- When using async iteration, don't use `.collect()` or `.take(n)` on the result of a query. Instead, use the `for await (const row of query)` syntax.

### Mutation guidelines

- Use `ctx.db.replace` to fully replace an existing document.
- Use `ctx.db.patch` to shallow merge updates into an existing document.

### File uploads

- generate upload URL in mutation (`ctx.storage.generateUploadUrl()`)
- POST from client
- store ID (take `v.id("_storage")`)
- serve with `ctx.storage.getUrl(fileId)` in queries

### Other Convex Features (refer to docs and install as necessary)

- Text search: docs.convex.dev/search/text-search
- Crons: docs.convex.dev/scheduling/cron-jobs
- Durable long-running code flows with retries and delays: convex.dev/components/workflow
- AI agent framework with persistent conversations and tools: convex.dev/components/agent. See https://github.com/get-convex/agent/blob/main/examples/chat-streaming/README.md for a chat example.
- Prioritize tasks with separate customizable queues: convex.dev/components/workpool
- Sync engine for ProseMirror-based editors: convex.dev/components/collaborative-text-editor-sync
- Send and receive SMS with queryable status: convex.dev/components/twilio-sms
- Add subscriptions and billing integration: convex.dev/components/polar
- Type-safe application-layer rate limits with sharding: convex.dev/components/rate-limiter
- Framework for long-running data migrations: convex.dev/components/migrations
- Distributed counter for high-throughput operations: convex.dev/components/sharded-counter
- Cache action results to improve performance: convex.dev/components/action-cache
- Data aggregation and denormalization operations: convex.dev/components/aggregate
- Register and manage cron jobs at runtime: convex.dev/components/crons

## TanStack Router

- Avoid `const search = useSearch()` - use `select` option instead
- Route params update quirks - preserve location when updating
- Search params as filters: validate with zod schema in route definition
- Navigate programmatically: `const navigate = useNavigate()` then `navigate({ to: '/path' })`
- Type-safe links: always use `<Link to="/path">` not `<a href>`
- Nested routes require parent to have `<Outlet />`, use `.index.tsx` files to show content at parent paths

## TanStack Query + Convex Integration

- Use `convexQuery()` from `@convex-dev/react-query` to create query options: `const queryOptions = convexQuery(api.module.function, { status: "active" })`
- Preload in route loaders: `loader: async ({ context: { queryClient } }) => await queryClient.ensureQueryData(queryOptions)`
- Use `useSuspenseQuery` in components: `const { data } = useSuspenseQuery(queryOptions)`
- For mutations, continue using Convex's `useMutation` directly
- **When adding auth to a query** (`ctx.auth.getUserIdentity()`), update its loader: `if ((window as any).Clerk?.session) await queryClient.ensureQueryData(authQuery)` - otherwise the app crashes on page refresh

## TanStack Form + Zod v4

- No adapter needed - TanStack Form natively supports Standard Schema libraries like Zod v4
- Form-level validation:
  ```tsx
  const schema = z.object({ name: z.string().min(1) });
  const form = useForm({
    defaultValues: { name: "" },
    validators: { onChange: schema },
  });
  ```
- Field errors are StandardSchemaV1Issue[] with .message property:
  ```tsx
  {
    !field.state.meta.isValid && (
      <em>{field.state.meta.errors.map((e) => e.message).join(", ")}</em>
    );
  }
  ```
- Number inputs use valueAsNumber:
  ```tsx
  onChange={(e) => field.handleChange(e.target.valueAsNumber)}
  ```
- Field validation can override form validation - design hierarchy carefully
- Submit handler: `onSubmit: async ({ value }) => { await mutate(value); form.reset(); }`
- Disable during submit: `<button disabled={!form.state.canSubmit || form.state.isSubmitting}>`
- Async validation: use `onChangeAsync` for server-side checks

## Styling with shadcn/ui

- Components: copy-owned, live in `src/components/ui/`. Add via `pnpx shadcn@latest add <name>`. See [ui.shadcn.com](https://ui.shadcn.com).
- Theme: CSS vars in `src/index.css` (`:root` / `.dark`). Customise at [ui.shadcn.com/themes](https://ui.shadcn.com/themes).
- Dark mode: toggle the `dark` class on `<html>`. The `@custom-variant dark` in `index.css` wires it up.
- Prefer semantic color tokens (`bg-primary`, `text-muted-foreground`) over raw Tailwind colors.

## Other Guidelines

- When stuck: check official docs first (docs.convex.dev, tanstack.com, ui.shadcn.com)
- Verify responsive design at multiple breakpoints
- Document non-obvious implementation choices in this file
- Import icons from `lucide-react`
- When making identical changes to multiple occurrences, use Edit with `replace_all: true` instead of MultiEdit. Avoid MultiEdit whenever possible, it is unreliable.
- Never leave floating promisses, use void when needed
