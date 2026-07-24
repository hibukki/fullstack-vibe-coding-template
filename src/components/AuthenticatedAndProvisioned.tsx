import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Authenticated } from "convex/react";
import type { ReactNode } from "react";
import { api } from "../../convex/_generated/api";

/**
 * Renders children only when the caller is authenticated AND their user row
 * exists, so children may call backend functions that crash on unauthorized
 * callers (getCurrentUserOrCrash).
 */
export function AuthenticatedAndProvisioned({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Authenticated>
      <ProvisionedGate>{children}</ProvisionedGate>
    </Authenticated>
  );
}

function ProvisionedGate({ children }: { children: ReactNode }) {
  const { data: currentUser } = useSuspenseQuery(
    convexQuery(api.users.getCurrentUser, {}),
  );

  // Null on a brand-new sign-in while the user row is being created. Inserting
  // the row invalidates the query's read set, so Convex re-runs it and the
  // children render automatically - no polling needed.
  if (currentUser === null) {
    return null;
  }

  return children;
}
