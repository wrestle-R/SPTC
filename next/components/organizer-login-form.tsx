"use client";

import { httpsCallable } from "firebase/functions";
import { signInWithCustomToken } from "firebase/auth";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { auth, functions } from "@/lib/firebase";

function installationId() {
  const key = "sptc-organizer-installation";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  localStorage.setItem(key, value);
  return value;
}

export function OrganizerLoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const login = httpsCallable<{ pin: string; displayName: string; installationId: string }, { token: string }>(functions, "organizerLogin");
      const result = await login({
        pin: String(form.get("pin") ?? ""),
        displayName: String(form.get("displayName") ?? "Organizer"),
        installationId: installationId(),
      });
      const credential = await signInWithCustomToken(auth, result.data.token);
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/organizer/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) throw new Error("The website session could not be created.");
      router.replace("/organizer");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Organizer sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-none">
      <CardHeader className="items-start">
        <BrandLogo />
        <div className="pt-4"><CardTitle>Organizer access</CardTitle><CardDescription>Enter the private tournament PIN to continue.</CardDescription></div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="displayName">Display name</FieldLabel>
              <Input id="displayName" name="displayName" autoComplete="name" maxLength={60} required />
              <FieldDescription>Updates will be tagged with this name.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="pin">Organizer PIN</FieldLabel>
              <Input id="pin" name="pin" type="password" inputMode="numeric" autoComplete="current-password" minLength={5} maxLength={8} required />
            </Field>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <LockKeyhole data-icon="inline-start" />}
              {pending ? "Checking access" : "Continue"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
