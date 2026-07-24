import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// Retry wiring per
// https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading#error-handling-with-tanstack-query
export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Reset TanStack Query's error boundary so errored queries refetch on retry
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  const fullError = error.stack?.includes(error.message)
    ? error.stack
    : [error.message, error.stack].filter(Boolean).join("\n\n");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 bg-background p-6">
      <h1 className="text-2xl font-semibold text-destructive">
        Something went wrong
      </h1>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border bg-muted p-4 text-sm select-text">
        {fullError}
      </pre>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() =>
            void navigator.clipboard
              .writeText(fullError)
              .then(() => setCopied(true))
          }
        >
          {copied ? "Copied!" : "Copy error"}
        </Button>
        <Button
          onClick={() => {
            reset();
            void router.invalidate();
          }}
        >
          Try again
        </Button>
        <Button variant="outline" onClick={() => location.reload()}>
          Reload page
        </Button>
      </div>
    </div>
  );
}
