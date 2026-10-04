export type ProviderMode = "test" | "live";

export function portalProviderMode(): ProviderMode {
  const mode = process.env.PORTAL_PROVIDER_MODE?.trim() || "test";
  if (mode !== "test" && mode !== "live")
    throw new Error("PORTAL_PROVIDER_MODE must be test or live");
  return mode;
}

export function clientProjectsEnabled() {
  return process.env.PORTAL_ALLOW_CLIENT_PROJECTS === "true";
}

export function assertClientProjectAccess(simulated: boolean, dialect: string) {
  if (!clientProjectsEnabled() || simulated || dialect !== "postgres")
    throw new Error(
      "Enable client projects after configuring the hosted owner account",
    );
}

export function assertProviderRecord(
  demo: boolean,
  simulated: boolean,
  dialect: string,
) {
  const mode = portalProviderMode();
  if (mode === "test" && !demo)
    throw new Error(
      "Use an example project for provider testing. Client payments and signatures require live mode.",
    );
  if (mode === "live") {
    if (demo)
      throw new Error(
        "Example projects cannot use live payments or signatures",
      );
    assertClientProjectAccess(simulated, dialect);
  }
  return mode;
}
