import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-muted">This page doesn&rsquo;t exist, or you don&rsquo;t have access to it.</p>
      <Link href="/programmes" className="mt-6 text-sm font-medium underline underline-offset-4">
        Back to programmes
      </Link>
    </main>
  );
}
