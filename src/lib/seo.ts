import { site } from "./site";

/** Keep client and test deployments separate from the public search site. */
export function isPrivateSearchHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const hostname = host.trim().toLowerCase().replace(/:\d+$/, "");
  const publicHost = new URL(site.url).hostname;
  return (
    hostname === `client.${publicHost}` ||
    hostname === `beta.${publicHost}` ||
    hostname.endsWith(".vercel.app")
  );
}
