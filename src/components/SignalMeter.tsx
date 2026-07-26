function qualityFor(signalPercent: number): { label: string; color: string } {
  if (signalPercent >= 70) return { label: "Excellent", color: "bg-green-600" };
  if (signalPercent >= 40) return { label: "Fair", color: "bg-amber-500" };
  return { label: "Poor", color: "bg-red-600" };
}

export default function SignalMeter({
  signalPercent,
  rssiDbm,
}: {
  signalPercent: number;
  rssiDbm?: number | null;
}) {
  const { label, color } = qualityFor(signalPercent);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-slate-600">
          {signalPercent}%{rssiDbm != null ? ` · ${rssiDbm} dBm` : ""}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full ${color} transition-[width] duration-300`}
          style={{ width: `${Math.max(2, Math.min(100, signalPercent))}%` }}
        />
      </div>
    </div>
  );
}
