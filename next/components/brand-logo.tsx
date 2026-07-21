import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Trophy aria-hidden="true" />
        <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-background bg-secondary text-[10px] font-bold text-secondary-foreground">
          9
        </span>
      </span>
      {!compact ? (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold">Sports Fiesta</span>
          <span className="block truncate text-xs text-muted-foreground">Season 9</span>
        </span>
      ) : null}
    </div>
  );
}
