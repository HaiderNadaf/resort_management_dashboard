"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error, user } = useDashboardStore();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user?.role === "admin" && user.isMainAdmin) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await login(phone, password);
    if (ok) router.push("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-indigo-600/10 ring-1 ring-indigo-200">
            <Image
              src="/logo.png"
              alt="Ticket System logo"
              width={44}
              height={44}
              className="object-contain"
              onError={(event) => {
                event.currentTarget.src = "/next.svg";
              }}
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Resort</p>
            <p className="text-2xl font-semibold leading-tight text-slate-900">Gold Coins</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">Admin Sign In</h1>
        <p className="mt-1 text-sm text-slate-500">Only main admin can access this dashboard.</p>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <input
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-11 w-full rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        {error ? <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      </div>
    </main>
  );
}
