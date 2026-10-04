"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const input =
  "mt-2 block w-full rounded-lg border border-[#233a30]/25 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#779c69]/40";
export default function ProfileForm({
  name: initialName,
  email,
}: {
  name: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function save(action: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/portal/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, name, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setPassword("");
      setMessage(
        action === "name"
          ? "Your profile has been updated."
          : "Your password has been updated.",
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
    setBusy(false);
  }
  return (
    <div className="max-w-lg space-y-8 p-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save("name");
        }}
      >
        <h2 className="text-base font-semibold">Your details</h2>
        <label className="mt-5 block text-sm font-medium">
          Full name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={100}
            autoComplete="name"
            className={input}
          />
        </label>
        <p className="mt-5 text-sm font-medium">Sign-in email</p>
        <p className="mt-2 text-sm">{email}</p>
        <p className="mt-2 text-xs leading-5 text-[#233a30]/65">
          Contact PBI to change your sign-in email and keep your project access
          connected.
        </p>
        <button
          disabled={busy}
          className="mt-5 rounded-lg bg-[#233a30] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          Save details
        </button>
      </form>
      <form
        className="border-t border-[#233a30]/15 pt-7"
        onSubmit={(event) => {
          event.preventDefault();
          void save("password");
        }}
      >
        <h2 className="text-base font-semibold">Password</h2>
        <p className="mt-2 text-sm leading-6 text-[#233a30]/70">
          Set a password if you prefer it to email codes or Google sign-in.
        </p>
        <label className="mt-4 block text-sm font-medium">
          New password
          <input
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={input}
          />
        </label>
        <p className="mt-2 text-xs text-[#233a30]/65">
          Use at least 12 characters.
        </p>
        <button
          disabled={busy}
          className="mt-5 rounded-lg border border-[#233a30]/25 px-5 py-3 text-sm font-medium disabled:opacity-50"
        >
          Update password
        </button>
      </form>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
