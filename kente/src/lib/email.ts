import "server-only";

export interface Email {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email through Resend. Without RESEND_API_KEY the message is
 * logged to the server console instead (local development).
 */
export async function sendEmail(email: Email): Promise<{ delivered: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email] to=${email.to} subject="${email.subject}"\n${email.text}`);
    return { delivered: false };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Kente <noreply@example.com>",
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });
  if (!res.ok) {
    console.error(`[email] Resend refused the message: ${res.status} ${await res.text()}`);
    return { delivered: false };
  }
  return { delivered: true };
}

export function appUrl(path = ""): string {
  return `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
