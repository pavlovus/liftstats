import type { FullAnalysisRequest } from "../types/api";

export interface LifterFormInputs {
  sex: "M" | "F";
  age: number | "";
  bodyweight: number | "";
  squat: number | "";
  bench: number | "";
  deadlift: number | "";
  training_age: number | "";
  meets_so_far: number | "";
  tested_status: boolean | null;
  sbd_only: boolean;
}

export const EMPTY_FORM_STATE: LifterFormInputs = {
  sex: "M",
  age: "",
  bodyweight: "",
  squat: "",
  bench: "",
  deadlift: "",
  training_age: "",
  meets_so_far: "",
  tested_status: null,
  sbd_only: false,
};

export const DEFAULT_LIFTER_STATE: FullAnalysisRequest = {
  sex: "M",
  age: 26,
  bodyweight: 83,
  squat: 180,
  bench: 125,
  deadlift: 220,
  training_age: 3,
  meets_so_far: 1,
  tested_status: null,
  sbd_only: false,
};

export function hasUrlState(search: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search);
  return (
    params.has("bw") ||
    params.has("bodyweight") ||
    params.has("sq") ||
    params.has("squat") ||
    params.has("bp") ||
    params.has("bench") ||
    params.has("dl") ||
    params.has("deadlift")
  );
}

export function parseUrlState(search: string): LifterFormInputs {
  if (!hasUrlState(search)) {
    return { ...EMPTY_FORM_STATE };
  }

  const params = new URLSearchParams(search);

  const sex = (params.get("sex")?.toUpperCase() === "F" ? "F" : "M") as "M" | "F";
  const age = parseFloat(params.get("age") || "");
  const bodyweight = parseFloat(params.get("bw") || params.get("bodyweight") || "");
  const squat = parseFloat(params.get("sq") || params.get("squat") || "");
  const bench = parseFloat(params.get("bp") || params.get("bench") || "");
  const deadlift = parseFloat(params.get("dl") || params.get("deadlift") || "");
  const training_age = parseFloat(params.get("ta") || params.get("training_age") || "");
  const meets_so_far = parseInt(params.get("meets") || params.get("meets_so_far") || "", 10);

  const testedParam = params.get("tested") || params.get("tested_status");
  let tested_status: boolean | null = null;
  if (testedParam === "true") tested_status = true;
  if (testedParam === "false") tested_status = false;

  const sbd_only = params.get("sbd") === "true" || params.get("sbd_only") === "true";

  return {
    sex,
    age: Number.isNaN(age) ? "" : Math.min(Math.max(age, 14), 100),
    bodyweight: Number.isNaN(bodyweight) ? "" : Math.min(Math.max(bodyweight, 30), 250),
    squat: Number.isNaN(squat) ? "" : Math.max(squat, 0),
    bench: Number.isNaN(bench) ? "" : Math.max(bench, 0),
    deadlift: Number.isNaN(deadlift) ? "" : Math.max(deadlift, 0),
    training_age: Number.isNaN(training_age) ? "" : Math.min(Math.max(training_age, 0), 40),
    meets_so_far: Number.isNaN(meets_so_far) ? "" : Math.min(Math.max(meets_so_far, 0), 100),
    tested_status,
    sbd_only,
  };
}

export function toAnalysisRequest(inputs: LifterFormInputs): FullAnalysisRequest {
  const age = typeof inputs.age === "number" ? inputs.age : 26;
  const bodyweight = typeof inputs.bodyweight === "number" ? inputs.bodyweight : 83;
  const squat = typeof inputs.squat === "number" ? inputs.squat : 20;
  const bench = typeof inputs.bench === "number" ? inputs.bench : 20;
  const deadlift = typeof inputs.deadlift === "number" ? inputs.deadlift : 20;
  const training_age = typeof inputs.training_age === "number" ? inputs.training_age : 1;
  const meets_so_far = typeof inputs.meets_so_far === "number" ? inputs.meets_so_far : 0;

  return {
    sex: inputs.sex,
    age: Math.min(Math.max(age, 14), 100),
    bodyweight: Math.min(Math.max(bodyweight, 30), 250),
    squat: Math.min(Math.max(squat, 20), 700),
    bench: Math.min(Math.max(bench, 20), 500),
    deadlift: Math.min(Math.max(deadlift, 20), 700),
    training_age: Math.min(Math.max(training_age, 0), 40),
    meets_so_far: Math.min(Math.max(meets_so_far, 0), 200),
    tested_status: inputs.tested_status,
    sbd_only: inputs.sbd_only,
  };
}

export function buildUrlParams(state: FullAnalysisRequest | LifterFormInputs): string {
  const params = new URLSearchParams();
  if (state.sex) params.set("sex", state.sex);
  if (state.age !== "") params.set("age", state.age.toString());
  if (state.bodyweight !== "") params.set("bw", state.bodyweight.toString());
  if (state.squat !== "") params.set("sq", state.squat.toString());
  if (state.bench !== "") params.set("bp", state.bench.toString());
  if (state.deadlift !== "") params.set("dl", state.deadlift.toString());
  if (state.training_age !== "") params.set("ta", state.training_age.toString());
  if (state.meets_so_far !== "") params.set("meets", state.meets_so_far.toString());
  if (state.tested_status !== null && state.tested_status !== undefined) {
    params.set("tested", state.tested_status ? "true" : "false");
  }
  if (state.sbd_only) {
    params.set("sbd", "true");
  }
  return params.toString();
}
