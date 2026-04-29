type SummaryCardProps = {
  label: string;
  value: number;
  accent?: "blue" | "amber" | "indigo" | "emerald";
};

const accentMap: Record<NonNullable<SummaryCardProps["accent"]>, string> = {
  blue: "from-blue-500 to-cyan-500",
  amber: "from-amber-500 to-orange-500",
  indigo: "from-indigo-500 to-violet-500",
  emerald: "from-emerald-500 to-teal-500",
};

export function SummaryCard({ label, value, accent = "blue" }: SummaryCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${accentMap[accent]}`} />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
