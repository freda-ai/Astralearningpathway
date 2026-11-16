import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const { next, email } = await searchParams;
  if (await getSessionUser()) redirect(next?.startsWith("/") ? next : "/");
  return <AuthForm mode="login" next={next} email={email} />;
}
