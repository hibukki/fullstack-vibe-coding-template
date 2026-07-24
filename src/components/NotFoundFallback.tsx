import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFoundFallback() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
