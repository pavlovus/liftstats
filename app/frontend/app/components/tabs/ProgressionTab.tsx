import type { FullAnalysisResponse } from "../../types/api";
import { ProgressionRange } from "../visual/ProgressionRange";

interface ProgressionTabProps {
  response: FullAnalysisResponse;
}

export function ProgressionTab({ response }: ProgressionTabProps) {
  const { progression } = response;

  return (
    <div className="flex flex-col gap-6">
      {/* Core 12-Month Progression Horizon Gauge */}
      <ProgressionRange progression={progression} />
    </div>
  );
}
