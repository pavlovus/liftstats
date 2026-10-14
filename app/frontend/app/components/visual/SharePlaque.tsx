import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download, Link as LinkIcon, Share2, Copy, Check } from "lucide-react";
import type { FullAnalysisRequest, FullAnalysisResponse } from "../../types/api";

interface SharePlaqueProps {
  request: FullAnalysisRequest;
  response: FullAnalysisResponse;
}

export function SharePlaque({ request, response }: SharePlaqueProps) {
  const plaqueRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const { total, percentiles, archetype, progression } = response;
  const totalPercentile = percentiles.total?.percentile ?? 50;
  const topRankVal = Math.max(0, 100 - totalPercentile);
  const formattedTopRank =
    topRankVal < 1
      ? "< 1%"
      : `${topRankVal < 5 ? topRankVal.toFixed(1) : topRankVal.toFixed(0)}%`;

  const handleDownloadPng = async () => {
    const node = plaqueRef.current;
    if (!node) return;
    try {
      setIsExporting(true);
      // Wait for React to apply exporting-clean state (removing shimmer-card ::before and animations)
      await new Promise((resolve) => setTimeout(resolve, 80));

      const rect = node.getBoundingClientRect();
      const width = Math.ceil(node.offsetWidth || rect.width);
      const height = Math.ceil(node.offsetHeight || rect.height);

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 3,
        width: width,
        height: height,
        backgroundColor: "#08090a",
        style: {
          margin: "0",
          transform: "none",
          transformOrigin: "top left",
          left: "0",
          top: "0",
          width: `${width}px`,
          height: `${height}px`,
          boxShadow: "none",
          animation: "none",
          transition: "none",
        },
      });
      const link = document.createElement("a");
      link.download = `liftstats-${request.bodyweight}kg-lifter.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Benchmark plaque downloaded as PNG!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to generate PNG image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success("Direct link with your stats copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    const text = [
      `🏋️‍♂️ **LiftStats Benchmark Results**`,
      `• Lifter: ${request.sex === "M" ? "Male" : "Female"}, ${request.age} yrs, ${request.bodyweight} kg`,
      `• Total: **${total.toFixed(1)} kg** (Rank: **Top ${formattedTopRank}**)`,
      `• Squat: ${request.squat.toFixed(1)} kg (${percentiles.squat?.percentile?.toFixed(0) ?? "N/A"}th %tile)`,
      `• Bench: ${request.bench.toFixed(1)} kg (${percentiles.bench?.percentile?.toFixed(0) ?? "N/A"}th %tile)`,
      `• Deadlift: ${request.deadlift.toFixed(1)} kg (${percentiles.deadlift?.percentile?.toFixed(0) ?? "N/A"}th %tile)`,
      `• Archetype: **${archetype.label}**`,
      `• DOTS Score: ${progression.views.dots?.score?.toFixed(1) ?? "N/A"}`,
      `• Benchmark via OpenPowerlifting data: ${typeof window !== "undefined" ? window.location.href : ""}`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success("Markdown summary copied for Discord / Reddit!");
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] rounded-xl animate-enter">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-white" />
          <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold">
            Export & Share Plaque
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-steel-border)] bg-[var(--color-iron-800)] hover:bg-[var(--color-steel-border)] font-mono text-xs text-white transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
            {copiedLink ? "Link Copied" : "Copy Link"}
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-steel-border)] bg-[var(--color-iron-800)] hover:bg-[var(--color-steel-border)] font-mono text-xs text-white transition-all"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedText ? "Text Copied" : "Copy Text"}
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-black font-mono text-xs font-bold hover:bg-neutral-200 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? "Rendering..." : "Download PNG"}
          </button>
        </div>
      </div>

      {/* The Printable / Exportable Trophy Plaque */}
      <div
        ref={plaqueRef}
        className={`w-full max-w-2xl mx-auto p-6 sm:p-8 bg-[#090a0c] border-2 border-[#2b303c] rounded-2xl flex flex-col gap-6 relative overflow-hidden shadow-2xl group ${
          isExporting ? "exporting-clean" : "shimmer-card animate-enter-scale delay-100"
        }`}
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      >
        {/* Top Header Strip */}
        <div className="flex items-center justify-between border-b border-[#2b303c] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rotate-45" />
            <span className="font-mono text-xs tracking-widest uppercase text-white font-bold">
              LIFTSTATS // VERIFIED BENCHMARK
            </span>
          </div>

          <div className="font-mono text-[11px] text-[#8c93a0] tracking-wider uppercase">
            OPENPOWERLIFTING V-1.0
          </div>
        </div>

        {/* Lifter Profile Subhead */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-white font-semibold">{request.sex === "M" ? "MALE" : "FEMALE"}</span>
            <span className="text-[#555e6d]">/</span>
            <span className="text-white">{request.age} YRS</span>
            <span className="text-[#555e6d]">/</span>
            <span className="text-[#f59e0b] font-bold">{request.bodyweight} KG BW</span>
          </div>

          <div className="font-mono text-xs text-[#8c93a0] uppercase">
            {request.tested_status === true
              ? "Tested Federation Only"
              : request.tested_status === false
              ? "Untested Division"
              : "All Competitors"}
          </div>
        </div>

        {/* Massive Hero Percentile & Total */}
        <div className="p-6 bg-[#11141a] border border-[#2b303c] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="block font-mono text-xs uppercase tracking-wider text-[#8c93a0] mb-1">
              National Tri-Event Standing
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
              TOP {formattedTopRank}
            </div>
            <span className="font-mono text-xs text-[#8c93a0]">
              Higher total than {totalPercentile.toFixed(0)}% of your weight class
            </span>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[#2b303c] pt-3 sm:pt-0 sm:pl-6">
            <span className="block font-mono text-xs uppercase tracking-wider text-[#8c93a0] mb-1">
              SBD Total
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
              {total.toFixed(1)} <span className="text-lg text-[#8c93a0]">KG</span>
            </div>
          </div>
        </div>

        {/* 3-Lift Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Squat */}
          <div className="p-2.5 sm:p-3.5 bg-[#11141a] border border-[#2b303c] rounded-lg min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#ef4444] shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#8c93a0] truncate">
                Squat
              </span>
            </div>
            <div className="font-mono text-base sm:text-xl font-bold text-white truncate">
              {request.squat.toFixed(1)} kg
            </div>
            <div className="font-mono text-[10px] sm:text-[11px] text-[#ef4444] font-semibold mt-1 truncate">
              {percentiles.squat?.percentile !== null ? `${percentiles.squat?.percentile?.toFixed(0)}th %tile` : "N/A"}
            </div>
          </div>

          {/* Bench */}
          <div className="p-2.5 sm:p-3.5 bg-[#11141a] border border-[#2b303c] rounded-lg min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#3b82f6] shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#8c93a0] truncate">
                Bench
              </span>
            </div>
            <div className="font-mono text-base sm:text-xl font-bold text-white truncate">
              {request.bench.toFixed(1)} kg
            </div>
            <div className="font-mono text-[10px] sm:text-[11px] text-[#3b82f6] font-semibold mt-1 truncate">
              {percentiles.bench?.percentile !== null ? `${percentiles.bench?.percentile?.toFixed(0)}th %tile` : "N/A"}
            </div>
          </div>

          {/* Deadlift */}
          <div className="p-2.5 sm:p-3.5 bg-[#11141a] border border-[#2b303c] rounded-lg min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#f59e0b] shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#8c93a0] truncate">
                Deadlift
              </span>
            </div>
            <div className="font-mono text-base sm:text-xl font-bold text-white truncate">
              {request.deadlift.toFixed(1)} kg
            </div>
            <div className="font-mono text-[10px] sm:text-[11px] text-[#f59e0b] font-semibold mt-1 truncate">
              {percentiles.deadlift?.percentile !== null ? `${percentiles.deadlift?.percentile?.toFixed(0)}th %tile` : "N/A"}
            </div>
          </div>
        </div>

        {/* Footer Stamp & Archetype */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2b303c] text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#8c93a0]">ARCHETYPE:</span>
            <span className="font-bold text-white uppercase">{archetype.label}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8c93a0]">DOTS:</span>
            <span className="font-bold text-[#f59e0b]">
              {progression.views.dots?.score?.toFixed(1) ?? "N/A"} PTS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
