import { Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const liveStatuses = new Set(["live", "innings-break", "super-over"]);

export function MatchStatusBadge({ status }: { status: string }) {
  const live = liveStatuses.has(status);
  const completed = status === "completed";
  const label = live ? "Live" : completed ? "Completed" : "Upcoming";
  return (
    <Badge
      variant={completed ? "outline" : "secondary"}
      className={cn(
        "h-6 px-2.5 font-semibold",
        live && "border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        !live && !completed && "border border-blue-500/25 bg-blue-500/15 text-blue-700 dark:text-blue-300",
        completed && "text-muted-foreground",
      )}
    >
      {live ? <Radio data-icon="inline-start" className="animate-pulse" /> : null}
      {label}
    </Badge>
  );
}
