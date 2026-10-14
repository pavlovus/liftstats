import { useState } from "react";
import type { ProgressionResponse } from "../../types/api";
import { StatValue } from "./StatValue";

interface ProgressionRangeProps {
  progression: ProgressionResponse;
}

export function ProgressionRange({ progression }: ProgressionRangeProps) {
  const [selectedFormula, setSelectedFormula] = useState<"wilks" | "dots">("dots");

  const { total, point, lo, hi, views, explainer } = progression;

  // The model outputs the 1-year GAIN in kg (can be negative for lo bound / masters)
  const currentTotal = total;
  const expectedGain = point;
  const loGain = lo;
  const hiGain = hi;

  const targetTotal = currentTotal + expectedGain;
  const loTotal = currentTotal + loGain;
  const hiTotal = currentTotal + hiGain;

  const formulaData = views[selectedFormula] || { score: 0, percentile: null, n: 0 };

  const minVal = Math.min(currentTotal, loTotal);
  const maxVal = Math.max(targetTotal, hiTotal);
  const span = Math.max(maxVal - minVal, 10);
  const pad = span * 0.18;
  const rangeMin = minVal - pad;
  const rangeMax = maxVal + pad;
  const rangeWidth = rangeMax - rangeMin;

  const getPercent = (val: number) => {
    return Math.max(10, Math.min(90, ((val - rangeMin) / rangeWidth) * 100));
  };

  const nowLeft = getPercent(currentTotal);
  const loLeft = getPercent(loTotal);
  const targetLeft = getPercent(targetTotal);
  const hiLeft = getPercent(hiTotal);

  const activeLeft = Math.min(nowLeft, loLeft);
  const activeRight = 100 - hiLeft;

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] rounded-xl p-5 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-steel-border)] animate-enter delay-50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--color-plate-green)]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)]">
              Annual Progression Projection
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
            12-Month Progression Horizon
          </h3>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-[var(--color-steel-border-light)] bg-[var(--color-iron-800)] font-mono text-xs text-[var(--color-chalk-muted)] self-start sm:self-auto">
          3+ Meets History Filtered
        </div>
      </div>

      {/* Explainer / Disclaimer */}
      <p className="text-sm text-[var(--color-chalk-muted)] leading-relaxed animate-enter delay-100">
        {explainer}
      </p>

      {/* Primary Projection Gauge */}
      <div className="p-4 rounded-lg bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] flex flex-col gap-4 animate-enter delay-150">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-xs text-[var(--color-chalk-muted)] uppercase tracking-wider">
            Expected 1-Year Gain Range
          </span>
          <span className="font-mono text-sm text-[var(--color-plate-green)] font-bold">
            <StatValue
              value={expectedGain}
              decimals={1}
              prefix={expectedGain >= 0 ? "+" : ""}
              suffix=" kg expected"
            />
          </span>
        </div>

        {/* Visual Range Bar */}
        <div className="relative pt-6 pb-6">
          {/* Track line */}
          <div className="w-full h-2 rounded-full bg-[var(--color-iron-800)] relative border border-[var(--color-steel-border)]">
            {/* Projected active zone */}
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-[var(--color-plate-blue)] to-[var(--color-plate-green)] rounded-full opacity-70 transition-all duration-700 ease-out"
              style={{ left: `${activeLeft}%`, right: `${Math.max(0, activeRight)}%` }}
            />
          </div>

          {/* Current Marker */}
          <div
            className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center transition-all duration-700 ease-out"
            style={{ left: `${nowLeft}%` }}
          >
            <span className="font-mono text-[10px] text-[var(--color-chalk-dim)] uppercase">Now</span>
            <div className="w-3 h-3 rounded-full bg-white border-2 border-[var(--color-iron-950)] mt-0.5 shadow-sm" />
            <span className="font-mono text-xs font-bold text-white mt-1 whitespace-nowrap">
              <StatValue value={currentTotal} decimals={1} suffix="kg" />
            </span>
          </div>

          {/* Point Estimate Marker */}
          <div
            className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center transition-all duration-700 ease-out"
            style={{ left: `${targetLeft}%` }}
          >
            <span className="font-mono text-[10px] text-[var(--color-plate-green)] font-semibold uppercase">
              Target (+{expectedGain.toFixed(0)}kg)
            </span>
            <div className="w-4 h-4 rounded-full bg-[var(--color-plate-green)] border-2 border-[var(--color-iron-950)] mt-0.5 shadow-md animate-pulse" />
            <span className="font-mono text-xs font-bold text-white mt-1 whitespace-nowrap">
              <StatValue value={targetTotal} decimals={1} suffix="kg" />
            </span>
          </div>

          {/* Upper Bound Marker */}
          <div
            className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center transition-all duration-700 ease-out"
            style={{ left: `${hiLeft}%` }}
          >
            <span className="font-mono text-[10px] text-[var(--color-chalk-dim)] uppercase">
              High Ceiling
            </span>
            <div className="w-3 h-3 rounded-full bg-[var(--color-steel-highlight)] border-2 border-[var(--color-iron-950)] mt-0.5" />
            <span className="font-mono text-xs text-[var(--color-chalk-muted)] mt-1 whitespace-nowrap">
              <StatValue value={hiTotal} decimals={1} suffix="kg" />
            </span>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--color-steel-border)]">
          <div className="p-2.5 rounded bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] text-center">
            <span className="block font-mono text-[10px] text-[var(--color-chalk-dim)] uppercase">
              Conservative (Lo)
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-white">
              <StatValue value={loTotal} decimals={1} /> kg
            </span>
            <span className="block font-mono text-[10px] text-[var(--color-chalk-muted)]">
              <StatValue
                value={loGain}
                decimals={1}
                prefix={loGain >= 0 ? "+" : ""}
                suffix=" kg"
              />
            </span>
          </div>

          <div className="p-2.5 rounded bg-[var(--color-iron-900)] border border-[var(--color-plate-green)]/30 text-center">
            <span className="block font-mono text-[10px] text-[var(--color-plate-green)] uppercase font-semibold">
              Median Target
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-white">
              <StatValue value={targetTotal} decimals={1} /> kg
            </span>
            <span className="block font-mono text-[10px] text-[var(--color-plate-green)] font-semibold">
              <StatValue value={expectedGain} decimals={1} prefix="+" suffix=" kg" />
            </span>
          </div>

          <div className="p-2.5 rounded bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] text-center">
            <span className="block font-mono text-[10px] text-[var(--color-chalk-dim)] uppercase">
              High Ceiling (Hi)
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-white">
              <StatValue value={hiTotal} decimals={1} /> kg
            </span>
            <span className="block font-mono text-[10px] text-[var(--color-chalk-muted)]">
              <StatValue value={hiGain} decimals={1} prefix="+" suffix=" kg" />
            </span>
          </div>
        </div>
      </div>

      {/* Wilks vs DOTS Transparency Section */}
      <div className="flex flex-col gap-3 pt-2 animate-enter delay-250">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold">
              Bodyweight Scaling Coefficients
            </span>
          </div>

          {/* Toggle pill */}
          <div className="relative flex items-center p-1 rounded-lg bg-[var(--color-iron-800)] border border-[var(--color-steel-border)]">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] animate-enter delay-300">
          <div>
            <span className="font-mono text-xs text-[var(--color-chalk-dim)] uppercase block mb-1">
              {selectedFormula.toUpperCase()} Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                <StatValue value={formulaData.score} decimals={1} />
              </span>
              <span className="font-mono text-xs text-[var(--color-chalk-muted)]">points</span>
            </div>
          </div>

          <div>
            <span className="font-mono text-xs text-[var(--color-chalk-dim)] uppercase block mb-1">
              National Percentile by {selectedFormula.toUpperCase()}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[var(--color-plate-amber)]">
                {formulaData.percentile !== null ? (
                  <StatValue value={formulaData.percentile} decimals={0} suffix="%" />
                ) : (
                  "N/A"
                )}
              </span>
              <span className="font-mono text-xs text-[var(--color-chalk-muted)]">
                (Sample size: {formulaData.n.toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-[var(--color-chalk-dim)] italic">
          {selectedFormula === "dots"
            ? "DOTS (Dynamic Objective Team Scoring) is the modern standard used by the IPF and WRPF since 2019, eliminating the bias Wilks had toward middleweight lifters."
            : "Wilks is the legacy 1997 formula. It provides historic comparability across decades of powerlifting meets, but mildly penalizes extreme lightweight and superheavyweight competitors."}
        </p>
      </div>
    </div>
  );
}
