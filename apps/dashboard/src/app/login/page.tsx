"use client";

import { useState } from "react";
import { Bot, Mail, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function sendMagicLink() {
    setError(null);
    if (!supabase) {
      setError("Supabase is not configured yet. Add env vars to enable login.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="glass w-full max-w-sm p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-neon-cyan/30 to-neon-violet/30 shadow-glow shadow-neon-cyan">
            <Bot className="h-6 w-6 text-neon-cyan" />
          </div>
          <div>
            <div className="text-lg font-bold text-ink">AICOS</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink-faint">
              Admin access
            </div>
          </div>
        </div>

        {sent ? (
          <p className="text-sm text-neon-green">
            Magic link sent to <span className="font-medium">{email}</span>. Check your inbox.
          </p>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-ink-faint">
                Admin email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-bg-soft/70 py-3 pl-10 pr-3 text-sm text-ink outline-none focus:border-neon-cyan/60"
                />
              </div>
            </label>
            <button
              onClick={sendMagicLink}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 py-3 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20"
            >
              <KeyRound className="h-4 w-4" /> Send magic link
            </button>
            {error && <p className="text-xs text-neon-red">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
