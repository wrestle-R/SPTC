"use client";

import { FormEvent, useState } from "react";
import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function OrganizerAccessGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/organizer/access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Access denied." }));
      setError(body.error ?? "Access denied.");
      setPending(false);
      return;
    }
    router.replace("/organizer");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><ShieldCheck /></span>
          <CardTitle>Organizer access</CardTitle>
          <CardDescription>Enter the organizer code once. This device will be remembered.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Organizer access code" autoFocus autoComplete="one-time-code" inputMode="numeric" maxLength={5} type="password" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className="h-10 pl-9 text-center tracking-[0.35em]" />
            </div>
            {error ? <p role="alert" className="text-center text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending || code.length !== 5}>
              {pending ? <LoaderCircle className="animate-spin" /> : <KeyRound />} Unlock organizer
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
