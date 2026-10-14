import type { FullAnalysisResponse } from "../../types/api";
import { ArchetypeRatioBar } from "../visual/ArchetypeRatioBar";

interface ArchetypeTabProps {
  response: FullAnalysisResponse;
}

export function ArchetypeTab({ response }: ArchetypeTabProps) {
  const { archetype } = response;

  return (
    <div className="flex flex-col gap-6">
      {/* Kinetic Ratio Bar & Archetype Centroid */}
      <ArchetypeRatioBar archetype={archetype} />
    </div>
  );
}
