import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { toast } from "sonner";
import {
  Trophy,
  Dumbbell,
  TrendingUp,
  Share2,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { Route } from "./+types/home";
import type { FullAnalysisRequest, FullAnalysisResponse } from "../types/api";
import {
  type LifterFormInputs,
  EMPTY_FORM_STATE,
  parseUrlState,
  hasUrlState,
  buildUrlParams,
  toAnalysisRequest,
} from "../services/urlState";
import { fetchFullAnalysis } from "../services/api";
import { LifterForm } from "../components/input/LifterForm";
import { OverviewTab } from "../components/tabs/OverviewTab";
import { ArchetypeTab } from "../components/tabs/ArchetypeTab";
import { ProgressionTab } from "../components/tabs/ProgressionTab";
import { ShareCardTab } from "../components/tabs/ShareCardTab";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "LiftStats | Statistical Powerlifting Percentile Benchmarking" },
    {
      name: "description",
      content:
        "Where do your squat, bench, and deadlift really rank? Instant, statistically grounded percentile benchmarking against 1,550,000+ real OpenPowerlifting competition attempts.",
    },
    { property: "og:site_name", content: "LiftStats" },
    { property: "og:title", content: "LiftStats | Statistical Strength Benchmarking & ML Forecasting" },
    {
      property: "og:description",
      content:
        "Where do your squat, bench, and deadlift really rank? Instant, statistically grounded percentile benchmarking against 1.55M+ real competition attempts.",
    },
    { property: "og:image", content: "/og-image.png" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "LiftStats | Statistical Strength Benchmarking & ML Forecasting" },
    {
      name: "twitter:description",
      content:
        "Instant, statistically grounded percentile benchmarking and longitudinal ML forecasting against 1.55M+ real competition attempts.",
    },
    { name: "twitter:image", content: "/og-image.png" },
  ];
}

type TabType = "overview" | "archetype" | "progression" | "share";

export default function Home() {
  const [formInputs, setFormInputs] = useState<LifterFormInputs>(EMPTY_FORM_STATE);
  const [activeRequest, setActiveRequest] = useState<FullAnalysisRequest | null>(null);
  const [response, setResponse] = useState<FullAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [error, setError] = useState<string | null>(null);

  // Tab indicator floating pill measurement
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [tabIndicator, setTabIndicator] = useState<{
    left: number;
    width: number;
    ready: boolean;
  }>({ left: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setTabIndicator({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    }
  }, [activeTab, response]);

  useEffect(() => {
    let animId: number | null = null;
    const handleResize = () => {
      if (animId !== null) return;
      animId = window.requestAnimationFrame(() => {
        animId = null;
        const el = tabRefs.current[activeTab];
        if (el) {
          setTabIndicator({
            left: el.offsetLeft,
            width: el.offsetWidth,
            ready: true,
          });
        }
      });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animId !== null) {
        window.cancelAnimationFrame(animId);
      }
    };
  }, [activeTab]);

  // Execute calculation
  const executeAnalysis = useCallback(async (params: FullAnalysisRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchFullAnalysis(params);
      setResponse(res);
      setActiveRequest(params);

      // Update URL query parameters without reloading
      if (typeof window !== "undefined") {
        const queryString = buildUrlParams(params);
        const newUrl = `${window.location.pathname}?${queryString}`;
        window.history.replaceState(null, "", newUrl);
      }
    } catch (err: unknown) {
      console.error("Analysis calculation error:", err);
      const msg = err instanceof Error ? err.message : "Failed to compute strength benchmark";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setFormInputs(EMPTY_FORM_STATE);
    setResponse(null);
    setActiveRequest(null);
    setError(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Initialize on mount only if URL contains lifter parameters (e.g. shared link)
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (hasUrlState(window.location.search)) {
        const parsed = parseUrlState(window.location.search);
        setFormInputs(parsed);
        const req = toAnalysisRequest(parsed);
        executeAnalysis(req);
      } else {
        setFormInputs(EMPTY_FORM_STATE);
        setResponse(null);
      }
    }
  }, [executeAnalysis]);

  return (
    <div className="min-h-screen flex flex-col text-[var(--color-chalk-white)]">
      {/* Top Industrial Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[var(--color-iron-950)]/80 backdrop-blur-md border-b border-[var(--color-steel-border)] px-4 sm:px-8 py-3.5 flex items-center justify-between animate-enter">
        <div className="flex items-center gap-3">
          {/* Logo Knurl Icon */}
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black shadow-md">
            <Dumbbell className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold tracking-wider uppercase text-white">
                LiftStats
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[var(--color-iron-800)] text-[var(--color-chalk-muted)] border border-[var(--color-steel-border)]">
                v1.0
              </span>
            </div>
            <span className="text-[11px] text-[var(--color-chalk-dim)] hidden sm:block">
              OpenPowerlifting National Benchmark Engine
            </span>
          </div>
        </div>

        {/* Engine Status & Links */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px]">1.55M Records Indexed</span>
          </div>

          <a
            href="https://www.openpowerlifting.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[var(--color-chalk-dim)] hover:text-white transition-colors"
          >
            <span className="hidden md:inline">OpenPowerlifting.org</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main App Layout */}
      <main id="main-content" className="flex-1 max-w-7xl 2xl:max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Intro Tagline */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 animate-enter delay-50">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white uppercase">
              Statistical Strength Benchmark
            </h1>
            <p className="text-sm text-[var(--color-chalk-muted)] mt-1">
              Compare your squat, bench, and deadlift against real sanctioned competitors — no gym-bro guesswork.
            </p>
          </div>
        </div>

        {/* 2-Column Responsive Dashboard */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left Side: Lifter Profile Form */}
          <div className="w-full lg:w-[460px] xl:w-[480px] shrink-0 lg:sticky lg:top-20 animate-enter delay-100">
            <LifterForm
              formState={formInputs}
              setFormState={setFormInputs}
              onSubmit={executeAnalysis}
              onReset={handleReset}
              isLoading={isLoading}
            />
          </div>

          {/* Right Side: Tabbed Results & Analytical Engines OR Empty State */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-6" aria-live="polite" aria-atomic="false">
            {/* If Results Exist, Show Tab Navigation */}
            {response && (
              <div
                ref={tabContainerRef}
                role="tablist"
                aria-label="Benchmark analytical sections"
                className="relative w-full flex items-center p-1 rounded-xl bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] overflow-x-auto no-scrollbar gap-1 animate-enter delay-100"
              >
                {/* Floating Active Pill Indicator - Tuned to 400ms for luxurious glide */}
                <div
                  className="absolute top-1 bottom-1 rounded-lg bg-white shadow-md pointer-events-none transition-all duration-[400ms] ease-[cubic-bezier(0.2,0.9,0.3,1)] motion-reduce:transition-none"
                  style={{
                    left: 0,
                    transform: `translateX(${tabIndicator.left}px)`,
                    width: `${tabIndicator.width}px`,
                    opacity: tabIndicator.ready ? 1 : 0,
                  }}
                />

                <button
                  ref={(el) => {
                    tabRefs.current["overview"] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "overview"}
                  aria-controls="tabpanel-overview"
                  id="tab-overview"
                  onClick={() => setActiveTab("overview")}
                  className={`relative z-10 flex-1 min-w-[120px] py-2.5 px-3 rounded-lg font-mono text-xs uppercase font-semibold flex items-center justify-center gap-2 transition-colors duration-[300ms] cursor-pointer active:scale-[0.98] ${activeTab === "overview"
                      ? "text-black"
                      : "text-[var(--color-chalk-muted)] hover:text-white"
                    }`}
                >
                  <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Percentiles</span>
                </button>

                <button
                  ref={(el) => {
                    tabRefs.current["archetype"] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "archetype"}
                  aria-controls="tabpanel-archetype"
                  id="tab-archetype"
                  onClick={() => setActiveTab("archetype")}
                  className={`relative z-10 flex-1 min-w-[120px] py-2.5 px-3 rounded-lg font-mono text-xs uppercase font-semibold flex items-center justify-center gap-2 transition-colors duration-[300ms] cursor-pointer active:scale-[0.98] ${activeTab === "archetype"
                      ? "text-black"
                      : "text-[var(--color-chalk-muted)] hover:text-white"
                    }`}
                >
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Archetype</span>
                </button>

                <button
                  ref={(el) => {
                    tabRefs.current["progression"] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "progression"}
                  aria-controls="tabpanel-progression"
                  id="tab-progression"
                  onClick={() => setActiveTab("progression")}
                  className={`relative z-10 flex-1 min-w-[120px] py-2.5 px-3 rounded-lg font-mono text-xs uppercase font-semibold flex items-center justify-center gap-2 transition-colors duration-[300ms] cursor-pointer active:scale-[0.98] ${activeTab === "progression"
                      ? "text-black"
                      : "text-[var(--color-chalk-muted)] hover:text-white"
                    }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Progression</span>
                </button>

                <button
                  ref={(el) => {
                    tabRefs.current["share"] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "share"}
                  aria-controls="tabpanel-share"
                  id="tab-share"
                  onClick={() => setActiveTab("share")}
                  className={`relative z-10 flex-1 min-w-[120px] py-2.5 px-3 rounded-lg font-mono text-xs uppercase font-semibold flex items-center justify-center gap-2 transition-colors duration-[300ms] cursor-pointer active:scale-[0.98] ${activeTab === "share"
                      ? "text-black"
                      : "text-[var(--color-chalk-muted)] hover:text-white"
                    }`}
                >
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Share Plaque</span>
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/60 font-mono text-xs text-red-300">
                <strong>Computation Error:</strong> {error}
              </div>
            )}

            {/* Loading Spinner */}
            {isLoading && (
              <div className="h-96 rounded-2xl bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] p-8 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)]">
                  Loading national powerlifting cohort distributions...
                </span>
              </div>
            )}

            {/* Empty State when no calculation has been run yet */}
            {!isLoading && !response && (
              <div className="rounded-2xl bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] p-6 sm:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden animate-enter delay-150">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                {/* Status badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-iron-800)] border border-[var(--color-steel-border)] text-xs font-mono text-[var(--color-chalk-muted)] mb-6 animate-enter delay-200">
                  <span>AWAITING LIFTER DATA • 1.55M RECORDS READY</span>
                </div>

                {/* Big Title */}
                <h2 className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-white uppercase max-w-lg animate-enter delay-200">
                  Enter Your Metrics To Reveal Your Benchmark
                </h2>
                <p className="text-sm text-[var(--color-chalk-muted)] max-w-xl mt-2 leading-relaxed animate-enter delay-250">
                  Fill out your biological sex, bodyweight, and 1RM lifts (Squat, Bench, Deadlift) on the left, then click <strong className="text-white">Calculate Benchmark</strong> to see your national percentile standing.
                </p>

                {/* Feature preview grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl mt-8 text-left font-mono">
                  <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] flex flex-col gap-1.5 animate-enter delay-200">
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Cohort Percentiles</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-chalk-muted)] font-sans">
                      Historical distribution analysis mapped by exact age bracket, weight class, and tested status.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] flex flex-col gap-1.5 animate-enter delay-250">
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span>Lifting Archetypes</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-chalk-muted)] font-sans">
                      Biomechanical movement profile comparing your S:B:D ratio against national strength distributions.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] flex flex-col gap-1.5 animate-enter delay-300">
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>12-Month Progression</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-chalk-muted)] font-sans">
                      1-year potential strength gains estimated from lifters with 3+ sanctioned meets in your division.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] flex flex-col gap-1.5 animate-enter delay-350">
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase">
                      <Share2 className="w-4 h-4 text-purple-400" />
                      <span>Digital Trophy Plaque</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-chalk-muted)] font-sans">
                      Laser-etched exportable summary plaque with Wilks & DOTS bodyweight coefficients.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Active Tab Panel when response is available */}
            {response && (
              <div key={activeTab} className="w-full view-enter">
                {activeTab === "overview" && <OverviewTab response={response} />}
                {activeTab === "archetype" && <ArchetypeTab response={response} />}
                {activeTab === "progression" && <ProgressionTab response={response} />}
                {activeTab === "share" && activeRequest && (
                  <ShareCardTab request={activeRequest} response={response} />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="mt-auto border-t border-[var(--color-steel-border)] py-6 px-4 sm:px-8 bg-[var(--color-iron-950)]/70 backdrop-blur-sm font-mono text-xs text-[var(--color-chalk-dim)] animate-enter delay-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="text-[var(--color-chalk-muted)] font-semibold">LiftStats Analytical Suite</span> —
            Built with FastAPI, Pandas & Scikit-Learn.
          </div>
          <div>Data sourced from OpenPowerlifting under public domain / ODbL license.</div>
        </div>
      </footer>
    </div>
  );
}
