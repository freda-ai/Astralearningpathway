import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Vault" };

export default function VaultPage() {
  return (
    <ComingSoon title="Vault" description="A single, searchable home for programme records." slice={5}>
      Upload proposals, reports and spreadsheets, organise them into folders and tags, and link them to tasks and metrics.
    </ComingSoon>
  );
}
