"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/parent");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm bg-[var(--color-panel)] rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-purple)] flex items-center justify-center">
            <Sparkles size={18} color="#fff" />
          </div>
          <span className="text-white text-xl" style={{ fontFamily: "var(--font-display)" }}>
            Nujomi
          </span>
        </div>

        <h1 className="text-white text-2xl mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Welcome back
        </h1>
        <p className="text-[var(--color-slate)] text-sm mb-6">Sign in to your family dashboard.</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border-0 bg-white/10 text-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-purple)] placeholder:text-white/30"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-[var(--color-coral)] text-xs font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[var(--color-purple)] text-white font-bold py-3 text-sm disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-[var(--color-slate)] text-xs mt-6 text-center">
          New to Nujomi?{" "}
          <Link href="/signup" className="text-white font-bold underline">
            Create a family account
          </Link>
        </p>
      </div>
    </div>
  );
}
