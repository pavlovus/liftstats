import { useId } from "react";
import { SlidersHorizontal, CheckCircle2 } from "lucide-react";
import type { ArchetypeResponse } from "../../types/api";

interface ArchetypeComparisonTableProps {
  archetype: ArchetypeResponse;
}

const ARCHETYPE_TRAITS: Record<string, string> = {
  "Deadlift-dominant": "Favorable pull leverages & strong posterior chain recruitment",
  "Squat-dominant": "Quad power & upright torso mechanics (typically shorter femurs)",
  "Bench-specialist": "Upper-body pressing efficiency & shorter arm reach",
};

export function ArchetypeComparisonTable({ archetype }: ArchetypeComparisonTableProps) {
  const uniqueId = useId();
  const { label, user_shares, all_clusters } = archetype;

  // Normalize shares to 0-100 range
  const toPct = (val: number) => (val <= 1 ? val * 100 : val);
  const [uSquat, uBench, uDeadlift] = user_shares.map(toPct);

  // Fallback if all_clusters is empty
  const clusters = Object.entries(all_clusters || {});

  const calcDelta = (userVal: number, clusterVal: number) => {
    const diff = userVal - clusterVal;
    if (Math.abs(diff) < 0.2) {
      return { text: "Equal", sign: "", isZero: true, isPos: false };
    }
    const isPos = diff > 0;
    return {
      text: `${isPos ? "+" : ""}${diff.toFixed(1)}%`,
      sign: isPos ? "+" : "",
      isZero: false,
      isPos,
    };
  };

  return (
    <div className="p-5 sm:p-6 bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] rounded-2xl flex flex-col gap-5 shadow-lg animate-enter delay-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-steel-border)] animate-enter delay-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal className="w-4 h-4 text-[var(--color-plate-amber)]" />
            <h3 className="font-mono text-xs uppercase tracking-wider text-white font-bold">
              Cohort Archetype Spectrum
            </h3>
          </div>
          <p className="text-xs text-[var(--color-chalk-muted)] leading-relaxed">
            How your proportions compare against all three empirical training archetypes in your peer cohort.
          </p>
        </div>

        <div className="px-3 py-1 rounded-lg border border-[var(--color-steel-border-light)] bg-[var(--color-iron-800)] font-mono text-[11px] text-[var(--color-chalk-muted)] shrink-0 self-start sm:self-auto">
          k=3 Empirical Centroids
        </div>
      </div>

      {/* Desktop & Tablet Comparative Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-[var(--color-steel-border)] bg-[var(--color-iron-850)] animate-enter delay-250">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-[var(--color-steel-border)] bg-[var(--color-iron-800)]/60 text-[var(--color-chalk-dim)] text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Archetype Profile</th>
              <th className="py-3 px-4 font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-[var(--color-plate-red)]" />
                  <span>Squat</span>
                </div>
              </th>
              <th className="py-3 px-4 font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-[var(--color-plate-blue)]" />
                  <span>Bench</span>
                </div>
              </th>
              <th className="py-3 px-4 font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-[var(--color-plate-amber)]" />
                  <span>Deadlift</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-steel-border)]">
            {/* Pinned User Baseline Row */}
            <tr className="bg-white/[0.03] border-b-2 border-[var(--color-steel-border)] animate-enter delay-300">
              <td className="py-3.5 px-4 font-bold text-white">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                  <span>Your Current Lifts</span>
                </div>
                <span className="text-[10px] text-[var(--color-chalk-dim)] font-sans block mt-0.5">
                  Personal 3-lift distribution
                </span>
              </td>
              <td className="py-3.5 px-4">
                <span className="font-extrabold text-[var(--color-plate-red)] text-sm tabular-nums">
                  {uSquat.toFixed(1)}%
                </span>
              </td>
              <td className="py-3.5 px-4">
                <span className="font-extrabold text-[var(--color-plate-blue)] text-sm tabular-nums">
                  {uBench.toFixed(1)}%
                </span>
              </td>
              <td className="py-3.5 px-4">
                <span className="font-extrabold text-[var(--color-plate-amber)] text-sm tabular-nums">
                  {uDeadlift.toFixed(1)}%
                </span>
              </td>
            </tr>

            {/* Empirical Cluster Rows */}
            {clusters.map(([clusterName, rawShares], idx) => {
              const [cSquat, cBench, cDeadlift] = rawShares.map(toPct);
              const isMatched = clusterName.toLowerCase() === label.toLowerCase();

              const dSq = calcDelta(uSquat, cSquat);
              const dBp = calcDelta(uBench, cBench);
              const dDl = calcDelta(uDeadlift, cDeadlift);

              const rowDelays = ["delay-300", "delay-350", "delay-400"];
              const delayClass = rowDelays[idx % rowDelays.length];

              return (
                <tr
                  key={`${clusterName}-${uniqueId}`}
                  className={`animate-enter ${delayClass} transition-colors hover:bg-[var(--color-iron-800)]/40 ${
                    isMatched ? "bg-[var(--color-plate-amber)]/[0.04]" : ""
                  }`}
                >
                  {/* Archetype label and mechanical notes */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{clusterName}</span>
                      {isMatched && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Matched
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--color-chalk-dim)] font-sans block mt-0.5">
                      {ARCHETYPE_TRAITS[clusterName] || "Balanced national strength profile"}
                    </span>
                  </td>

                  {/* Squat proportion & delta */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium tabular-nums">{cSquat.toFixed(1)}%</span>
                      <span
                        className={`text-[10px] tabular-nums ${
                          dSq.isZero
                            ? "text-[var(--color-chalk-dim)]"
                            : dSq.isPos
                            ? "text-emerald-400"
                            : "text-[var(--color-chalk-muted)]"
                        }`}
                      >
                        {dSq.isZero ? "On par" : `${dSq.text} vs you`}
                      </span>
                    </div>
                  </td>

                  {/* Bench proportion & delta */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium tabular-nums">{cBench.toFixed(1)}%</span>
                      <span
                        className={`text-[10px] tabular-nums ${
                          dBp.isZero
                            ? "text-[var(--color-chalk-dim)]"
                            : dBp.isPos
                            ? "text-emerald-400"
                            : "text-[var(--color-chalk-muted)]"
                        }`}
                      >
                        {dBp.isZero ? "On par" : `${dBp.text} vs you`}
                      </span>
                    </div>
                  </td>

                  {/* Deadlift proportion & delta */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium tabular-nums">{cDeadlift.toFixed(1)}%</span>
                      <span
                        className={`text-[10px] tabular-nums ${
                          dDl.isZero
                            ? "text-[var(--color-chalk-dim)]"
                            : dDl.isPos
                            ? "text-emerald-400"
                            : "text-[var(--color-chalk-muted)]"
                        }`}
                      >
                        {dDl.isZero ? "On par" : `${dDl.text} vs you`}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile-Native Stacked Cards (< md) */}
      <div className="md:hidden flex flex-col gap-3">
        {clusters.map(([clusterName, rawShares], idx) => {
          const [cSquat, cBench, cDeadlift] = rawShares.map(toPct);
          const isMatched = clusterName.toLowerCase() === label.toLowerCase();

          const dSq = calcDelta(uSquat, cSquat);
          const dBp = calcDelta(uBench, cBench);
          const dDl = calcDelta(uDeadlift, cDeadlift);

          const cardDelays = ["delay-250", "delay-300", "delay-350"];
          const delayClass = cardDelays[idx % cardDelays.length];

          return (
            <div
              key={`mob-${clusterName}-${uniqueId}`}
              className={`p-4 rounded-xl border flex flex-col gap-3 animate-enter ${delayClass} ${
                isMatched
                  ? "bg-[var(--color-iron-850)] border-[var(--color-plate-amber)]/40 shadow-sm"
                  : "bg-[var(--color-iron-850)]/70 border-[var(--color-steel-border)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-white uppercase">
                  {clusterName}
                </span>
                {isMatched && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Matched
                  </span>
                )}
              </div>

              <p className="text-[11px] text-[var(--color-chalk-muted)] leading-relaxed">
                {ARCHETYPE_TRAITS[clusterName] || "Balanced national strength profile"}
              </p>

              {/* 3 Metric Comparison Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
                <div className="p-2 rounded bg-[var(--color-iron-800)]/60 border border-[var(--color-steel-border)] flex flex-col items-center">
                  <span className="text-[10px] text-[var(--color-plate-red)] uppercase font-semibold">
                    Squat
                  </span>
                  <span className="font-bold text-white mt-0.5 tabular-nums">{cSquat.toFixed(1)}%</span>
                  <span
                    className={`text-[9px] mt-0.5 tabular-nums ${
                      dSq.isZero ? "text-[var(--color-chalk-dim)]" : dSq.isPos ? "text-emerald-400" : "text-[var(--color-chalk-muted)]"
                    }`}
                  >
                    {dSq.isZero ? "Equal" : `${dSq.text}`}
                  </span>
                </div>

                <div className="p-2 rounded bg-[var(--color-iron-800)]/60 border border-[var(--color-steel-border)] flex flex-col items-center">
                  <span className="text-[10px] text-[var(--color-plate-blue)] uppercase font-semibold">
                    Bench
                  </span>
                  <span className="font-bold text-white mt-0.5 tabular-nums">{cBench.toFixed(1)}%</span>
                  <span
                    className={`text-[9px] mt-0.5 tabular-nums ${
                      dBp.isZero ? "text-[var(--color-chalk-dim)]" : dBp.isPos ? "text-emerald-400" : "text-[var(--color-chalk-muted)]"
                    }`}
                  >
                    {dBp.isZero ? "Equal" : `${dBp.text}`}
                  </span>
                </div>

                <div className="p-2 rounded bg-[var(--color-iron-800)]/60 border border-[var(--color-steel-border)] flex flex-col items-center">
                  <span className="text-[10px] text-[var(--color-plate-amber)] uppercase font-semibold">
                    Deadlift
                  </span>
                  <span className="font-bold text-white mt-0.5 tabular-nums">{cDeadlift.toFixed(1)}%</span>
                  <span
                    className={`text-[9px] mt-0.5 tabular-nums ${
                      dDl.isZero ? "text-[var(--color-chalk-dim)]" : dDl.isPos ? "text-emerald-400" : "text-[var(--color-chalk-muted)]"
                    }`}
                  >
                    {dDl.isZero ? "Equal" : `${dDl.text}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explainer Note */}
      <p className="text-[11px] text-[var(--color-chalk-dim)] font-mono italic leading-relaxed pt-1 border-t border-[var(--color-steel-border)] animate-enter delay-350">
        Delta values indicate how your lift proportions diverge from each archetype centroid. Positive values mean you allocate more of your 3-lift total to that discipline than the archetype norm.
      </p>
    </div>
  );
}
