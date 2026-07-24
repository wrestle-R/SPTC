"use client";

import type { Team } from "@sports-fiesta/domain";
import { History, LoaderCircle, Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { callOrganizerCommand, usePrivateCollection } from "@/lib/organizer-data";

type ManualPointsAdjustment = {
  id: string;
  type: "manual-points-adjustment";
  confirmed: boolean;
  teamId: string;
  points: number;
  reason: string;
  createdAt?: string;
};

function formatDate(value?: string) {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function OrganizerMiscellaneous() {
  const teams = usePrivateCollection<Team>("teams");
  const awards = usePrivateCollection<ManualPointsAdjustment>("awards");
  const [pending, setPending] = useState(false);
  const [adjustmentToDelete, setAdjustmentToDelete] = useState<ManualPointsAdjustment | null>(null);
  const adjustments = useMemo(
    () => awards.data
      .filter((award) => award.type === "manual-points-adjustment")
      .sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""))),
    [awards.data],
  );
  const teamNames = useMemo(() => new Map(teams.data.map((team) => [team.id, team.name])), [teams.data]);

  async function saveAdjustment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "").trim();
    const points = Number(form.get("points"));
    if (!reason) {
      toast.error("A reason is required for every point correction.");
      return;
    }
    if (!Number.isInteger(points) || points === 0) {
      toast.error("Enter a non-zero whole number of points.");
      return;
    }
    setPending(true);
    try {
      await callOrganizerCommand("saveManualPointsAdjustment", { teamId: form.get("teamId"), points, reason });
      event.currentTarget.reset();
      toast.success(points > 0 ? "Points added to the team." : "Points deducted from the team.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save the point correction.");
    } finally {
      setPending(false);
    }
  }

  async function deleteAdjustment() {
    if (!adjustmentToDelete) return;
    setPending(true);
    try {
      await callOrganizerCommand("deleteManualPointsAdjustment", { id: adjustmentToDelete.id });
      toast.success("Point correction deleted and standings recalculated.");
      setAdjustmentToDelete(null);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not delete the point correction.");
    } finally {
      setPending(false);
    }
  }

  if (teams.loading || awards.loading) return <ContentSkeleton />;
  if (teams.error || awards.error) return <DataError message={teams.error ?? awards.error ?? "Unable to load point corrections."} retry={teams.error ? teams.retry : awards.retry} />;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Organizer tools</p>
        <h1 className="mt-1 text-2xl font-semibold">Miscellaneous</h1>
        <p className="mt-1 text-sm text-muted-foreground">Correct a team&apos;s total when an exceptional issue needs a manual decision.</p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="size-5 text-emerald-500" /> Add or deduct team points</CardTitle>
          <CardDescription>Use a positive number to add points or a negative number to deduct them. A reason is required and every correction is recorded below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveAdjustment}>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="adjustment-team">Team</FieldLabel>
                  <select id="adjustment-team" name="teamId" required className="h-10 w-full rounded-lg border bg-background px-3 text-sm">
                    <option value="">Choose team</option>
                    {teams.data.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="adjustment-points">Points</FieldLabel>
                  <Input id="adjustment-points" name="points" type="number" step="1" min="-1000" max="1000" required placeholder="e.g. 20 or -20" />
                  <FieldDescription>Whole number from -1000 to 1000, excluding 0.</FieldDescription>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="adjustment-reason">Reason <span className="text-destructive">*</span></FieldLabel>
                <Textarea id="adjustment-reason" name="reason" required maxLength={500} placeholder="Explain why this correction is needed." />
              </Field>
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Plus data-icon="inline-start" />}
                Save point correction
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="size-5 text-primary" /> Correction history</CardTitle>
          <CardDescription>Deleting an entry removes its effect from the team standings immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          {adjustments.length === 0 ? <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">No manual point corrections have been recorded.</p> : (
            <div className="divide-y rounded-xl border">
              {adjustments.map((adjustment) => {
                const isAddition = adjustment.points > 0;
                return (
                  <div key={adjustment.id} className="flex items-start gap-3 p-4 sm:items-center sm:gap-4">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${isAddition ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                      {isAddition ? <Plus className="size-5" /> : <Minus className="size-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-semibold">{teamNames.get(adjustment.teamId) ?? "Unknown team"}</p>
                        <span className={`font-bold tabular-nums ${isAddition ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>{isAddition ? "+" : ""}{adjustment.points} pts</span>
                      </div>
                      <p className="mt-1 break-words text-sm text-muted-foreground">{adjustment.reason}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(adjustment.createdAt)}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setAdjustmentToDelete(adjustment)} aria-label={`Delete ${adjustment.points} point correction for ${teamNames.get(adjustment.teamId) ?? "team"}`}>
                      <Trash2 />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(adjustmentToDelete)} onOpenChange={(open) => { if (!open && !pending) setAdjustmentToDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this point correction?</DialogTitle>
            <DialogDescription>This will remove the correction from the standings. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>Cancel</DialogClose>
            <Button type="button" variant="destructive" disabled={pending} onClick={deleteAdjustment}>
              {pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Trash2 data-icon="inline-start" />}
              Delete correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
