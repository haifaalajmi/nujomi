"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, Copy, KeyRound, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFamilyData } from "../family-data-context";

export default function SettingsPage() {
  const { family, parents, loading } = useFamilyData();
  const supabase = useMemo(() => createClient(), []);
  const [copied, setCopied] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) return <div className="text-[var(--color-slate)] text-sm">Loading…</div>;

  const copyCode = async () => {
    if (!family) return;
    await navigator.clipboard.writeText(family.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const savePasscode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    if (!/^\d{4,6}$/.test(passcode)) {
      setError("Passcode must be 4-6 digits.");
      return;
    }
    if (passcode !== confirmPasscode) {
      setError("Passcodes don't match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("set_family_passcode", { p_passcode: passcode });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStatus("Passcode updated.");
    setPasscode("");
    setConfirmPasscode("");
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-white text-2xl mb-1" style={{ fontFamily: "var(--font-display)" }}>
        Settings
      </h1>
      <p className="text-[var(--color-slate)] text-sm mb-6">Manage your family account.</p>

      <div className="bg-[var(--color-panel-light)] border border-white/10 rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} color="#fff" />
          <h2 className="text-sm font-bold text-white">Parents on this account</h2>
        </div>
        <div className="flex flex-col gap-2">
          {parents.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span className="text-white">{p.full_name || p.email}</span>
              <span className="text-[var(--color-slate)] text-xs">{p.email}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-[var(--color-slate)] mb-2">
            Share this invite code with another parent so they can join and manage tasks &amp; rewards together.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white/10 text-white text-sm font-bold tracking-widest px-3 py-2 rounded-lg">
              {family?.invite_code}
            </code>
            <button onClick={copyCode} className="p-2.5 rounded-lg bg-[var(--color-purple)] text-white">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-panel-light)] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound size={16} color="#fff" />
          <h2 className="text-sm font-bold text-white">Parent passcode</h2>
        </div>
        <p className="text-xs text-[var(--color-slate)] mb-4">
          Kids will need this passcode to switch back from kid view to the parent dashboard.
        </p>
        <form onSubmit={savePasscode} className="flex flex-col gap-3">
          <input
            type="password"
            inputMode="numeric"
            placeholder="New passcode (4-6 digits)"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full rounded-lg border-0 bg-white/10 text-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-purple)] placeholder:text-white/30"
          />
          <input
            type="password"
            inputMode="numeric"
            placeholder="Confirm passcode"
            value={confirmPasscode}
            onChange={(e) => setConfirmPasscode(e.target.value)}
            className="w-full rounded-lg border-0 bg-white/10 text-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-purple)] placeholder:text-white/30"
          />
          {error && <p className="text-[var(--color-coral)] text-xs font-semibold">{error}</p>}
          {status && <p className="text-[var(--color-meadow)] text-xs font-semibold">{status}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--color-purple)] text-white font-bold py-2.5 text-sm disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save passcode"}
          </button>
        </form>
      </div>
    </div>
  );
}
