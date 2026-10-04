import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
  info() {},
  error() {},
});
async function main() {
  const { reconcilePortalProviders } =
    await import("../src/lib/portal/maintenance");
  try {
    console.log(JSON.stringify(await reconcilePortalProviders(), null, 2));
  } finally {
    (await (await import("../src/lib/portal/db")).portalDb()).close();
  }
}
main().catch(() => {
  console.error(
    "Portal recovery failed. Check provider configuration; no secrets are printed.",
  );
  process.exitCode = 1;
});
