"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Trash2, X, Sparkles, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFamilyData } from "../family-data-context";
import { Avatar } from "@/components/Avatar";
import { AVATARS } from "@/lib/theme";
import { isPhotoUrl, uploadAvatarPhoto } from "@/lib/avatar-upload";

const emptyForm = { name: "", age: 6, avatar: "boy-1" as string };

export default function KidsPage() {
  return (
    <Suspense fallback={<div className="text-[var(--color-slate)] text-sm">Loading…</div>}>
      <KidsPageContent />
    </Suspense>
  );
}

function KidsPageContent() {
  const { profile, family, kids, loading } = useFamilyData();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgradeResult = searchParams.get("upgrade");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingKidId, setPendingKidId] = useState<string>("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) return <div className="text-[var(--color-slate)] text-sm">Loading…</div>;

  const kidLimit = family?.kid_limit ?? 3;
  const atLimit = kids.length >= kidLimit && !editingId;
  const activeKidId = editingId ?? pendingKidId;

  const startUpgrade = async () => {
    setStartingCheckout(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Couldn't start checkout");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start checkout");
      setStartingCheckout(false);
    }
  };

  const openNew = () => {
    if (atLimit) return;
    setEditingId(null);
    setPendingKidId(crypto.randomUUID());
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (kid: (typeof kids)[number]) => {
    setEditingId(kid.id);
    setForm({ name: kid.name, age: kid.age ?? 6, avatar: kid.avatar });
    setError(null);
    setShowForm(true);
  };

  const onUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile?.family_id) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAvatarPhoto(supabase, profile.family_id, activeKidId, file);
      setForm((f) => ({ ...f, avatar: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim() || !profile?.family_id) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("kids")
          .update({ name: form.name, age: form.age, avatar: form.avatar })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("kids")
          .insert({ id: pendingKidId, family_id: profile.family_id, name: form.name, age: form.age, avatar: form.avatar });
        if (error) throw error;
      }
      setShowForm(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message.includes("kid_limit_reached") ? "You've reached your free plan's kid limit." : message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await supabase.from("kids").delete().eq("id", id);
  };

  return (
    <div>
      <h1 className="text-white text-2xl mb-1" style={{ fontFamily: "var(--font-display)" }}>
        Kids
      </h1>
      <p className="text-[var(--color-slate)] text-sm mb-5">
        {family?.plan === "paid" ? "Unlimited kid profiles (paid plan)." : `${kids.length} of ${kidLimit} free kid profiles used.`}
      </p>

      {upgradeResult === "success" && (
        <div className="mb-4 rounded-2xl border border-[var(--color-meadow)]/40 bg-white/5 p-4 flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-white">Payment received — your plan is upgraded! 🎉</div>
          <button onClick={() => router.replace("/parent/kids")} className="text-[var(--color-slate)]">
            <X size={16} />
          </button>
        </div>
      )}
      {upgradeResult === "error" && (
        <div className="mb-4 rounded-2xl border border-[var(--color-coral)]/40 bg-white/5 p-4 flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-white">Payment didn&apos;t go through. No charge was made — try again anytime.</div>
          <button onClick={() => router.replace("/parent/kids")} className="text-[var(--color-slate)]">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex justify-end mb-3">
        <button
          onClick={openNew}
          disabled={atLimit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-purple)] text-white text-xs font-bold disabled:opacity-40"
        >
          <Plus size={14} /> Add child
        </button>
      </div>

      {atLimit && (
        <div className="mb-4 rounded-2xl border border-[var(--color-sun)]/40 bg-white/5 p-4 flex items-center gap-3">
          <Sparkles size={20} color="var(--color-sun)" />
          <div className="flex-1">
            <div className="text-sm font-bold text-white">You&apos;ve reached your free plan limit</div>
            <div className="text-xs text-[var(--color-slate)]">Upgrade for 3 KWD to add unlimited kids.</div>
          </div>
          <button
            onClick={startUpgrade}
            disabled={startingCheckout}
            className="text-xs font-bold text-[var(--color-ink)] bg-[var(--color-sun)] px-3 py-2 rounded-lg disabled:opacity-60"
          >
            {startingCheckout ? "Redirecting…" : "Upgrade"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {kids.map((kid) => (
          <div key={kid.id} className="bg-[var(--color-panel-light)] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <Avatar name={kid.name} avatar={kid.avatar} size={44} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white truncate">{kid.name}</div>
              <div className="text-xs text-[var(--color-slate)]">{kid.age} yrs &middot; {kid.points} stars</div>
            </div>
            <button onClick={() => openEdit(kid)} className="text-[var(--color-slate)] hover:text-white p-1.5">
              <Pencil size={15} />
            </button>
            <button onClick={() => remove(kid.id)} className="text-[var(--color-coral)] p-1.5">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {kids.length === 0 && <div className="col-span-full text-center py-10 text-[var(--color-slate)] text-sm">No kids yet.</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
                {editingId ? "Edit child" : "Add child"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            <label className="text-xs font-bold text-slate-400">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mia"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 mb-3 text-sm"
            />

            <label className="text-xs font-bold text-slate-400">Age</label>
            <input
              type="number"
              min={1}
              max={18}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 mb-3 text-sm"
            />

            <label className="text-xs font-bold text-slate-400">Avatar</label>
            <div className="flex gap-2 mt-1.5 mb-2 flex-wrap">
              {AVATARS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setForm({ ...form, avatar: a.key })}
                  className="rounded-xl p-1 border"
                  style={{ borderColor: form.avatar === a.key ? "var(--color-purple)" : "#E6E1F2", borderWidth: form.avatar === a.key ? 2 : 1 }}
                >
                  <Avatar name={form.name || a.key} avatar={a.key} size={36} />
                </button>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-xl p-1 border flex items-center justify-center disabled:opacity-60"
                style={{
                  width: 44,
                  height: 44,
                  borderColor: isPhotoUrl(form.avatar) ? "var(--color-purple)" : "#E6E1F2",
                  borderWidth: isPhotoUrl(form.avatar) ? 2 : 1,
                }}
                title="Upload a photo"
              >
                {isPhotoUrl(form.avatar) ? (
                  <Avatar name={form.name || "kid"} avatar={form.avatar} size={36} />
                ) : (
                  <Upload size={16} color="var(--color-ink)" />
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUploadPhoto} />
            </div>
            {uploading && <p className="text-slate-400 text-xs mb-3">Uploading photo…</p>}

            {error && <p className="text-red-500 text-xs font-semibold mb-3 mt-2">{error}</p>}

            <button
              onClick={save}
              disabled={saving || uploading}
              className="w-full py-3 mt-3 rounded-xl bg-[var(--color-purple)] text-white font-bold text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add child"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
