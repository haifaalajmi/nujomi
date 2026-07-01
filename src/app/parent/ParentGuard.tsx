"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFamilyData } from "./family-data-context";
import { KID_MODE_KEY } from "@/lib/kid-mode";

export function ParentGuard({ children }: { children: React.ReactNode }) {
  const { family, loading } = useFamilyData();
  const [locked, setLocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (loading) return;
    const kidModeActive = typeof window !== "undefined" && sessionStorage.getItem(KID_MODE_KEY) === "1";
    setLocked(Boolean(kidModeActive && family?.passcode_hash));
    setChecked(true);
  }, [loading, family?.passcode_hash]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("verify_family_passcode", { p_passcode: code });
    setVerifying(false);
    if (error || !data) {
      setError("Incorrect passcode. Try again.");
      return;
    }
    sessionStorage.removeItem(KID_MODE_KEY);
    setLocked(false);
  };

  if (!checked) return null;

  if (family?.status === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-sm bg-[var(--color-panel)] rounded-3xl p-8 shadow-xl text-center">
          <h1 className="text-white text-lg mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Account suspended
          </h1>
          <p className="text-[var(--color-slate)] text-sm">
            This family account has been suspended. Please contact support to reactivate it.
          </p>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-xs bg-[var(--color-panel)] rounded-3xl p-8 shadow-xl text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Lock size={20} color="#fff" />
          </div>
          <h1 className="text-white text-lg mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Parent passcode
          </h1>
          <p className="text-[var(--color-slate)] text-xs mb-5">Enter the passcode to leave kid mode.</p>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-center tracking-[0.3em] rounded-xl border-0 bg-white/10 text-white px-3 py-3 text-lg outline-none focus:ring-2 focus:ring-[var(--color-purple)]"
              placeholder="••••"
            />
            {error && <p className="text-[var(--color-coral)] text-xs font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={verifying}
              className="rounded-xl bg-[var(--color-purple)] text-white font-bold py-2.5 text-sm disabled:opacity-60"
            >
              {verifying ? "Checking…" : "Unlock"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
