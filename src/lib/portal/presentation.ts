export function projectDisplayName(name: string, example: boolean) {
  if (!example) return name;
  const clean = name.replace(/\s*\(demo\)\s*$/i, "");
  return clean === "Second isolated example" ? "Workflow improvement" : clean;
}

export function projectDisplaySummary(summary: string, example: boolean) {
  if (!example) return summary;
  return summary.replace(/^An illustrative partnership/i, "A partnership");
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatPortalDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value,
  );
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}
