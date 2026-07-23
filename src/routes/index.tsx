import { SignInButton } from "@clerk/clerk-react";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { Zap } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const usersQueryOptions = convexQuery(api.users.listUsers, {});

export const Route = createFileRoute("/")({
  loader: async ({ context: { queryClient } }) =>
    await queryClient.ensureQueryData(usersQueryOptions),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <Zap className="w-16 h-16 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Fullstack Vibe Coding</h1>

      <Unauthenticated>
        <p className="mb-4 text-muted-foreground">
          Sign in to see the list of users.
        </p>
        <SignInButton mode="modal">
          <Button size="lg">Get Started</Button>
        </SignInButton>
      </Unauthenticated>

      <Authenticated>
        <UsersList />
      </Authenticated>
    </div>
  );
}

function UsersList() {
  const { data: users } = useSuspenseQuery(usersQueryOptions);

  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Users</h2>

      {users.length === 0 ? (
        <div className="p-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">No users yet. You're the first!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    {new Date(user._creationTime).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
