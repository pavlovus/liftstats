import type { ArchetypeResponse } from "../../types/api";

interface ArchetypeRatioBarProps {
  archetype: ArchetypeResponse;
}

export function ArchetypeRatioBar({ archetype }: ArchetypeRatioBarProps) {
  const { label, user_shares, cluster_shares } = archetype;

  // Backend returns percentages (0-100), ensure values are normalized to 0-100
  const [uSquat, uBench, uDeadlift] = user_shares.map((s) => (s <= 1 ? s * 100 : s));
  const [cSquat, cBench, cDeadlift] = cluster_shares.map((s) => (s <= 1 ? s * 100 : s));

  // Clean description based on label
  const getArchetypeDescription = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("deadlift")) {
      return "Your deadlift represents an outsized portion of your total. Common among lifters with favorable arm length, hip mobility, and posterior chain recruitment.";
    }
    if (lower.includes("bench")) {
      return "Your bench press makes up a higher proportion of your total than typical tri-event lifters. Typical of lifters with shorter arm levers, thick upper-body mass, and high pressing efficiency.";
    }
    if (lower.includes("squat")) {
      return "Your squat is your primary driver. Typical for lifters with shorter femurs, upright torso mechanics, and exceptional quad power.";
    }
    return "Your squat, bench, and deadlift match the gold-standard balanced tri-event distribution. Your leverages are evenly distributed without extreme mechanical specialization.";
  };

  return (
    <div className="flex flex-col gap-5 bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] rounded-xl p-5 animate-enter">
      {/* Archetype Badge & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-steel-border)] animate-enter delay-50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--color-plate-amber)]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)]">
              Biomechanical Strength Archetype
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase break-words text-balance">
            {label}
          </h3>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-[var(--color-steel-border-light)] bg-[var(--color-iron-800)] font-mono text-xs text-[var(--color-chalk-muted)] self-start sm:self-auto">
          3-Lift Kinetic Ratio
        </div>
      </div>

      <p className="text-sm text-[var(--color-chalk-muted)] leading-relaxed animate-enter delay-100">
        {getArchetypeDescription(label)}
      </p>

      {/* Kinetic Bars */}
      <div className="flex flex-col gap-6 pt-2">
        {/* User's Current Ratio */}
        <div className="flex flex-col gap-2 animate-enter delay-150">
          <div className="flex justify-between items-baseline font-mono text-xs">
            <span className="text-white font-semibold uppercase tracking-wider">Your Lift Shares</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-[var(--color-plate-red)]">SQ: {uSquat.toFixed(1)}%</span>
              <span className="text-[var(--color-plate-blue)]">BP: {uBench.toFixed(1)}%</span>
              <span className="text-[var(--color-plate-amber)]">DL: {uDeadlift.toFixed(1)}%</span>
            </div>
          </div>

          {/* Segmented Stacked Bar */}
          <div className="w-full h-8 rounded-lg overflow-hidden flex bg-[var(--color-iron-800)] p-0.5 border border-[var(--color-steel-border)]">
            <div
              style={{ width: `${uSquat}%` }}
              className="h-full bg-[var(--color-plate-red)] flex items-center justify-center text-[10px] font-mono font-bold text-white transition-all duration-500 rounded-l"
              title={`Squat: ${uSquat.toFixed(1)}%`}
            >
              {uSquat > 12 && `${uSquat.toFixed(0)}%`}
            </div>
            <div
              style={{ width: `${uBench}%` }}
              className="h-full bg-[var(--color-plate-blue)] flex items-center justify-center text-[10px] font-mono font-bold text-white transition-all duration-500"
              title={`Bench: ${uBench.toFixed(1)}%`}
            >
              {uBench > 12 && `${uBench.toFixed(0)}%`}
            </div>
            <div
              style={{ width: `${uDeadlift}%` }}
              className="h-full bg-[var(--color-plate-amber)] flex items-center justify-center text-[10px] font-mono font-bold text-black transition-all duration-500 rounded-r"
              title={`Deadlift: ${uDeadlift.toFixed(1)}%`}
            >
              {uDeadlift > 12 && `${uDeadlift.toFixed(0)}%`}
            </div>
          </div>
        </div>

        {/* Typical Archetype Centroid Ratio */}
        <div className="flex flex-col gap-2 animate-enter delay-200">
          <div className="flex justify-between items-baseline font-mono text-xs">
            <span className="text-[var(--color-chalk-muted)] uppercase tracking-wider">
              {label} Baseline Profile
            </span>
            <div className="flex items-center gap-3 text-[11px] text-[var(--color-chalk-dim)]">
              <span>SQ: {cSquat.toFixed(1)}%</span>
              <span>BP: {cBench.toFixed(1)}%</span>
              <span>DL: {cDeadlift.toFixed(1)}%</span>
            </div>
          </div>

          <div className="w-full h-5 rounded-md overflow-hidden flex bg-[var(--color-iron-800)] opacity-70 p-0.5 border border-[var(--color-steel-border)]">
            <div
              style={{ width: `${cSquat}%` }}
              className="h-full bg-[var(--color-plate-red)] rounded-l transition-all duration-500"
            />
            <div
              style={{ width: `${cBench}%` }}
              className="h-full bg-[var(--color-plate-blue)] transition-all duration-500"
            />
            <div
              style={{ width: `${cDeadlift}%` }}
              className="h-full bg-[var(--color-plate-amber)] rounded-r transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Legend / Info Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-steel-border)] font-mono text-xs text-[var(--color-chalk-muted)] animate-enter delay-250">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-plate-red)]" />
            <span>Squat (25kg Red)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-plate-blue)]" />
            <span>Bench (20kg Blue)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-plate-amber)]" />
            <span>Deadlift (15kg Gold)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
