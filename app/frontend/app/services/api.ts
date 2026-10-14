import type { FullAnalysisRequest, FullAnalysisResponse } from "../types/api";

const API_BASE = "/api";

export async function fetchFullAnalysis(
  payload: FullAnalysisRequest
): Promise<FullAnalysisResponse> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData.detail?.[0]?.msg ||
      errorData.detail ||
      `Analysis calculation failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
