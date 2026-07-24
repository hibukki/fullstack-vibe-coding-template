import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import "./index.css";

import { env } from "./env";
import { routeTree } from "./routeTree.gen";

// Create clients outside of components to avoid recreating them on re-renders
const convex = new ConvexReactClient(env.VITE_CONVEX_URL);
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error("Query error", query.queryKey, error);
    },
  }),
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
      staleTime: Infinity,
      // With staleTime Infinity, gcTime is how long an unmounted query keeps its
      // live Convex WebSocket subscription; the default 5min holds subscriptions
      // long after navigating away. ~10s still bridges loader-prefetch -> mount.
      // https://github.com/get-convex/convex-react-query#setup recommends tuning this.
      gcTime: 10_000,
    },
  },
});
convexQueryClient.connect(queryClient);

const router = createRouter({
  routeTree,
  // preloadStaleTime 0 hands staleness to TanStack Query (Convex pushes fresh results
  // over the WebSocket): https://tanstack.com/router/latest/docs/framework/react/guide/preloading
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
    convexClient: convex,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
