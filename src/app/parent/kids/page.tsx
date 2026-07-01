"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFamilyData } from "../family-data-context";
import { Avatar } from "@/components/Avatar";
import { AVATARS } from "@/lib/theme";

const emptyForm = { name: "", age: 6, avatar: "boy-1" as string };

export default function KidsPage() {
  const { profile, family, kids, loading } = useFamilyData();
  const supabase = useMemo(() => createClient(), []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div className="text-[var(--color-slate)] text-sm">Loading…</div>;

  const kidLimit = family?.kid_limit ?? 3;
  const atLimit = kids.length >= kidLimit && !editingId;

  const openNew = () => {
    if (atLimit) return;
    setEditingId(null);
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
          .insert({ family_id: profile.family_id, name: form.name, age: form.age, avatar: form.avatar });
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
        {kids.length} of {kidLimit} free kid profiles used.
      </p>

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
            <div className="text-xs text-[var(--color-slate)]">Upgrade to add more than {kidLimit} kids.</div>
          </div>
          <button className="text-xs font-bold text-[var(--color-ink)] bg-[var(--color-sun)] px-3 py-2 rounded-lg">Upgrade</button>
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
            <div className="flex gap-2 mt-1.5 mb-5 flex-wrap">
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
            </div>

            {error && <p className="text-red-500 text-xs font-semibold mb-3">{error}</p>}

            <button
              onClick={save}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[var(--color-purple)] text-white font-bold text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add child"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
