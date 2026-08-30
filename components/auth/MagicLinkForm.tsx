"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type MagicLinkFormProps = {
  email: string | null;
  onSignedOut: () => void;
};

export function MagicLinkForm({ email, onSignedOut }: MagicLinkFormProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!isSupabaseConfigured()) {
    return (
      <p className="type-label text-ink-soft">
        Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to
        sync notes to a table. Captures still save on this device.
      </p>
    );
  }

  if (email) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="type-label text-ink-soft">{email}</p>
        <button
          type="button"
          className="type-label text-ink-soft"
          onClick={async () => {
            const supabase = createClient();
            await supabase?.auth.signOut();
            onSignedOut();
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={async (event) => {
        event.preventDefault();
        const supabase = createClient();
        if (!supabase) return;
        setStatus("sending");
        const { error } = await supabase.auth.signInWithOtp({
          email: value.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            shouldCreateUser: true,
          },
        });
        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }
        setStatus("sent");
        setMessage("Check your email for the magic link.");
      }}
    >
      <input
        type="email"
        required
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="email for magic link"
        className="type-input h-12 flex-1 rounded-input border border-line bg-surface-2 px-4 text-ink outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="type-label h-12 rounded-pill bg-ink px-5 text-surface"
      >
        {status === "sending" ? "Sending" : "Send link"}
      </button>
      {message ? <p className="type-label w-full text-ink-soft">{message}</p> : null}
    </form>
  );
}
