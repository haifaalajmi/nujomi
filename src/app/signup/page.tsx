"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { insertPendingKids, MAX_SIGNUP_KIDS, type PendingKid } from "@/lib/pending-kids";

const emptyKid: PendingKid = { name: "", age: 6, gender: "boy" };

export default function SignupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [kids, setKids] = useState<PendingKid[]>([{ ...emptyKid }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const updateKid = (index: number, patch: Partial<PendingKid>) => {
    setKids((k) => k.map((kid, i) => (i === index ? { ...kid, ...patch } : kid)));
  };
  const addKidRow = () => setKids((k) => (k.length < MAX_SIGNUP_KIDS ? [...k, { ...emptyKid }] : k));
  const removeKidRow = (index: number) => setKids((k) => k.filter((_, i) => i !== index));

  const goToKidsStep = (e: FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const createAccount = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          mode,
          family_name: mode === "create" ? familyName : undefined,
          invite_code: mode === "join" ? inviteCode : undefined,
          pending_kids: mode === "create" ? kids : undefined,
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      const rpc =
        mode === "join"
          ? supabase.rpc("join_family_with_code", {
              p_invite_code: inviteCode,
              p_full_name: fullName,
            })
          : supabase.rpc("create_family_and_join", {
              p_family_name: familyName || "Our Family",
              p_full_name: fullName,
            });

      const { data: familyId, error: rpcError } = await rpc;
      if (rpcError) {
        setLoading(false);
        setError(rpcError.message);
        return;
      }
      if (mode === "create" && familyId) {
        await insertPendingKids(supabase, familyId, kids);
      }
      setLoading(false);
      router.push("/parent");
      router.refresh();
      return;
    }

    setLoading(false);
    setCheckEmail(true);
  };

  if (checkEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-sm bg-[var(--color-panel)] rounded-3xl p-8 shadow-xl text-center">
          <Sparkles size={32} color="#fff" className="mx-auto mb-4" />
          <h1 className="text-white text-xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Check your email
          </h1>
          <p className="text-[var(--color-slate)] text-sm">
            We sent a confirmation link to <span className="text-white">{email}</span>. Click it to finish
            setting up your family.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-sm bg-[var(--color-panel)] rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-purple)] flex items-center justify-center">
            <Sparkles size={18} color="#fff" />
          </div>
          <span className="text-white text-xl" style={{ fontFamily: "var(--font-display)" }}>
            Nujomi
          </span>
        </div>

        {step === 1 && (
          <>
            <div className="flex gap-1 mb-6 bg-white/10 p-1 rounded-xl w-fit">
              {(["create", "join"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                    mode === m ? "bg-white text-[var(--color-ink)]" : "text-[var(--color-slate)]"
                  }`}
                >
                  {m === "create" ? "New family" : "Join family"}
                </button>
              ))}
            </div>

            <form onSubmit={mode === "create" ? goToKidsStep : createAccount} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-slate)]">Your name</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl border-0 bg-white/10 text-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-purple)] placeholder:text-white/30"
                  placeholder="Jamie Parker"
                />
              </div>

              {mode === "create" ? (
                <div>
                  <label className="text-xs font-bold text-[var(--color-slate)]">Family name</label>
                  <input
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="mt-1 w-full rounded-xl border-0 bg-white/10 text-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-purple)] placeholder:text-white/30"
                    placeholder="The Parkers"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-[var(--color-slate)]">Family invite code</label>
                  <input
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border-0 bg-white/10 text-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-purple)] placeholder:text-white/30"
                    placeholder="Ask the other parent for this"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[var(--color-slate)]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border-0 bg-white/10 text-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-purple)] placeholder:text-white/30"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-slate)]">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border-0 bg-white/10 text-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-purple)] placeholder:text-white/30"
                  placeholder="At least 6 characters"
                />
              </div>

              {error && <p className="text-[var(--color-coral)] text-xs font-semibold">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-[var(--color-purple)] text-white font-bold py-3 text-sm disabled:opacity-60"
              >
                {loading ? "Creating account…" : mode === "create" ? "Next: add your kids" : "Join family"}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <form onSubmit={createAccount} className="flex flex-col gap-4">
            <div>
              <h2 className="text-white text-lg" style={{ fontFamily: "var(--font-display)" }}>
                Add your kids
              </h2>
              <p className="text-[var(--color-slate)] text-xs mt-1">
                The free plan includes up to {MAX_SIGNUP_KIDS} kids. You can edit these anytime.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {kids.map((kid, i) => (
                <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={kid.name}
                      onChange={(e) => updateKid(i, { name: e.target.value })}
                      placeholder={`Kid ${i + 1} name`}
                      className="flex-1 rounded-lg border-0 bg-white/10 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-purple)] placeholder:text-white/30"
                    />
                    {kids.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeKidRow(i)}
                        className="text-[var(--color-slate)] hover:text-white p-1.5"
                        aria-label="Remove kid"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex gap-1 bg-white/10 p-1 rounded-lg">
                      {(["boy", "girl"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => updateKid(i, { gender: g })}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize ${
                            kid.gender === g ? "bg-white text-[var(--color-ink)]" : "text-[var(--color-slate)]"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={18}
                      value={kid.age}
                      onChange={(e) => updateKid(i, { age: Number(e.target.value) })}
                      className="w-20 rounded-lg border-0 bg-white/10 text-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-purple)]"
                    />
                    <span className="text-xs text-[var(--color-slate)] self-center">years old</span>
                  </div>
                </div>
              ))}
            </div>

            {kids.length < MAX_SIGNUP_KIDS && (
              <button
                type="button"
                onClick={addKidRow}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/25 text-[var(--color-slate)] text-xs font-bold py-2.5"
              >
                <Plus size={14} /> Add another kid
              </button>
            )}

            {error && <p className="text-[var(--color-coral)] text-xs font-semibold">{error}</p>}

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl bg-white/10 text-white font-bold py-3 text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] rounded-xl bg-[var(--color-purple)] text-white font-bold py-3 text-sm disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Create family"}
              </button>
            </div>
          </form>
        )}

        <p className="text-[var(--color-slate)] text-xs mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-white font-bold underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
