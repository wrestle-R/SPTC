"use client";

import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FirebaseStatus() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
        <Database />
      </span>
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-medium">Tournament</p>
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">Secure</Badge>
        </div>
        <p className="truncate text-[11px] text-muted-foreground">Firebase live data</p>
      </div>
    </div>
  );
}
