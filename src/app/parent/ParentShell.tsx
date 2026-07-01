"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, ListChecks, Sparkles, Trophy, Users, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFamilyData } from "./family-data-context";
import { KID_MODE_KEY } from "@/lib/kid-mode";

const NAV = [
  { href: "/parent", label: "Tasks & Rewards", icon: ListChecks },
  { href: "/parent/kids", label: "Kids", icon: Users },
  { href: "/parent/achievements", label: "Achievements", icon: Trophy },
  { href: "/parent/settings", label: "Settings", icon: Settings },
];

export function ParentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { family } = useFamilyData();

  const goToKidView = () => {
    sessionStorage.setItem(KID_MODE_KEY, "1");
    router.push("/kid");
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 md:p-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 md:gap-0 md:min-h-[720px] bg-[var(--color-panel)] rounded-3xl overflow-hidden">
        <div className="w-full md:w-56 bg-[var(--color-panel-light)] border-b md:border-b-0 md:border-r border-white/10 p-5 flex md:flex-col gap-1">
          <div className="hidden md:flex items-center gap-2 mb-6 pl-1">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-purple)] flex items-center justify-center">
              <Sparkles size={16} color="#fff" />
            </div>
            <span className="text-white text-lg" style={{ fontFamily: "var(--font-display)" }}>
              Nujomi
            </span>
          </div>

          <div className="flex md:flex-col gap-1 flex-1 overflow-x-auto">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                    active ? "bg-white/15 text-white" : "text-[var(--color-slate)] hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex flex-col gap-2 mt-auto pt-4">
            <button
              onClick={goToKidView}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-purple)] text-white font-bold text-[13px] py-2.5"
            >
              Kid view <ChevronRight size={14} />
            </button>
            <button
              onClick={signOut}
              className="flex items-center justify-center gap-2 rounded-xl text-[var(--color-slate)] hover:text-white text-[13px] py-2"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 md:p-8 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[var(--color-slate)] text-xs font-semibold">{family?.name ?? "Your family"}</p>
            <div className="flex md:hidden gap-2">
              <button onClick={goToKidView} className="text-xs font-bold text-white bg-[var(--color-purple)] px-3 py-1.5 rounded-lg">
                Kid view
              </button>
              <button onClick={signOut} className="text-xs font-bold text-[var(--color-slate)] px-2 py-1.5">
                Sign out
              </button>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
