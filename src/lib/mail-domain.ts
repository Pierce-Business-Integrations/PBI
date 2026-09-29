/** Accept a plain address or a named sender on the confirmed PBI mail domain. */
export function usesPbiMailDomain(value: string | undefined): boolean {
  return /(?:^|<)[^<>\s@]+@pbintegrations\.com>?$/i.test(value?.trim() || "");
}
