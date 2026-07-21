import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border bg-background shadow-sm">
        <Image src="/logo.png" alt="" fill sizes="40px" className="object-contain" priority />
      </span>
      {!compact ? (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold">Sports Fiesta</span>
        </span>
      ) : null}
    </div>
  );
}
