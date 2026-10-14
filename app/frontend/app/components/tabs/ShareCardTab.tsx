import type { FullAnalysisRequest, FullAnalysisResponse } from "../../types/api";
import { SharePlaque } from "../visual/SharePlaque";

interface ShareCardTabProps {
  request: FullAnalysisRequest;
  response: FullAnalysisResponse;
}

export function ShareCardTab({ request, response }: ShareCardTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <SharePlaque request={request} response={response} />
    </div>
  );
}
