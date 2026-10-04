import { retrySignWellEvents } from "../src/lib/portal/signing";
import { portalDb } from "../src/lib/portal/db";
async function main() {
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
