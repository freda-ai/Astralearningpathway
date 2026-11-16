import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="kente-strip w-2 shrink-0" aria-hidden />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="w-full max-w-sm">{children}</div>
        <p className="mt-10 max-w-sm text-center text-xs text-muted">
          Programme management where every task rolls up to an outcome.
        </p>
      </main>
    </div>
  );
}
