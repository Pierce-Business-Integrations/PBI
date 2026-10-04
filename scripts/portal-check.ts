import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
  info() {},
  error() {},
});
async function main() {
  const { portalSetupReport } = await import("../src/lib/portal/readiness");
  const report = await portalSetupReport(process.argv.includes("--verify"));
  console.log(JSON.stringify(report, null, 2));
  if (process.env.SUPABASE_DB_URL && process.argv.includes("--verify")) {
    try {
      (await (await import("../src/lib/portal/db")).portalDb()).close();
    } catch {
      /* The report already includes a connection failure. */
    }
  }
  if (
    report.checks.some(
      (check) => check.status === "missing" || check.status === "failed",
    )
  )
    process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "Portal setup check failed. Review server configuration; secrets are never printed.",
  );
  process.exitCode = 1;
});
