import { DatabaseZap } from "lucide-react";
import { app } from "@/lib/firebase";

export function FirebaseStatus() {
  return (
    <div className="rounded-lg border border-green/25 bg-green/10 p-3">
      <div className="flex items-center gap-2">
        <DatabaseZap className="size-4 text-green" aria-hidden="true" />
        <p className="text-sm font-black text-green">Firebase ready</p>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-strong">
        Firestore project: {app.options.projectId}
      </p>
    </div>
  );
}
