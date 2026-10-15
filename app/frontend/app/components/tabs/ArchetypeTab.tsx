import type { FullAnalysisResponse } from "../../types/api";
import { ArchetypeRatioBar } from "../visual/ArchetypeRatioBar";
import { ArchetypeComparisonTable } from "../visual/ArchetypeComparisonTable";

interface ArchetypeTabProps {
  response: FullAnalysisResponse;
}

export function ArchetypeTab({ response }: ArchetypeTabProps) {
  const { archetype } = response;

  return (
    <div className="flex flex-col gap-6 view-enter">
      {/* Kinetic Ratio Bar & Archetype Centroid */}
      <ArchetypeRatioBar archetype={archetype} />

      {/* Comparative Matrix across all 3 demographic clusters */}
      <ArchetypeComparisonTable archetype={archetype} />
    </div>
  );
}

