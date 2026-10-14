export type SexType = "M" | "F";
export type LiftType = "squat" | "bench" | "deadlift" | "total";

export interface DistributionBin {
  weight: number;
  count: number;
}

export interface PercentileResponse {
  lift_type: LiftType;
  user_weight: number;
  percentile: number | null;
  population_size: number;
  median_lift: number | null;
  max_lift: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  bins: DistributionBin[];
  error?: string | null;
}

export interface ToggleView {
  n: number;
  percentile: number | null;
}

export interface TestedToggleData {
  lift: string;
  value: number;
  age_bracket: string;
  weight_class: string;
  views: Record<string, ToggleView>;
  explainer: string;
}

export interface ArchetypeResponse {
  label: string;
  user_shares: number[];
  cluster_shares: number[];
  all_clusters: Record<string, number[]>;
  toggle: TestedToggleData;
}

export interface ScorePercentileView {
  score: number;
  percentile: number | null;
  n: number;
}

export interface ProgressionResponse {
  total: number;
  point: number;
  lo: number;
  hi: number;
  views: Record<string, ScorePercentileView>;
  explainer: string;
}

export interface FullAnalysisRequest {
  sex: SexType;
  age: number;
  bodyweight: number;
  squat: number;
  bench: number;
  deadlift: number;
  training_age: number;
  meets_so_far: number;
  tested_status?: boolean | null;
  sbd_only: boolean;
}

export interface FullAnalysisResponse {
  total: number;
  percentiles: Record<string, PercentileResponse>;
  archetype: ArchetypeResponse;
  progression: ProgressionResponse;
}
