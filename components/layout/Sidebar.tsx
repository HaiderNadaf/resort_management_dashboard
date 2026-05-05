"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bars3Icon,
  ChartBarSquareIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  TicketIcon,
  UserCircleIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type SidebarProps = {
  open: boolean;
  onToggle: () => void;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: ChartBarSquareIcon },
  { href: "/tickets", label: "All Tickets", icon: TicketIcon },
  { href: "/room-inspections", label: "Room Inspections", icon: ClipboardDocumentCheckIcon },
  { href: "/attendance", label: "Attendance", icon: MapPinIcon },
  { href: "/completed-tickets", label: "Completed Tickets", icon: CheckBadgeIcon },
  { href: "/users", label: "Users", icon: UsersIcon },
  { href: "/profile", label: "Profile", icon: UserCircleIcon },
];

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <>
      <button
        className="fixed left-4 top-4 z-40 rounded-md bg-white p-2 shadow md:hidden"
        onClick={onToggle}
        aria-label="Toggle sidebar"
      >
        {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800 bg-slate-900 text-white transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mt-8 border-b border-slate-800 bg-slate-950 px-4 pb-3 pt-3 md:mt-0">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/20">
              {logoFailed ? (
                <span className="text-sm font-semibold text-blue-300">TS</span>
              ) : (
                <Image
                  src="/logo.png"
                  alt="App logo"
                  width={28}
                  height={28}
                  className="object-contain"
                  onError={() => setLogoFailed(true)}
                />
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Gold Coins</p>
              <h2 className="text-base font-semibold text-white">Club and resort</h2>
            </div>
          </div>
        </div>
       
        <nav className="flex-1 space-y-2 overflow-y-auto px-1 pb-4 mt-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => open && onToggle()}
                className={`flex min-h-11 items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "border border-slate-700/80 bg-slate-800 font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${active ? "text-blue-400" : "text-slate-400"}`} />
                  {item.label}
                </span>
                <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-blue-500" : "bg-transparent"}`} />
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
