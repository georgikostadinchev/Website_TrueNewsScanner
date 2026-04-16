export type CheckType = "url" | "phone" | "message" | "news";
export type Verdict = "safe" | "insufficient" | "suspicious" | "misleading" | "scam";

export interface Signal {
  id: string;
  label: string;
  description: string;
  weight: number;
  isRisk: boolean;
}

export interface Evidence {
  source: string;
  finding: string;
  url?: string | null;
}

export interface NextStep {
  action: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface PipelineResult {
  verdict: Verdict;
  verdictLabel: string;
  riskScore: number;
  confidence: number;
  summary: string;
  signals: Signal[];
  evidence: Evidence[];
  nextSteps: NextStep[];
}

export function scoreToVerdict(score: number): Verdict {
  if (score < 20) return "safe";
  if (score < 40) return "insufficient";
  if (score < 60) return "suspicious";
  if (score < 80) return "misleading";
  return "scam";
}

export function verdictToLabel(verdict: Verdict): string {
  const labels: Record<Verdict, string> = {
    safe: "По-скоро безопасно",
    insufficient: "Недостатъчно данни",
    suspicious: "Съмнително",
    misleading: "Подвеждащо / висок риск",
    scam: "Вероятно измама",
  };
  return labels[verdict];
}

export interface RawPipelineResult {
  heuristicScore: number;
  heuristicSignals: Signal[];
  aiScore?: number;
  aiSignals?: Signal[];
  aiAvailable: boolean;
  aiSummary?: string;
  aiEvidence?: Evidence[];
  aiNextSteps?: NextStep[];
  heuristicSummary: string;
  heuristicEvidence: Evidence[];
  heuristicNextSteps: NextStep[];
}
