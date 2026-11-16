import { execSync } from "node:child_process";

export default function globalSetup() {
  const url = process.env.E2E_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/kente_e2e";
  const db = new URL(url).pathname.slice(1);
  execSync(`scripts/reset-db.sh ${db}`, { stdio: "inherit" });
}
