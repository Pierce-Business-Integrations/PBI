import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
  info() {},
  error() {},
});
async function main() {
  const { retrySignWellEvents } = await import("../src/lib/portal/signing");
  const { portalDb } = await import("../src/lib/portal/db");
  if (!process.env.SIGNWELL_API_KEY)
    throw new Error("Configure SignWell before retrying queued events");
  try {
    console.log(await retrySignWellEvents());
  } finally {
    (await portalDb()).close();
  }
}
main().catch(() => {
  console.error("Signing reconciliation failed. Check server configuration.");
  process.exitCode = 1;
});
