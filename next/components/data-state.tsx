import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ContentSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-3" aria-label="Loading tournament data">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function DataError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Unable to load live data</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{message}</span>
        <Button variant="outline" size="sm" onClick={retry}>
          <RefreshCw data-icon="inline-start" /> Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
