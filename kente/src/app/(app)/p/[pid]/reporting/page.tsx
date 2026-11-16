import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Reporting" };

export default function ReportingPage() {
  return (
    <ComingSoon title="Reporting" description="Structured implementation reports for every task." slice={6}>
      Leads write a report for each task, reviewers approve it, and one click compiles a funder report in Word or PDF.
    </ComingSoon>
  );
}
