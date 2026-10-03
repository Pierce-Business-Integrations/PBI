"use client";
import { useState } from "react";
const input =
  "mt-2 w-full rounded-lg border border-[#233a30]/25 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#779c69]/40";
export default function SignInForm({
  next,
  callbackError,
}: {
  next: string;
  callbackError?: boolean;
}) {
  const [mode, setMode] = useState<"email" | "verify" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    callbackError ? "We couldn't finish signing you in. Please try again." : "",
  );
  async function submit(action: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email, password, code, next }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      setMode("verify");
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
    setBusy(false);
  }
  return (
    <div className="w-full max-w-sm">
      <button
        disabled={busy}
        onClick={() => submit("google")}
        className="flex w-full items-center justify-center rounded-lg border border-[#233a30]/20 bg-white px-5 py-3 text-sm font-medium disabled:opacity-50"
      >
        Continue with Google
      </button>
      <div className="my-6 flex items-center gap-3 text-xs text-[#233a30]/55">
        <span className="h-px flex-1 bg-[#233a30]/15" />
        or use your email
        <span className="h-px flex-1 bg-[#233a30]/15" />
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(mode);
        }}
        className="space-y-4"
      >
        <label className="block text-sm font-medium">
          Email address
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            readOnly={mode === "verify"}
            className={input}
          />
        </label>
        {mode === "password" && (
          <label className="block text-sm font-medium">
            Password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={input}
            />
          </label>
        )}
        {mode === "verify" && (
          <label className="block text-sm font-medium">
            Sign-in code
            <input
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6,10}"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={input}
            />
          </label>
        )}
        <button
          disabled={busy}
          type="submit"
          className="w-full rounded-lg bg-[#233a30] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy
            ? "Please wait…"
            : mode === "email"
              ? "Email me a sign-in code"
              : "Sign in"}
        </button>
      </form>
      {message && (
        <p role="status" className="mt-4 text-sm leading-6">
          {message}
        </p>
      )}
      <button
        disabled={busy}
        className="mt-5 text-sm underline underline-offset-4"
        onClick={() => {
          setMessage("");
          setCode("");
          setMode(mode === "email" ? "password" : "email");
        }}
      >
        {mode === "email"
          ? "Sign in with a password"
          : "Use an email code instead"}
      </button>
      <p className="mt-7 text-xs leading-5 text-[#233a30]/65">
        Access is reserved for clients and team members invited by PBI.
      </p>
    </div>
  );
}
