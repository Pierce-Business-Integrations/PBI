// Allow only private, same-origin destinations. Never redirect to a caller-supplied host.
export function authDestination(value: string | null | undefined) {
  if (
    !value ||
    !/^\/(portal|account)(\/|\?|$)/.test(value) ||
    value.includes("\\")
  )
    return "/account";
  try {
    const url = new URL(value, "https://portal.invalid");
    return url.origin === "https://portal.invalid" &&
      /^\/(portal|account)(\/|$)/.test(url.pathname)
      ? url.pathname + url.search
      : "/account";
  } catch {
    return "/account";
  }
}
