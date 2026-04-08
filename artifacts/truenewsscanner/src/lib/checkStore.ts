interface CheckResult {
  id: string;
  type: string;
  input: string;
  verdict: string;
  verdictLabel: string;
  riskScore: number;
  confidence: number;
  summary: string;
  signals: unknown[];
  evidence: unknown[];
  nextSteps: unknown[];
  checkedAt: string;
}

let currentResult: CheckResult | null = null;

export function setCheckResult(result: CheckResult) {
  currentResult = result;
}

export function getCheckResult(): CheckResult | null {
  return currentResult;
}
