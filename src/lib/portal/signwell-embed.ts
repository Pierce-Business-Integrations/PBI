"use client";
type EmbedOptions = {
  url: string;
  allowRedirect: boolean;
  events: { completed: () => void; closed: () => void; error: () => void };
};
declare global {
  interface Window {
    SignWellEmbed?: new (options: EmbedOptions) => { open(): void };
  }
}
let loading: Promise<void> | undefined;
function load() {
  if (window.SignWellEmbed) return Promise.resolve();
  if (!loading)
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://static.signwell.com/assets/embedded.js";
      script.async = true;
      script.onload = () =>
        window.SignWellEmbed
          ? resolve()
          : reject(new Error("Signing could not load. Please try again."));
      script.onerror = () => {
        script.remove();
        loading = undefined;
        reject(new Error("Signing could not load. Please try again."));
      };
      document.head.appendChild(script);
    });
  return loading;
}
export async function openSignWell(
  url: string,
  onComplete: () => void,
  onError: () => void,
) {
  await load();
  const Constructor = window.SignWellEmbed;
  if (!Constructor) throw new Error("Signing is temporarily unavailable");
  const embed = new Constructor({
    url,
    allowRedirect: false,
    events: { completed: onComplete, closed: () => {}, error: onError },
  });
  embed.open();
}
