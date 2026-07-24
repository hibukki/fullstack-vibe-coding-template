import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

// https://docs.convex.dev/testing/convex-test

test("getCurrentUser returns null when not authenticated", async () => {
  const t = convexTest(schema, modules);

  expect(await t.query(api.users.getCurrentUser, {})).toBeNull();
});

test("getCurrentUser returns the user after ensureUser", async () => {
  const t = convexTest(schema, modules);
  const asSarah = t.withIdentity({ subject: "clerk|sarah", name: "Sarah" });

  await asSarah.mutation(api.users.ensureUser, {});

  expect(await asSarah.query(api.users.getCurrentUser, {})).toMatchObject({
    clerkId: "clerk|sarah",
    name: "Sarah",
  });
});

test("ensureUser upserts: creates once, updates name on change", async () => {
  const t = convexTest(schema, modules);
  const asSarah = t.withIdentity({ subject: "clerk|sarah", name: "Sarah" });

  const created = await asSarah.mutation(api.users.ensureUser, {});
  const unchanged = await asSarah.mutation(api.users.ensureUser, {});
  expect(unchanged?._id).toEqual(created?._id);

  const asRenamedSarah = t.withIdentity({
    subject: "clerk|sarah",
    name: "Sarah Connor",
  });
  const renamed = await asRenamedSarah.mutation(api.users.ensureUser, {});
  expect(renamed).toMatchObject({ _id: created?._id, name: "Sarah Connor" });

  const users = await asSarah.query(api.users.listUsers, {});
  expect(users).toHaveLength(1);
});

test("listUsers throws for unauthenticated callers", async () => {
  const t = convexTest(schema, modules);

  await expect(t.query(api.users.listUsers, {})).rejects.toThrowError(
    ConvexError,
  );
});

test("listUsers throws until the user row is provisioned", async () => {
  const t = convexTest(schema, modules);
  const asSarah = t.withIdentity({ subject: "clerk|sarah", name: "Sarah" });

  // Authenticated with Clerk, but ensureUser hasn't run yet
  // (the first-login provisioning window)
  await expect(asSarah.query(api.users.listUsers, {})).rejects.toThrowError(
    ConvexError,
  );

  await asSarah.mutation(api.users.ensureUser, {});

  expect(await asSarah.query(api.users.listUsers, {})).toMatchObject([
    { clerkId: "clerk|sarah", name: "Sarah" },
  ]);
});
