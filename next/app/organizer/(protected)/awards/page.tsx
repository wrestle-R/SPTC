import { Medal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function OrganizerAwardsPage() {
  return <div className="flex flex-col gap-6"><div><h1 className="text-2xl font-semibold">Awards</h1><p className="mt-1 text-sm text-muted-foreground">Confirm match and tournament awards after results are available.</p></div><Card className="shadow-none"><CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center"><Medal /><div><h2 className="font-semibold">No award recommendations yet</h2><p className="mt-1 text-sm text-muted-foreground">Recommendations are generated from accepted match events.</p></div></CardContent></Card></div>;
}
