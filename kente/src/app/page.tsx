import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getWorkspaces } from "@/lib/data/context";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const ws = await getWorkspaces(user.id);
  redirect(ws.length ? "/programmes" : "/onboarding");
}
