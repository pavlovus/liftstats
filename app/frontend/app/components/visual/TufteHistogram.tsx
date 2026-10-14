import { useState, useRef, useId } from "react";
import type { PercentileResponse, DistributionBin } from "../../types/api";

interface TufteHistogramProps {
  data: PercentileResponse;
  title?: string;
}

export function TufteHistogram({ data, title }: TufteHistogramProps) {
  const [hoveredBin, setHoveredBin] = useState<DistributionBin | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const uniqueId = useId();

  const { bins, user_weight, percentile, p25, p50, p75, p90, population_size } = data;

  if (!bins || bins.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-[var(--color-steel-border)] rounded-lg bg-[var(--color-iron-900)] p-6 text-center">
        <span className="font-mono text-sm text-[var(--color-chalk-muted)]">
          Insufficient cohort distribution data for this lift.
        </span>
      </div>
    );
  }

  // Dimensions
  const viewBoxWidth = 840;
  const viewBoxHeight = 350;
  const padding = { top: 65, bottom: 55, left: 28, right: 28 };

  const chartWidth = viewBoxWidth - padding.left - padding.right;
  const chartHeight = viewBoxHeight - padding.top - padding.bottom;

  const minWeight = bins[0].weight;
  const maxWeight = bins[bins.length - 1].weight;
  const weightRange = Math.max(maxWeight - minWeight, 1);

  const maxCount = Math.max(...bins.map((b) => b.count), 1);

  const getX = (weight: number) => {
    const clamped = Math.min(Math.max(weight, minWeight), maxWeight);
    return padding.left + ((clamped - minWeight) / weightRange) * chartWidth;
  };

  const userX = getX(user_weight);
  const medianX = p50 ? getX(p50) : null;
  const p25X = p25 ? getX(p25) : null;
  const p75X = p75 ? getX(p75) : null;
  const p90X = p90 ? getX(p90) : null;

  const binStep = bins.length > 1 ? bins[1].weight - bins[0].weight : 2.5;
  const barWidth = Math.max((chartWidth / bins.length) - 1.5, 2);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * viewBoxWidth;

    if (svgX < padding.left || svgX > viewBoxWidth - padding.right) {
      setHoveredBin(null);
      setHoverX(null);
      return;
    }

    const hoveredWeight = minWeight + ((svgX - padding.left) / chartWidth) * weightRange;
    // Find closest bin
    let closest = bins[0];
    let minDiff = Math.abs(bins[0].weight - hoveredWeight);
    for (let i = 1; i < bins.length; i++) {
      const diff = Math.abs(bins[i].weight - hoveredWeight);
      if (diff < minDiff) {
        minDiff = diff;
        closest = bins[i];
      }
    }

    setHoveredBin(closest);
    setHoverX(getX(closest.weight));
  };

  const handlePointerLeave = () => {
    setHoveredBin(null);
    setHoverX(null);
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Direct Data Header (Tufte: Above all else, show the data) */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          {title && (
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)] font-semibold">
              {title}
            </span>
          )}
          <span className="font-mono text-xs text-[var(--color-chalk-dim)]">
            Cohort: {population_size.toLocaleString()} lifters
          </span>
        </div>

        {/* Dynamic Hover or Permanent Highlight Stat */}
        <div className="font-mono text-xs flex items-center gap-3">
          {hoveredBin ? (
            <div className="flex items-center gap-2 text-white bg-[var(--color-iron-800)] px-2.5 py-1 rounded border border-[var(--color-steel-border)]">
              <span className="text-[var(--color-chalk-muted)]">Bin:</span>
              <span className="font-bold text-white">{hoveredBin.weight.toFixed(1)} kg</span>
              <span className="text-[var(--color-steel-muted)]">|</span>
              <span className="text-[var(--color-chalk-muted)]">Athletes:</span>
              <span className="font-bold text-white">{hoveredBin.count.toLocaleString()}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[var(--color-chalk-muted)]">
              <span>
                Median (P50): <strong className="text-white">{p50 ? `${p50.toFixed(1)} kg` : "N/A"}</strong>
              </span>
              <span>
                You: <strong className="text-[var(--color-plate-amber)]">{user_weight.toFixed(1)} kg</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tufte Pure SVG Chart */}
      <div className="w-full relative bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] rounded-xl p-2 select-none overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-auto cursor-crosshair touch-pan-y"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            {/* Subtle glow for User Chalk Line */}
            <filter id={`chalkGlow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffffff" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Baseline axis line (Tufte minimalist baseline) */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={viewBoxWidth - padding.right}
            y2={padding.top + chartHeight}
            stroke="var(--color-steel-border-light)"
            strokeWidth="1.5"
          />

          {/* Histogram Bars */}
          {bins.map((bin, i) => {
            const barHeight = (bin.count / maxCount) * chartHeight;
            const x = getX(bin.weight) - barWidth / 2;
            const y = padding.top + chartHeight - barHeight;
            const isHovered = hoveredBin?.weight === bin.weight;

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1.5)}
                rx="1"
                fill={isHovered ? "#f4f4f6" : "var(--color-steel-border-light)"}
                className="transition-all duration-300 ease-out"
                style={{
                  fill: isHovered
                    ? "#ffffff"
                    : Math.abs(bin.weight - user_weight) < binStep * 0.8
                    ? "rgba(245, 158, 11, 0.45)"
                    : "#2c323f",
                }}
              />
            );
          })}

          {/* Quartile Tick Lines on Baseline (Tufte Direct Labeling) */}
          {p25X !== null && p25 !== null && (
            <g opacity="0.6">
              <line
                x1={p25X}
                y1={padding.top + chartHeight}
                x2={p25X}
                y2={padding.top + chartHeight + 6}
                stroke="var(--color-chalk-dim)"
                strokeWidth="1.5"
              />
              <text
                x={p25X}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className="fill-[var(--color-chalk-dim)] font-mono"
                fontSize="10"
              >
                P25 {p25.toFixed(0)}
              </text>
            </g>
          )}

          {medianX !== null && p50 !== null && (
            <g>
              <line
                x1={medianX}
                y1={padding.top + 10}
                x2={medianX}
                y2={padding.top + chartHeight}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={medianX}
                y={padding.top + 6}
                textAnchor="middle"
                className="fill-slate-400 font-mono font-medium"
                fontSize="11"
              >
                MEDIAN {p50.toFixed(0)}kg
              </text>
              <line
                x1={medianX}
                y1={padding.top + chartHeight}
                x2={medianX}
                y2={padding.top + chartHeight + 8}
                stroke="#64748b"
                strokeWidth="2"
              />
              <text
                x={medianX}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="fill-slate-300 font-mono font-semibold"
                fontSize="11"
              >
                P50 (Median)
              </text>
            </g>
          )}

          {p75X !== null && p75 !== null && (
            <g opacity="0.6">
              <line
                x1={p75X}
                y1={padding.top + chartHeight}
                x2={p75X}
                y2={padding.top + chartHeight + 6}
                stroke="var(--color-chalk-dim)"
                strokeWidth="1.5"
              />
              <text
                x={p75X}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className="fill-[var(--color-chalk-dim)] font-mono"
                fontSize="10"
              >
                P75 {p75.toFixed(0)}
              </text>
            </g>
          )}

          {p90X !== null && p90 !== null && (
            <g opacity="0.7">
              <line
                x1={p90X}
                y1={padding.top + chartHeight}
                x2={p90X}
                y2={padding.top + chartHeight + 6}
                stroke="var(--color-chalk-dim)"
                strokeWidth="1.5"
              />
              <text
                x={p90X}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className="fill-[var(--color-chalk-dim)] font-mono"
                fontSize="10"
              >
                P90 {p90.toFixed(0)}
              </text>
            </g>
          )}

          {/* User Marker Line (Chalk & Steel Accent) */}
          <g filter={`url(#chalkGlow-${uniqueId})`}>
            {/* Vertical User Line */}
            <line
              x1={userX}
              y1={padding.top - 8}
              x2={userX}
              y2={padding.top + chartHeight}
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            {/* Top Collar Marker */}
            <polygon
              points={`${userX - 6},${padding.top - 18} ${userX + 6},${padding.top - 18} ${userX},${padding.top - 8}`}
              fill="#ffffff"
            />
          </g>

          {/* User Direct Text Label on Top (No Legend Needed!) */}
          <g>
            <rect
              x={Math.min(Math.max(userX - 70, padding.left), viewBoxWidth - padding.right - 140)}
              y={padding.top - 44}
              width="140"
              height="24"
              rx="4"
              fill="#08090a"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <text
              x={Math.min(Math.max(userX, padding.left + 70), viewBoxWidth - padding.right - 70)}
              y={padding.top - 28}
              textAnchor="middle"
              className="fill-white font-mono font-bold"
              fontSize="11"
            >
              YOU: {user_weight.toFixed(1)}kg ({percentile !== null ? `${percentile.toFixed(0)}%` : "N/A"})
            </text>
          </g>

          {/* Hover Line and Indicator (If User is scrubbing) */}
          {hoverX !== null && hoveredBin && (
            <g opacity="0.9">
              <line
                x1={hoverX}
                y1={padding.top}
                x2={hoverX}
                y2={padding.top + chartHeight}
                stroke="#f4f4f6"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoverX}
                cy={padding.top + chartHeight - (hoveredBin.count / maxCount) * chartHeight}
                r="4"
                fill="#ffffff"
                stroke="#08090a"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Range bounds labels on ends */}
          <text
            x={padding.left}
            y={padding.top + chartHeight + 36}
            textAnchor="start"
            className="fill-[var(--color-chalk-dim)] font-mono"
            fontSize="10"
          >
            {minWeight.toFixed(0)} kg (Min)
          </text>
          <text
            x={viewBoxWidth - padding.right}
            y={padding.top + chartHeight + 36}
            textAnchor="end"
            className="fill-[var(--color-chalk-dim)] font-mono"
            fontSize="10"
          >
            {maxWeight.toFixed(0)} kg (Max)
          </text>
        </svg>
      </div>
    </div>
  );
}
