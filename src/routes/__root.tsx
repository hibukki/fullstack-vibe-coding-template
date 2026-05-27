import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth as useClerkAuth,
  useUser,
} from "@clerk/clerk-react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  Authenticated,
  ConvexReactClient,
  Unauthenticated,
  useMutation,
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
}>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient, convexClient: convex } = Route.useRouteContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      signUpFallbackRedirectUrl="/"
      signInFallbackRedirectUrl="/"
      afterSignOutUrl="/"
    >
      <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen flex flex-col">
            <Authenticated>
              <EnsureUser />
              {/* Navbar */}
              <header className="border-b bg-background shadow-sm">
                <div className="container mx-auto flex h-14 items-center px-4">
                  {/* Mobile menu trigger */}
                  <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2 lg:hidden"
                        aria-label="Open menu"
                      >
                        <Menu className="size-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64">
                      <SheetHeader>
                        <SheetTitle>Menu</SheetTitle>
                      </SheetHeader>
                      <nav className="flex flex-col gap-2 p-4">
                        <Link
                          to="/"
                          onClick={() => setIsSidebarOpen(false)}
                          className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                          activeProps={{
                            className:
                              "rounded-md px-3 py-2 text-sm font-medium bg-accent text-accent-foreground",
                          }}
                        >
                          Home
                        </Link>
                      </nav>
                      <div className="mt-auto border-t p-4 flex justify-center">
                        <UserButton />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Logo */}
                  <Link
                    to="/"
                    className="text-xl font-semibold hover:opacity-80 transition-opacity"
                  >
                    Fullstack Vibe Coding
                  </Link>

                  {/* Desktop nav */}
                  <nav className="hidden lg:flex ml-6 gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        to="/"
                        activeProps={{ className: "bg-accent" }}
                      >
                        Home
                      </Link>
                    </Button>
                  </nav>

                  <div className="ml-auto">
                    <UserButton />
                  </div>
                </div>
              </header>

              {/* Main content */}
              <main className="flex-1 container mx-auto p-4">
                <Outlet />
              </main>

              <footer className="border-t py-4 text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Fullstack Vibe Coding</p>
              </footer>
            </Authenticated>

            <Unauthenticated>
              <header className="border-b bg-background shadow-sm">
                <div className="container mx-auto flex h-14 items-center justify-between px-4">
                  <h1 className="font-semibold">Fullstack Vibe Coding</h1>
                  <div className="flex gap-2">
                    <SignInButton mode="modal">
                      <Button size="sm">Sign in</Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button variant="ghost" size="sm">
                        Sign up
                      </Button>
                    </SignUpButton>
                  </div>
                </div>
              </header>
              <main className="flex-1 container mx-auto p-4">
                <Outlet />
              </main>
              <footer className="border-t py-4 text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Fullstack Vibe Coding</p>
              </footer>
            </Unauthenticated>
          </div>
          {import.meta.env.DEV && <TanStackRouterDevtools />}
        </QueryClientProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

function EnsureUser() {
  const { isLoaded, isSignedIn, user } = useUser();
  const ensureUser = useMutation(api.users.ensureUser);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      void ensureUser();
    }
  }, [isLoaded, isSignedIn, user, ensureUser]);

  return null;
}
