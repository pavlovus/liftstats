import { useState } from "react";
import { Dumbbell, ShieldCheck, Filter, ChevronDown, ChevronUp, RotateCcw, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { FullAnalysisRequest } from "../../types/api";
import {
  type LifterFormInputs,
  EMPTY_FORM_STATE,
  toAnalysisRequest,
} from "../../services/urlState";

interface LifterFormProps {
  formState: LifterFormInputs;
  setFormState: React.Dispatch<React.SetStateAction<LifterFormInputs>>;
  onSubmit: (state: FullAnalysisRequest) => void;
  onReset: () => void;
  isLoading: boolean;
}

export function LifterForm({
  formState,
  setFormState,
  onSubmit,
  onReset,
  isLoading,
}: LifterFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recentIncrement, setRecentIncrement] = useState<{
    lift: "squat" | "bench" | "deadlift";
    delta: number;
    id: number;
  } | null>(null);

  const handleChange = <K extends keyof LifterFormInputs>(
    key: K,
    value: LifterFormInputs[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleIncrement = (key: "squat" | "bench" | "deadlift", delta: number) => {
    setRecentIncrement({ lift: key, delta, id: Date.now() });
    setFormState((prev) => {
      const current = typeof prev[key] === "number" ? (prev[key] as number) : 0;
      return {
        ...prev,
        [key]: Math.max(current + delta, 0),
      };
    });
  };

  const sqNum = typeof formState.squat === "number" ? formState.squat : 0;
  const bpNum = typeof formState.bench === "number" ? formState.bench : 0;
  const dlNum = typeof formState.deadlift === "number" ? formState.deadlift : 0;
  const currentTotal = sqNum + bpNum + dlNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bw = typeof formState.bodyweight === "number" ? formState.bodyweight : parseFloat(String(formState.bodyweight));
    if (!bw || Number.isNaN(bw) || bw < 30 || bw > 250) {
      toast.error("Please enter a valid bodyweight between 30 and 250 kg.");
      return;
    }

    const age = typeof formState.age === "number" ? formState.age : parseFloat(String(formState.age));
    if (!age || Number.isNaN(age) || age < 14 || age > 100) {
      toast.error("Please enter a valid age between 14 and 100 years.");
      return;
    }

    const sq = typeof formState.squat === "number" ? formState.squat : parseFloat(String(formState.squat));
    if (!sq || Number.isNaN(sq) || sq <= 0) {
      toast.error("Please enter your 1RM Squat (greater than 0 kg).");
      return;
    }

    const bp = typeof formState.bench === "number" ? formState.bench : parseFloat(String(formState.bench));
    if (!bp || Number.isNaN(bp) || bp <= 0) {
      toast.error("Please enter your 1RM Bench Press (greater than 0 kg).");
      return;
    }

    const dl = typeof formState.deadlift === "number" ? formState.deadlift : parseFloat(String(formState.deadlift));
    if (!dl || Number.isNaN(dl) || dl <= 0) {
      toast.error("Please enter your 1RM Deadlift (greater than 0 kg).");
      return;
    }

    const request = toAnalysisRequest(formState);
    onSubmit(request);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const loadPreset = (preset: "male83" | "female63" | "heavyweight") => {
    if (preset === "male83") {
      setFormState({
        sex: "M",
        age: 26,
        bodyweight: 83,
        squat: 180,
        bench: 125,
        deadlift: 220,
        training_age: 3,
        meets_so_far: 2,
        tested_status: null,
        sbd_only: false,
      });
      toast.info("83kg Male preset loaded. Press 'Calculate Benchmark' to view results.");
    } else if (preset === "female63") {
      setFormState({
        sex: "F",
        age: 24,
        bodyweight: 63,
        squat: 125,
        bench: 72.5,
        deadlift: 155,
        training_age: 2.5,
        meets_so_far: 1,
        tested_status: true,
        sbd_only: false,
      });
      toast.info("63kg Female preset loaded. Press 'Calculate Benchmark' to view results.");
    } else {
      setFormState({
        sex: "M",
        age: 31,
        bodyweight: 105,
        squat: 235,
        bench: 160,
        deadlift: 280,
        training_age: 6,
        meets_so_far: 4,
        tested_status: null,
        sbd_only: true,
      });
      toast.info("105kg Heavy preset loaded. Press 'Calculate Benchmark' to view results.");
    }
  };

  const handleReset = () => {
    setFormState(EMPTY_FORM_STATE);
    onReset();
    toast.info("Form reset to empty.");
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] rounded-2xl p-5 sm:p-6 flex flex-col gap-6 shadow-xl"
    >
      {/* Form Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-steel-border)] pb-4 animate-enter">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[var(--color-iron-800)] border border-[var(--color-steel-border)] text-white">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight uppercase font-mono">
              Lifter Profile
            </h2>
            <span className="text-xs text-[var(--color-chalk-muted)]">
              Real OpenPowerlifting Cohort Match
            </span>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleReset}
            title="Reset form to empty"
            className="p-1.5 rounded-md hover:bg-[var(--color-iron-800)] text-[var(--color-chalk-muted)] hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Presets Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-mono animate-enter delay-50">
        <span className="text-[var(--color-chalk-dim)] text-[11px] uppercase mr-1">Presets:</span>
        <button
          type="button"
          id="preset-male83"
          onClick={() => loadPreset("male83")}
          className="px-2.5 py-1 rounded bg-[var(--color-iron-800)] hover:bg-white hover:text-black hover:border-white text-white border border-[var(--color-steel-border)] whitespace-nowrap cursor-pointer transition-all duration-150 active:scale-95"
        >
          83kg Male
        </button>
        <button
          type="button"
          id="preset-female63"
          onClick={() => loadPreset("female63")}
          className="px-2.5 py-1 rounded bg-[var(--color-iron-800)] hover:bg-white hover:text-black hover:border-white text-white border border-[var(--color-steel-border)] whitespace-nowrap cursor-pointer transition-all duration-150 active:scale-95"
        >
          63kg Female
        </button>
        <button
          type="button"
          id="preset-heavyweight"
          onClick={() => loadPreset("heavyweight")}
          className="px-2.5 py-1 rounded bg-[var(--color-iron-800)] hover:bg-white hover:text-black hover:border-white text-white border border-[var(--color-steel-border)] whitespace-nowrap cursor-pointer transition-all duration-150 active:scale-95"
        >
          105kg Heavy
        </button>
      </div>

      {/* Primary Demographic Fields: Sex, Age, Bodyweight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-enter delay-100">
        {/* Sex Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-chalk-muted)]">
            Sex
          </label>
          <div className="relative flex items-center p-1 rounded-lg bg-[var(--color-iron-800)] border border-[var(--color-steel-border)] h-[44px]">
            {/* Smooth Floating Pill Indicator - Tuned to 400ms for luxurious glide */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-white shadow-md pointer-events-none transition-transform duration-[400ms] ease-[cubic-bezier(0.2,0.9,0.3,1)] motion-reduce:transition-none ${
                formState.sex === "M" ? "translate-x-0" : "translate-x-full"
              }`}
              style={{ left: "4px" }}
            />
            <button
              type="button"
              id="btn-sex-male"
              onClick={() => handleChange("sex", "M")}
              className={`relative z-10 flex-1 h-full rounded-md font-mono text-xs font-bold transition-colors duration-[300ms] cursor-pointer flex items-center justify-center active:scale-[0.98] ${
                formState.sex === "M"
                  ? "text-black"
                  : "text-[var(--color-chalk-muted)] hover:text-white"
              }`}
            >
              Male
            </button>
            <button
              type="button"
              id="btn-sex-female"
              onClick={() => handleChange("sex", "F")}
              className={`relative z-10 flex-1 h-full rounded-md font-mono text-xs font-bold transition-colors duration-[300ms] cursor-pointer flex items-center justify-center active:scale-[0.98] ${
                formState.sex === "F"
                  ? "text-black"
                  : "text-[var(--color-chalk-muted)] hover:text-white"
              }`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Age Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <label htmlFor="input-age" className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-chalk-muted)] cursor-pointer">
              Age
            </label>
            <span className="font-mono text-[10px] text-[var(--color-chalk-dim)]">14–100</span>
          </div>
          <input
            id="input-age"
            name="age"
            type="number"
            min={14}
            max={100}
            step={1}
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 26"
            value={formState.age}
            onChange={(e) => {
              const val = e.target.value;
              handleChange("age", val === "" ? "" : parseFloat(val));
            }}
            className="w-full h-[44px] px-3.5 rounded-lg bg-[var(--color-iron-800)] border border-[var(--color-steel-border)] text-white font-mono text-base placeholder:text-[var(--color-chalk-dim)] hover:border-[var(--color-steel-muted)] hover:bg-[#1f242d] focus:outline-none focus:border-white focus:bg-[var(--color-iron-800)] focus:ring-1 focus:ring-white/20 transition-all duration-150"
          />
        </div>

        {/* Bodyweight Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <label htmlFor="input-bodyweight" className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-chalk-muted)] cursor-pointer">
              Bodyweight
            </label>
            <span className="font-mono text-[10px] text-[var(--color-chalk-dim)]">30–250</span>
          </div>
          <input
            id="input-bodyweight"
            name="bodyweight"
            type="number"
            min={30}
            max={250}
            step={0.5}
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 83"
            value={formState.bodyweight}
            onChange={(e) => {
              const val = e.target.value;
              handleChange("bodyweight", val === "" ? "" : parseFloat(val));
            }}
            className="w-full h-[44px] px-3.5 rounded-lg bg-[var(--color-iron-800)] border border-[var(--color-steel-border)] text-white font-mono text-base placeholder:text-[var(--color-chalk-dim)] hover:border-[var(--color-steel-muted)] hover:bg-[#1f242d] focus:outline-none focus:border-white focus:bg-[var(--color-iron-800)] focus:ring-1 focus:ring-white/20 transition-all duration-150"
          />
        </div>
      </div>

      {/* The Big 3 Lifts */}
      <div className="flex flex-col gap-4 border-t border-[var(--color-steel-border)] pt-4 animate-enter delay-150">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold">
            Max Single Lifts (1RM)
          </span>
          <div className="font-mono text-xs text-[var(--color-chalk-muted)]">
            Total:{" "}
            {currentTotal > 0 ? (
              <strong className="text-white text-sm">{currentTotal.toFixed(1)} kg</strong>
            ) : (
              <span className="text-[var(--color-chalk-dim)] font-mono text-xs">— kg</span>
            )}
          </div>
        </div>

        {/* Squat Field */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] hover:border-[var(--color-plate-red)]/50 transition-colors duration-150 group animate-enter delay-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-plate-red)] shadow-[0_0_8px_rgba(239,68,68,0.4)]" aria-hidden="true" />
              <label htmlFor="input-squat" className="font-mono text-xs uppercase tracking-wider text-white font-semibold cursor-pointer">
                Squat
              </label>
            </div>
            <div className="flex items-center gap-1">
              {[2.5, 5, 10].map((inc) => (
                <button
                  key={`sq-${inc}`}
                  type="button"
                  onClick={() => handleIncrement("squat", inc)}
                  className="relative touch-manipulation before:absolute before:-inset-1 before:content-[''] px-2 py-0.5 rounded bg-[var(--color-iron-800)] hover:bg-[var(--color-plate-red)] hover:text-white hover:border-transparent text-white font-mono text-[10px] border border-[var(--color-steel-border)] cursor-pointer transition-all duration-150 active:scale-95"
                >
                  +{inc}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              id="input-squat"
              name="squat"
              type="number"
              min={20}
              max={700}
              step={2.5}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={formState.squat}
              onChange={(e) => {
                const val = e.target.value;
                handleChange("squat", val === "" ? "" : parseFloat(val));
              }}
              className="w-full h-[44px] px-3.5 rounded-lg bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] text-white font-mono text-base placeholder:text-[var(--color-chalk-dim)] hover:border-[var(--color-plate-red)]/70 hover:bg-[#14171d] focus:outline-none focus:border-[var(--color-plate-red)] focus:ring-1 focus:ring-[var(--color-plate-red)]/30 transition-all duration-150 pr-10"
            />
            {recentIncrement?.lift === "squat" && (
              <span
                key={recentIncrement.id}
                className="badge-float-up absolute right-12 top-1/2 pointer-events-none font-mono text-[11px] font-bold text-[var(--color-plate-red)] bg-[var(--color-iron-950)]/90 px-1.5 py-0.5 rounded border border-[var(--color-plate-red)]/50 shadow-sm"
              >
                +{recentIncrement.delta}
              </span>
            )}
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--color-chalk-dim)]">
              KG
            </span>
          </div>
        </div>

        {/* Bench Press Field */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] hover:border-[var(--color-plate-blue)]/50 transition-colors duration-150 group animate-enter delay-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-plate-blue)] shadow-[0_0_8px_rgba(59,130,246,0.4)]" aria-hidden="true" />
              <label htmlFor="input-bench" className="font-mono text-xs uppercase tracking-wider text-white font-semibold cursor-pointer">
                Bench Press
              </label>
            </div>
            <div className="flex items-center gap-1">
              {[2.5, 5, 10].map((inc) => (
                <button
                  key={`bp-${inc}`}
                  type="button"
                  onClick={() => handleIncrement("bench", inc)}
                  className="relative touch-manipulation before:absolute before:-inset-1 before:content-[''] px-2 py-0.5 rounded bg-[var(--color-iron-800)] hover:bg-[var(--color-plate-blue)] hover:text-white hover:border-transparent text-white font-mono text-[10px] border border-[var(--color-steel-border)] cursor-pointer transition-all duration-150 active:scale-95"
                >
                  +{inc}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              id="input-bench"
              name="bench"
              type="number"
              min={20}
              max={500}
              step={2.5}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={formState.bench}
              onChange={(e) => {
                const val = e.target.value;
                handleChange("bench", val === "" ? "" : parseFloat(val));
              }}
              className="w-full h-[44px] px-3.5 rounded-lg bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] text-white font-mono text-base placeholder:text-[var(--color-chalk-dim)] hover:border-[var(--color-plate-blue)]/70 hover:bg-[#14171d] focus:outline-none focus:border-[var(--color-plate-blue)] focus:ring-1 focus:ring-[var(--color-plate-blue)]/30 transition-all duration-150 pr-10"
            />
            {recentIncrement?.lift === "bench" && (
              <span
                key={recentIncrement.id}
                className="badge-float-up absolute right-12 top-1/2 pointer-events-none font-mono text-[11px] font-bold text-[var(--color-plate-blue)] bg-[var(--color-iron-950)]/90 px-1.5 py-0.5 rounded border border-[var(--color-plate-blue)]/50 shadow-sm"
              >
                +{recentIncrement.delta}
              </span>
            )}
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--color-chalk-dim)]">
              KG
            </span>
          </div>
        </div>

        {/* Deadlift Field */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)] hover:border-[var(--color-plate-amber)]/50 transition-colors duration-150 group animate-enter delay-250">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-plate-amber)] shadow-[0_0_8px_rgba(245,158,11,0.4)]" aria-hidden="true" />
              <label htmlFor="input-deadlift" className="font-mono text-xs uppercase tracking-wider text-white font-semibold cursor-pointer">
                Deadlift
              </label>
            </div>
            <div className="flex items-center gap-1">
              {[2.5, 5, 10].map((inc) => (
                <button
                  key={`dl-${inc}`}
                  type="button"
                  onClick={() => handleIncrement("deadlift", inc)}
                  className="relative touch-manipulation before:absolute before:-inset-1 before:content-[''] px-2 py-0.5 rounded bg-[var(--color-iron-800)] hover:bg-[var(--color-plate-amber)] hover:text-black hover:border-transparent text-white font-mono text-[10px] border border-[var(--color-steel-border)] cursor-pointer transition-all duration-150 active:scale-95"
                >
                  +{inc}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              id="input-deadlift"
              name="deadlift"
              type="number"
              min={20}
              max={700}
              step={2.5}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={formState.deadlift}
              onChange={(e) => {
                const val = e.target.value;
                handleChange("deadlift", val === "" ? "" : parseFloat(val));
              }}
              className="w-full h-[44px] px-3.5 rounded-lg bg-[var(--color-iron-900)] border border-[var(--color-steel-border)] text-white font-mono text-base placeholder:text-[var(--color-chalk-dim)] hover:border-[var(--color-plate-amber)]/70 hover:bg-[#14171d] focus:outline-none focus:border-[var(--color-plate-amber)] focus:ring-1 focus:ring-[var(--color-plate-amber)]/30 transition-all duration-150 pr-10"
            />
            {recentIncrement?.lift === "deadlift" && (
              <span
                key={recentIncrement.id}
                className="badge-float-up absolute right-12 top-1/2 pointer-events-none font-mono text-[11px] font-bold text-[var(--color-plate-amber)] bg-[var(--color-iron-950)]/90 px-1.5 py-0.5 rounded border border-[var(--color-plate-amber)]/50 shadow-sm"
              >
                +{recentIncrement.delta}
              </span>
            )}
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--color-chalk-dim)]">
              KG
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Parameters Accordion */}
      <div className="border-t border-[var(--color-steel-border)] pt-4 animate-enter delay-250">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-left py-1 text-xs font-mono text-[var(--color-chalk-muted)] hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">Competition & Federation Filters</span>
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-2 border-t border-[var(--color-steel-border-light)]">
            {/* Training Age */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="input-training-age" className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)] cursor-pointer">
                Training Age (Years)
              </label>
              <input
                id="input-training-age"
                name="training_age"
                type="number"
                min={0}
                max={40}
                step={0.5}
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 3"
                value={formState.training_age}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange("training_age", val === "" ? "" : parseFloat(val));
                }}
                className="w-full h-[44px] px-3.5 rounded-lg bg-[var(--color-iron-800)] border border-[var(--color-steel-border)] text-white font-mono text-base placeholder:text-[var(--color-chalk-dim)] hover:border-[var(--color-steel-muted)] hover:bg-[#1f242d] focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all duration-150"
              />
            </div>

            {/* Meets so far */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="input-meets" className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)] cursor-pointer">
                Competitions Attended
              </label>
              <input
                id="input-meets"
                name="meets_so_far"
                type="number"
                min={0}
                max={100}
                step={1}
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 1"
                value={formState.meets_so_far}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange("meets_so_far", val === "" ? "" : parseInt(val, 10));
                }}
                className="w-full h-[44px] px-3.5 rounded-lg bg-[var(--color-iron-800)] border border-[var(--color-steel-border)] text-white font-mono text-base placeholder:text-[var(--color-chalk-dim)] hover:border-[var(--color-steel-muted)] hover:bg-[#1f242d] focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all duration-150"
              />
            </div>

            {/* Tested Status Tri-Toggle */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-[var(--color-chalk-muted)] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                Drug-Tested Federation Filter
              </label>
              <div className="relative flex items-center p-1 rounded-lg bg-[var(--color-iron-800)] border border-[var(--color-steel-border)] h-[40px]">
                {/* 3-way floating pill indicator - Tuned to 400ms */}
                <div
                  className={`absolute top-1 bottom-1 w-[calc((100%-8px)/3)] rounded-md bg-white shadow-md pointer-events-none transition-transform duration-[400ms] ease-[cubic-bezier(0.2,0.9,0.3,1)] motion-reduce:transition-none ${
                    formState.tested_status === null
                      ? "translate-x-0"
                      : formState.tested_status === true
                      ? "translate-x-full"
                      : "translate-x-[200%]"
                  }`}
                  style={{ left: "4px" }}
                />
                <button
                  type="button"
                  id="filter-tested-all"
                  onClick={() => handleChange("tested_status", null)}
                  className={`relative z-10 flex-1 h-full rounded-md font-mono text-[11px] font-semibold transition-colors duration-[300ms] cursor-pointer flex items-center justify-center active:scale-[0.98] ${
                    formState.tested_status === null
                      ? "text-black font-bold"
                      : "text-[var(--color-chalk-muted)] hover:text-white"
                  }`}
                >
                  All (100%)
                </button>
                <button
                  type="button"
                  id="filter-tested-yes"
                  onClick={() => handleChange("tested_status", true)}
                  className={`relative z-10 flex-1 h-full rounded-md font-mono text-[11px] font-semibold transition-colors duration-[300ms] cursor-pointer flex items-center justify-center active:scale-[0.98] ${
                    formState.tested_status === true
                      ? "text-black font-bold"
                      : "text-[var(--color-chalk-muted)] hover:text-white"
                  }`}
                >
                  Tested Only
                </button>
                <button
                  type="button"
                  id="filter-tested-no"
                  onClick={() => handleChange("tested_status", false)}
                  className={`relative z-10 flex-1 h-full rounded-md font-mono text-[11px] font-semibold transition-colors duration-[300ms] cursor-pointer flex items-center justify-center active:scale-[0.98] ${
                    formState.tested_status === false
                      ? "text-black font-bold"
                      : "text-[var(--color-chalk-muted)] hover:text-white"
                  }`}
                >
                  Untested Only
                </button>
              </div>
            </div>

            {/* SBD-Only Toggle: Perfectly aligned, non-overflowing switch */}
            <div className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-iron-850)] border border-[var(--color-steel-border)]">
              <div>
                <span className="block font-mono text-xs font-semibold uppercase text-white">
                  Full-Power (SBD Only)
                </span>
                <span className="font-mono text-[11px] text-[var(--color-chalk-dim)]">
                  Excludes single-lift specialists (e.g. 400k+ bench-only competitors)
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formState.sbd_only}
                onClick={() => handleChange("sbd_only", !formState.sbd_only)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white/20 ${formState.sbd_only ? "bg-white" : "bg-[var(--color-iron-800)] ring-1 ring-[var(--color-steel-border)]"
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out ${formState.sbd_only
                    ? "translate-x-5 bg-black"
                    : "translate-x-0 bg-[var(--color-chalk-dim)]"
                    }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button with Ultra-Smooth Industrial Hover & Tactile Press */}
      <button
        type="submit"
        id="btn-calculate"
        disabled={isLoading}
        className="w-full h-12 rounded-xl bg-white text-black font-mono text-xs font-bold tracking-widest uppercase hover:bg-neutral-100 hover:shadow-[0_0_24px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group shadow-lg border border-white animate-enter delay-300"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span>Crunching 1.55M+ Records...</span>
          </>
        ) : (
          <>
            <span>Calculate Benchmark</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
