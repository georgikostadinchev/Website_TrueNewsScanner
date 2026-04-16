import { type Signal, type Verdict, scoreToVerdict, verdictToLabel } from "../pipeline/types";

export const TRUSTED_DOMAINS = [
  "gov.bg",
  "bnb.bg",
  "nap.bg",
  "nsi.bg",
  "mvr.bg",
  "lex.bg",
  "bta.bg",
  "bnr.bg",
  "bntnews.bg",
];

export function normalizeForMatch(type: string, value: string): string {
  if (type === "phone") {
    return value.replace(/[\s\-\(\)\+]/g, "");
  }
  if (type === "url") {
    try {
      const u = new URL(value.trim().toLowerCase());
      const path = u.pathname.replace(/\/+$/, "") || "/";
      return u.hostname + path;
    } catch {
      return value.trim().toLowerCase();
    }
  }
  return value.trim();
}

export function isAllowlisted(type: string, value: string): boolean {
  if (type !== "url") return false;
  try {
    const hostname = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    return TRUSTED_DOMAINS.some((d) => hostname === d || hostname.endsWith("." + d));
  } catch {
    return false;
  }
}

export interface CommunityData {
  reviewedScam: number;
  pending: number;
  dismissed: number;
}

export interface ScoringInput {
  heuristicScore: number;
  heuristicSignals: Signal[];
  aiScore?: number;
  aiSignals?: Signal[];
  aiAvailable: boolean;
  community: CommunityData;
  exactMatchReviewed: boolean;
  isAllowlisted: boolean;
}

export interface ScoringOutput {
  riskScore: number;
  confidence: number;
  verdict: Verdict;
  verdictLabel: string;
  scoringSignals: Signal[];
}

export function computeScore(input: ScoringInput): ScoringOutput {
  const scoringSignals: Signal[] = [];

  // 1. Merge heuristic and AI into base score
  // AI is advisory (50%) when available, otherwise heuristic is sole source
  let baseScore: number;
  if (input.aiAvailable && input.aiScore !== undefined) {
    baseScore = input.aiScore * 0.5 + input.heuristicScore * 0.5;
  } else {
    baseScore = input.heuristicScore;
  }

  let adjustment = 0;

  // 2. Community report adjustments
  const { reviewedScam, pending, dismissed } = input.community;

  if (reviewedScam > 0) {
    const adj = Math.min(35, reviewedScam * 15);
    adjustment += adj;
    scoringSignals.push({
      id: "community-scam-reports",
      label: `${reviewedScam} потвърден${reviewedScam === 1 ? "" : "и"} доклад${reviewedScam === 1 ? "" : "а"} за измама`,
      description: "Проверени от екипа ни доклади сигнализират за измамна дейност с тази цел",
      weight: adj / 100,
      isRisk: true,
    });
  }

  if (pending > 0) {
    const adj = Math.min(10, pending * 3);
    adjustment += adj;
    scoringSignals.push({
      id: "community-pending-reports",
      label: `${pending} доклад${pending === 1 ? "" : "а"} в изчакване`,
      description: "Постъпили са сигнали за тази цел, все още в процес на проверка от екипа ни",
      weight: adj / 100,
      isRisk: true,
    });
  }

  if (dismissed > 0) {
    const adj = Math.min(15, dismissed * 5);
    adjustment -= adj;
  }

  // 3. Exact match in reviewed reports: strong risk signal
  if (input.exactMatchReviewed) {
    adjustment += 25;
    scoringSignals.push({
      id: "exact-match-reviewed",
      label: "Точно съвпадение в потвърдени доклади",
      description: "Открито е точно съвпадение в нашата база с потвърдени измами",
      weight: 0.25,
      isRisk: true,
    });
  }

  // 4. Trusted allowlist: minor risk reduction, never forces safe
  if (input.isAllowlisted) {
    adjustment -= 10;
    scoringSignals.push({
      id: "trusted-allowlist",
      label: "Доверен официален домейн",
      description: "Домейнът е в списъка на доверени български институции и медии",
      weight: -0.1,
      isRisk: false,
    });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(baseScore + adjustment)));

  // 5. Dynamic confidence
  let confidence = 50;

  if (input.aiAvailable) confidence += 20;

  const meaningfulHeuristicSignals = input.heuristicSignals.filter((s) => s.weight !== 0).length;
  if (meaningfulHeuristicSignals >= 2) confidence += 10;
  else if (meaningfulHeuristicSignals === 1) confidence += 5;

  if (input.aiAvailable && input.aiScore !== undefined) {
    const diff = Math.abs(input.aiScore - input.heuristicScore);
    if (diff <= 20) confidence += 10;
    else if (diff > 40) confidence -= 15;
  }

  if (input.community.reviewedScam > 0) confidence += 15;
  if (input.exactMatchReviewed) confidence += 10;
  if (input.isAllowlisted) confidence += 5;
  if (input.community.pending > 0 && input.community.reviewedScam === 0) confidence -= 5;

  confidence = Math.max(20, Math.min(95, confidence));

  const verdict = scoreToVerdict(finalScore);

  return {
    riskScore: finalScore,
    confidence,
    verdict,
    verdictLabel: verdictToLabel(verdict),
    scoringSignals,
  };
}
