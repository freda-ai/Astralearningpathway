"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/lib/auth/actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function AuthForm({ mode, next, email }: { mode: "login" | "signup"; next?: string; email?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(mode === "login" ? signIn : signUp, {});
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <Card>
      <CardBody className="space-y-5 p-6">
        <div>
          <h1 className="text-xl font-semibold">{mode === "login" ? "Sign in" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "login" ? "Welcome back." : "Set up Kente for your organisation in a few minutes."}
          </p>
        </div>
        <form action={action} className="space-y-4">
          {next && <input type="hidden" name="next" value={next} />}
          {mode === "signup" && (
            <Field label="Full name" htmlFor="name">
              <Input id="name" name="name" autoComplete="name" required />
            </Field>
          )}
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" autoComplete="email" defaultValue={email} required />
          </Field>
          <Field label="Password" htmlFor="password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </Field>
          <FormMessage error={state.error} message={state.message} />
          <SubmitButton className="w-full" pendingText={mode === "login" ? "Signing in…" : "Creating account…"}>
            {mode === "login" ? "Sign in" : "Create account"}
          </SubmitButton>
        </form>
        <p className="text-center text-sm text-muted">
          {mode === "login" ? (
            <>
              New to Kente?{" "}
              <Link href={`/signup${q}`} className="font-medium text-ink underline underline-offset-4">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={`/login${q}`} className="font-medium text-ink underline underline-offset-4">
                Sign in
              </Link>
            </>
          )}
        </p>
      </CardBody>
    </Card>
  );
}
