import { useState } from "react";
import type { FullAnalysisResponse } from "../../types/api";
import { TufteHistogram } from "../visual/TufteHistogram";
import { StatValue } from "../visual/StatValue";
import { Trophy, TrendingUp, Award, Activity, ShieldCheck, ShieldAlert, Layers, Scale } from "lucide-react";

interface OverviewTabProps {
  response: FullAnalysisResponse;
}

export function OverviewTab({ response }: OverviewTabProps) {
  const [selectedLift, setSelectedLift] = useState<"total" | "squat" | "bench" | "deadlift">("total");
  const [selectedFormula, setSelectedFormula] = useState<"wilks" | "dots">("dots");

  const { total, percentiles, archetype, progression } = response;
  const currentLiftData = percentiles[selectedLift];
  const totalData = percentiles.total;

  const totalPercentile = totalData?.percentile ?? 50;
  const toggle = archetype?.toggle;
  const formulaData = progression?.views?.[selectedFormula] || { score: 0, percentile: null, n: 0 };

  return (
    <div className="flex flex-col gap-6 view-enter">
      {/* Hero Percentile Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] relative overflow-hidden shadow-lg flex flex-col gap-6 animate-enter">
        {/* Top Header: Benchmark Placement & Demographic Cohort Context */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-md bg-[var(--color-plate-amber)]/20 text-[var(--color-plate-amber)] border border-[var(--color-plate-amber)]/30">
                <Trophy className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)] font-semibold">
                Overall Strength Benchmark
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-6xl font-extrabold font-mono text-white tracking-tight">
                TOP{" "}
                {100 - totalPercentile < 1 ? (
                  <StatValue id="top-rank-stat" value={1} prefix="< " suffix="%" />
                ) : (
                  <StatValue
                    id="top-rank-stat"
                    value={100 - totalPercentile}
                    decimals={100 - totalPercentile < 5 ? 1 : 0}
                    suffix="%"
                  />
                )}
              </span>
            </div>

            <p className="text-sm text-[var(--color-chalk-muted)] mt-2 max-w-2xl leading-relaxed">
              Your 3-lift total of <strong className="text-white">{total.toFixed(1)} kg</strong> places you
              higher than <strong className="text-[var(--color-plate-amber)]">{totalPercentile.toFixed(0)}%</strong>{" "}
              of competitive powerlifters in your demographic cohort.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 font-mono text-xs text-[var(--color-chalk-muted)] shrink-0 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-lg bg-[var(--color-iron-800)] border border-[var(--color-steel-border-light)] text-white font-medium">
              Demographic Cohort
            </div>
            <span className="text-[11px] text-[var(--color-chalk-dim)]">
              {currentLiftData?.population_size
                ? `${currentLiftData.population_size.toLocaleString()} sanctioned lifters`
                : "Sanctioned cohort"}
            </span>
          </div>
        </div>

        {/* Wide Full-Width Milestone Grid: Cohort Median, Max, P75, P90 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-5 border-t border-[var(--color-steel-border)] w-full">
          {/* Cohort Median */}
          <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] hover:border-[var(--color-steel-border-light)] transition-colors flex flex-col justify-between gap-2 animate-enter delay-50">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--color-chalk-muted)] uppercase tracking-wider font-semibold">
                Cohort Median
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white font-bold">
                P50
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                {currentLiftData?.median_lift !== undefined && currentLiftData.median_lift !== null ? (
                  <StatValue value={currentLiftData.median_lift} decimals={1} />
                ) : (
                  "N/A"
                )}
              </span>
              <span className="font-mono text-xs text-[var(--color-chalk-muted)]">kg</span>
            </div>
            <span className="font-mono text-[11px] text-[var(--color-chalk-dim)]">
              {selectedLift.toUpperCase()} Midpoint benchmark
            </span>
          </div>

          {/* Cohort Max */}
          <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] hover:border-[var(--color-steel-border-light)] transition-colors flex flex-col justify-between gap-2 animate-enter delay-100">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--color-chalk-muted)] uppercase tracking-wider font-semibold">
                Cohort Max
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                MAX
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                {currentLiftData?.max_lift !== undefined && currentLiftData.max_lift !== null ? (
                  <StatValue value={currentLiftData.max_lift} decimals={1} />
                ) : (
                  "N/A"
                )}
              </span>
              <span className="font-mono text-xs text-[var(--color-chalk-muted)]">kg</span>
            </div>
            <span className="font-mono text-[11px] text-[var(--color-chalk-dim)]">
              All-time {selectedLift.toUpperCase()} record
            </span>
          </div>

          {/* P75 Threshold */}
          <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] hover:border-[var(--color-steel-border-light)] transition-colors flex flex-col justify-between gap-2 animate-enter delay-150">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--color-chalk-muted)] uppercase tracking-wider font-semibold">
                P75 Threshold
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-400/20 text-blue-300 font-bold border border-blue-400/30">
                P75
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                {currentLiftData?.p75 !== undefined && currentLiftData.p75 !== null ? (
                  <StatValue value={currentLiftData.p75} decimals={1} />
                ) : (
                  "N/A"
                )}
              </span>
              <span className="font-mono text-xs text-[var(--color-chalk-muted)]">kg</span>
            </div>
            <span className="font-mono text-[11px] text-[var(--color-chalk-dim)]">
              Top 25% {selectedLift.toUpperCase()} boundary
            </span>
          </div>

          {/* P90 Elite */}
          <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] hover:border-[var(--color-steel-border-light)] transition-colors flex flex-col justify-between gap-2 animate-enter delay-200">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--color-chalk-muted)] uppercase tracking-wider font-semibold">
                P90 Elite
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                P90
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                {currentLiftData?.p90 !== undefined && currentLiftData.p90 !== null ? (
                  <StatValue value={currentLiftData.p90} decimals={1} />
                ) : (
                  "N/A"
                )}
              </span>
              <span className="font-mono text-xs text-[var(--color-chalk-muted)]">kg</span>
            </div>
            <span className="font-mono text-[11px] text-[var(--color-chalk-dim)]">
              Top 10% national elite
            </span>
          </div>
        </div>
      </div>

      {/* Lift Selector Buttons (Total, Squat, Bench, Deadlift) */}
      <div role="tablist" aria-label="Select lift distribution" className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Total */}
        <button
          type="button"
          role="tab"
          aria-selected={selectedLift === "total"}
          id="lift-btn-total"
          onClick={() => setSelectedLift("total")}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col gap-1 cursor-pointer animate-enter delay-150 ${
            selectedLift === "total"
              ? "bg-[var(--color-iron-850)] border-white shadow-lg"
              : "bg-[var(--color-iron-900)] border-[var(--color-steel-border)] hover:border-[var(--color-steel-muted)] hover:bg-[var(--color-iron-850)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)]">
              Total
            </span>
            <Activity className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          </div>
          <div className="font-mono text-xl font-bold text-white">
            {total.toFixed(1)} <span className="text-xs text-[var(--color-chalk-dim)]">KG</span>
          </div>
          <div className="font-mono text-xs text-[var(--color-plate-amber)] font-semibold">
            {totalData?.percentile?.toFixed(0) ?? "50"}th Percentile
          </div>
        </button>

        {/* Squat */}
        <button
          type="button"
          role="tab"
          aria-selected={selectedLift === "squat"}
          id="lift-btn-squat"
          onClick={() => setSelectedLift("squat")}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col gap-1 cursor-pointer animate-enter delay-200 ${
            selectedLift === "squat"
              ? "bg-[var(--color-iron-850)] border-[var(--color-plate-red)] shadow-lg"
              : "bg-[var(--color-iron-900)] border-[var(--color-steel-border)] hover:border-[var(--color-steel-muted)] hover:bg-[var(--color-iron-850)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-[var(--color-plate-red)]" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)]">
                Squat
              </span>
            </div>
            <Award className="w-3.5 h-3.5 text-[var(--color-plate-red)]" aria-hidden="true" />
          </div>
          <div className="font-mono text-xl font-bold text-white">
            {percentiles.squat?.user_weight?.toFixed(1) ?? "0"}{" "}
            <span className="text-xs text-[var(--color-chalk-dim)]">KG</span>
          </div>
          <div className="font-mono text-xs text-[var(--color-plate-red)] font-semibold">
            {percentiles.squat?.percentile?.toFixed(0) ?? "N/A"}th Percentile
          </div>
        </button>

        {/* Bench */}
        <button
          type="button"
          role="tab"
          aria-selected={selectedLift === "bench"}
          id="lift-btn-bench"
          onClick={() => setSelectedLift("bench")}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col gap-1 cursor-pointer animate-enter delay-250 ${
            selectedLift === "bench"
              ? "bg-[var(--color-iron-850)] border-[var(--color-plate-blue)] shadow-lg"
              : "bg-[var(--color-iron-900)] border-[var(--color-steel-border)] hover:border-[var(--color-steel-muted)] hover:bg-[var(--color-iron-850)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-[var(--color-plate-blue)]" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)]">
                Bench Press
              </span>
            </div>
            <Award className="w-3.5 h-3.5 text-[var(--color-plate-blue)]" aria-hidden="true" />
          </div>
          <div className="font-mono text-xl font-bold text-white">
            {percentiles.bench?.user_weight?.toFixed(1) ?? "0"}{" "}
            <span className="text-xs text-[var(--color-chalk-dim)]">KG</span>
          </div>
          <div className="font-mono text-xs text-[var(--color-plate-blue)] font-semibold">
            {percentiles.bench?.percentile?.toFixed(0) ?? "N/A"}th Percentile
          </div>
        </button>

        {/* Deadlift */}
        <button
          type="button"
          role="tab"
          aria-selected={selectedLift === "deadlift"}
          id="lift-btn-deadlift"
          onClick={() => setSelectedLift("deadlift")}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col gap-1 cursor-pointer animate-enter delay-300 ${
            selectedLift === "deadlift"
              ? "bg-[var(--color-iron-850)] border-[var(--color-plate-amber)] shadow-lg"
              : "bg-[var(--color-iron-900)] border-[var(--color-steel-border)] hover:border-[var(--color-steel-muted)] hover:bg-[var(--color-iron-850)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-[var(--color-plate-amber)]" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)]">
                Deadlift
              </span>
            </div>
            <Award className="w-3.5 h-3.5 text-[var(--color-plate-amber)]" aria-hidden="true" />
          </div>
          <div className="font-mono text-xl font-bold text-white">
            {percentiles.deadlift?.user_weight?.toFixed(1) ?? "0"}{" "}
            <span className="text-xs text-[var(--color-chalk-dim)]">KG</span>
          </div>
          <div className="font-mono text-xs text-[var(--color-plate-amber)] font-semibold">
            {percentiles.deadlift?.percentile?.toFixed(0) ?? "N/A"}th Percentile
          </div>
        </button>
      </div>

      {/* The Active Tufte Histogram */}
      {currentLiftData && (
        <div className="animate-enter delay-250">
          <TufteHistogram
            data={currentLiftData}
            title={`${selectedLift.toUpperCase()} DISTRIBUTION`}
          />
        </div>
      )}

      {/* Bodyweight Scaling Coefficients: Wilks vs. DOTS */}
      {progression?.views && (
        <div className="p-5 sm:p-6 bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] rounded-2xl flex flex-col gap-4 shadow-lg animate-enter delay-250">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-steel-border)]">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[var(--color-plate-amber)]" />
              <h3 className="font-mono text-xs uppercase tracking-wider text-white font-bold">
                Bodyweight Scaling Coefficients (All-Weight Division Standings)
              </h3>
            </div>

            {/* Toggle pill */}
            <div className="relative flex items-center p-1 rounded-lg bg-[var(--color-iron-800)] border border-[var(--color-steel-border)] self-start sm:self-auto">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-white shadow-sm pointer-events-none transition-transform duration-[400ms] ease-[cubic-bezier(0.2,0.9,0.3,1)] motion-reduce:transition-none ${
                  selectedFormula === "dots" ? "translate-x-0" : "translate-x-full"
                }`}
                style={{ left: "4px" }}
              />
              <button
                type="button"
                id="btn-formula-dots"
                onClick={() => setSelectedFormula("dots")}
                className={`relative z-10 px-3 py-1 rounded-md font-mono text-xs uppercase transition-colors duration-[300ms] cursor-pointer active:scale-[0.98] ${
                  selectedFormula === "dots"
                    ? "text-black font-bold"
                    : "text-[var(--color-chalk-muted)] hover:text-white"
                }`}
              >
                DOTS Formula
              </button>
              <button
                type="button"
                id="btn-formula-wilks"
                onClick={() => setSelectedFormula("wilks")}
                className={`relative z-10 px-3 py-1 rounded-md font-mono text-xs uppercase transition-colors duration-[300ms] cursor-pointer active:scale-[0.98] ${
                  selectedFormula === "wilks"
                    ? "text-black font-bold"
                    : "text-[var(--color-chalk-muted)] hover:text-white"
                }`}
              >
                Wilks Formula
              </button>
            </div>
          </div>

          {/* Selected Formula Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] flex flex-col gap-2">
              <span className="font-mono text-xs text-[var(--color-chalk-dim)] uppercase block">
                {selectedFormula.toUpperCase()} Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                  <StatValue value={formulaData.score} decimals={1} />
                </span>
                <span className="font-mono text-xs text-[var(--color-chalk-muted)]">points</span>
              </div>
              <span className="font-mono text-[11px] text-[var(--color-chalk-dim)]">
                Bodyweight-adjusted strength rating
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] flex flex-col gap-2">
              <span className="font-mono text-xs text-[var(--color-chalk-dim)] uppercase block">
                National Percentile by {selectedFormula.toUpperCase()}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--color-plate-amber)]">
                  {formulaData.percentile !== null && formulaData.percentile !== undefined ? (
                    <StatValue value={formulaData.percentile} decimals={0} suffix="%" />
                  ) : (
                    "N/A"
                  )}
                </span>
                <span className="font-mono text-xs text-[var(--color-chalk-muted)]">
                  ({formulaData.n.toLocaleString()} lifters)
                </span>
              </div>
              <span className="font-mono text-[11px] text-[var(--color-chalk-dim)]">
                Across all weight categories combined
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--color-chalk-dim)] italic leading-relaxed">
            {selectedFormula === "dots"
              ? "DOTS (Dynamic Objective Team Scoring) is the modern standard used by the IPF and WRPF since 2019, eliminating the bias Wilks had toward middleweight lifters."
              : "Wilks is the legacy 1997 formula. It provides historic comparability across decades of powerlifting meets, but mildly penalizes extreme lightweight and superheavyweight competitors."}
          </p>
        </div>
      )}

      {/* Federation Division Standing: Tested vs. Untested Reality Check */}
      {toggle && toggle.views && (
        <div className="p-5 sm:p-6 bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] rounded-2xl flex flex-col gap-4 shadow-lg animate-enter delay-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--color-steel-border)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-mono text-xs uppercase tracking-wider text-white font-bold">
                Federation Division Impact (Tested vs. Untested Standings)
              </h3>
            </div>
            <span className="font-mono text-[11px] text-[var(--color-chalk-dim)]">
              Cohort: {toggle.age_bracket} | {toggle.weight_class}
            </span>
          </div>

          <p className="text-xs text-[var(--color-chalk-muted)] leading-relaxed">
            {toggle.explainer}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Tested */}
            <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Tested Federations
                </div>
                <span className="font-mono text-[10px] text-[var(--color-chalk-dim)]">
                  {toggle.views.tested?.n?.toLocaleString()} lifters
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                {toggle.views.tested?.percentile !== null && toggle.views.tested?.percentile !== undefined ? (
                  <StatValue value={toggle.views.tested.percentile} decimals={0} suffix="%" />
                ) : (
                  "N/A"
                )}
              </div>
              <span className="font-mono text-[11px] text-emerald-400 font-medium">
                Drug-tested (IPF, USAPL, CPU)
              </span>
            </div>

            {/* All */}
            <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white uppercase">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Combined (All)
                </div>
                <span className="font-mono text-[10px] text-[var(--color-chalk-dim)]">
                  {toggle.views.all?.n?.toLocaleString()} lifters
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                {toggle.views.all?.percentile !== null && toggle.views.all?.percentile !== undefined ? (
                  <StatValue value={toggle.views.all.percentile} decimals={0} suffix="%" />
                ) : (
                  "N/A"
                )}
              </div>
              <span className="font-mono text-[11px] text-[var(--color-chalk-muted)]">
                Global competitive baseline
              </span>
            </div>

            {/* Untested */}
            <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white uppercase">
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                  Untested Federations
                </div>
                <span className="font-mono text-[10px] text-[var(--color-chalk-dim)]">
                  {toggle.views.untested?.n?.toLocaleString()} lifters
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                {toggle.views.untested?.percentile !== null && toggle.views.untested?.percentile !== undefined ? (
                  <StatValue value={toggle.views.untested.percentile} decimals={0} suffix="%" />
                ) : (
                  "N/A"
                )}
              </div>
              <span className="font-mono text-[11px] text-orange-400 font-medium">
                Highest competitive ceiling (WRPF, USPA)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
