"use client";

import { S9_TEAMS, type Team } from "@sports-fiesta/domain";
import {
  AlertTriangle,
  Camera,
  Clock3,
  ImageUp,
  LoaderCircle,
  Medal,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { TeamIdentity } from "@/components/team-identity";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  EARLY_BIRD_POINTS,
  isEarlyBirdLocalTime,
  TIMELY_ARRIVAL_POINTS,
  type SubmissionType,
} from "@/lib/bonus-scoring";
import { callOrganizerCommand, usePrivateCollection } from "@/lib/organizer-data";
import type { ImageSubmission } from "@/lib/web-types";

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function pageCopy(type: SubmissionType) {
  if (type === "timely-arrival") {
    return {
      title: "Arrivals verification",
      description: "Verify the first four team photos and lock their Team of the Year arrival points.",
      command: "verifyArrival",
      empty: "No timely arrival submissions have been verified yet.",
      eyebrow: "Timely Arrival",
    };
  }
  return {
    title: "Early Bird verification",
    description: "Verify team photos posted before 2:30 PM and award the extra 100-point bonus.",
    command: "verifyEarlyBird",
    empty: "No early bird submissions have been verified yet.",
    eyebrow: "Early Bird Jackpot",
  };
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/organizer/upload", {
    method: "POST",
    body: formData,
  });
  const body = await response.json() as { url?: string; error?: { message?: string } };
  if (!response.ok || !body.url) throw new Error(body.error?.message ?? "Image upload failed.");
  return body.url;
}

export function OrganizerImageVerification({ type }: { type: SubmissionType }) {
  const copy = pageCopy(type);
  const teamsState = usePrivateCollection<Team>("teams");
  const submissionsState = usePrivateCollection<ImageSubmission>("image_submissions");
  const teams = teamsState.data.length ? teamsState.data : S9_TEAMS;
  const submissions = submissionsState.data
    .filter((submission) => submission.type === type)
    .sort((a, b) => {
      if (type === "timely-arrival") return (a.arrivalPosition ?? 99) - (b.arrivalPosition ?? 99);
      return a.groupPostedAt.localeCompare(b.groupPostedAt);
    });

  const [teamId, setTeamId] = useState("");
  const [arrivalPosition, setArrivalPosition] = useState("1");
  const [groupPostedAt, setGroupPostedAt] = useState("");
  const [memberCountConfirmed, setMemberCountConfirmed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (teamsState.loading || submissionsState.loading) return <ContentSkeleton rows={2} />;
  if (teamsState.error || submissionsState.error) {
    return <DataError message={teamsState.error ?? submissionsState.error ?? "Failed to load verification data."} retry={teamsState.retry} />;
  }

  const selectedTeamId = teamId || teams.find((team) => !submissions.some((submission) => submission.teamId === team.id))?.id || "";
  const duplicateTeam = Boolean(selectedTeamId && submissions.some((submission) => submission.teamId === selectedTeamId));
  const earlyBirdEligible = type === "early-bird" && groupPostedAt ? safeEarlyBirdCheck(groupPostedAt) : true;
  const previewPoints = type === "timely-arrival"
    ? TIMELY_ARRIVAL_POINTS[Number(arrivalPosition) as 1 | 2 | 3 | 4]
    : EARLY_BIRD_POINTS;
  const positionTaken = type === "timely-arrival"
    ? submissions.some((submission) => String(submission.arrivalPosition ?? "") === arrivalPosition)
    : false;

  function handleFileChange(nextFile: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTeamId) {
      setFormError("Choose a team.");
      return;
    }
    if (!file) {
      setFormError("Upload the verified team photo.");
      return;
    }
    if (!memberCountConfirmed) {
      setFormError("Confirm that the photo shows at least 14 members in official jerseys.");
      return;
    }
    if (duplicateTeam) {
      setFormError("This team is already verified for this bonus.");
      return;
    }
    if (positionTaken) {
      setFormError("That arrival position is already assigned.");
      return;
    }
    if (type === "early-bird" && !earlyBirdEligible) {
      setFormError("Early Bird applies only to photos posted before 2:30 PM.");
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const imageUrl = await uploadImage(file);
      await callOrganizerCommand(copy.command, {
        teamId: selectedTeamId,
        imageUrl,
        groupPostedAt,
        memberCountConfirmed,
        ...(type === "timely-arrival" ? { arrivalPosition: Number(arrivalPosition) } : {}),
      });
      toast.success(`${copy.eyebrow} verified.`);
      handleFileChange(null);
      setGroupPostedAt("");
      setMemberCountConfirmed(false);
      setArrivalPosition("1");
      setTeamId("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setPending(false);
    }
  }

  async function removeSubmission(id: string) {
    setDeleteId(id);
    try {
      await callOrganizerCommand("deleteSubmission", { id });
      toast.success("Submission removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeleteId("");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.15),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] p-6 shadow-sm dark:bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.15),transparent_34%),linear-gradient(135deg,rgba(28,25,23,0.98),rgba(24,24,27,0.98))]">
        <Badge variant="secondary" className="w-fit">{copy.eyebrow}</Badge>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{copy.description}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageUp className="size-5 text-primary" />
              Verify photo
            </CardTitle>
            <CardDescription>Review the group photo manually, confirm the jersey count, then lock the points.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submit}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Team</FieldLabel>
                  <Select value={selectedTeamId} onValueChange={(value) => setTeamId(value ?? "")}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Choose a team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                            {submissions.some((submission) => submission.teamId === team.id) ? " · verified" : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>Each team can receive this bonus only once.</FieldDescription>
                </Field>

                {type === "timely-arrival" ? (
                  <Field>
                    <FieldLabel>Arrival position</FieldLabel>
                    <Select value={arrivalPosition} onValueChange={(value) => setArrivalPosition(value ?? "1")}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {[1, 2, 3, 4].map((position) => (
                            <SelectItem key={position} value={String(position)}>
                              {position === 1 ? "1st" : position === 2 ? "2nd" : position === 3 ? "3rd" : "4th"} · {TIMELY_ARRIVAL_POINTS[position as 1 | 2 | 3 | 4]} points
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                ) : null}

                <Field>
                  <FieldLabel htmlFor={`${type}-posted-at`}>Actual group-post time</FieldLabel>
                  <Input
                    id={`${type}-posted-at`}
                    type="datetime-local"
                    value={groupPostedAt}
                    onChange={(event) => setGroupPostedAt(event.target.value)}
                    required
                  />
                  <FieldDescription>
                    {type === "early-bird" ? "Must be before 2:30 PM local event time." : "Use the timestamp from the group post."}
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${type}-file`}>Verified photo</FieldLabel>
                  <Input
                    id={`${type}-file`}
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                    required
                  />
                </Field>
              </FieldGroup>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="overflow-hidden rounded-[1.5rem] border border-dashed bg-muted/25">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Submission preview" className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                      <Camera className="size-6" />
                      <p className="max-w-xs text-sm">Upload the organizer-approved photo to preview it here before saving.</p>
                    </div>
                  )}
                </div>

                <Card className="shadow-none ring-1 ring-primary/10">
                  <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Points preview</p>
                      <p className="text-4xl font-black tracking-tight text-primary">{previewPoints}</p>
                      <p className="text-sm text-muted-foreground">
                        {type === "timely-arrival" ? "This arrival slot will be locked immediately after verification." : "This bonus is available only for verified photos before 2:30 PM."}
                      </p>
                    </div>
                    <div className="rounded-2xl border bg-background/70 p-4">
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={memberCountConfirmed}
                          onChange={(event) => setMemberCountConfirmed(event.target.checked)}
                          className="mt-1 size-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <span>
                          I verified that the photo shows at least 14 team members in official jerseys.
                        </span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {duplicateTeam ? (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Team already verified</AlertTitle>
                  <AlertDescription>Delete the existing entry below if you need to replace it.</AlertDescription>
                </Alert>
              ) : null}

              {type === "early-bird" && groupPostedAt && !earlyBirdEligible ? (
                <Alert variant="destructive">
                  <Clock3 className="size-4" />
                  <AlertTitle>Outside the Early Bird window</AlertTitle>
                  <AlertDescription>This photo was not posted before 2:30 PM.</AlertDescription>
                </Alert>
              ) : null}

              {formError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Verification blocked</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" disabled={pending}>
                {pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <ShieldCheck data-icon="inline-start" />}
                Save verification
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="size-5 text-primary" />
              Verified history
            </CardTitle>
            <CardDescription>Only verified {copy.eyebrow.toLowerCase()} entries appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Team</TableHead>
                      {type === "timely-arrival" ? <TableHead>Position</TableHead> : null}
                      <TableHead>Posted</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Photo</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => {
                      const team = teams.find((entry) => entry.id === submission.teamId);
                      if (!team) return null;
                      return (
                        <TableRow key={submission.id}>
                          <TableCell className="min-w-56">
                            <TeamIdentity team={team} compact subtitle={team.shortName} />
                          </TableCell>
                          {type === "timely-arrival" ? (
                            <TableCell className="font-semibold">{submission.arrivalPosition}</TableCell>
                          ) : null}
                          <TableCell className="text-sm text-muted-foreground">{formatWhen(submission.groupPostedAt)}</TableCell>
                          <TableCell className="font-black tabular-nums">{submission.pointsAwarded}</TableCell>
                          <TableCell>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={submission.imageUrl} alt={`${team.name} submission`} className="h-14 w-20 rounded-lg object-cover ring-1 ring-black/10" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deleteId === submission.id}
                              onClick={() => void removeSubmission(submission.id)}
                            >
                              {deleteId === submission.id ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed bg-muted/20 px-6 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
                  <ImageUp className="size-6" />
                </span>
                <div className="space-y-2">
                  <CardTitle>No verified photos yet</CardTitle>
                  <p className="text-sm text-muted-foreground">{copy.empty}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function safeEarlyBirdCheck(value: string) {
  try {
    return isEarlyBirdLocalTime(value);
  } catch {
    return true;
  }
}
