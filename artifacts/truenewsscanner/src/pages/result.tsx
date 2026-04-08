import { Link } from "wouter";
import { ShieldCheck, HelpCircle, AlertTriangle, AlertOctagon, XCircle, ArrowLeft, Flag, Info } from "lucide-react";
import { getCheckResult } from "@/lib/checkStore";
import { Button } from "@/components/ui/button";
import { CHECK_TYPE_LABELS, VERDICT_CONFIG, getRiskBarColor, getRiskColor } from "@/lib/verdicts";

type Verdict = "safe" | "insufficient" | "suspicious" | "misleading" | "scam";

interface Signal {
  id: string;
  label: string;
  description: string;
  weight: number;
  isRisk: boolean;
}

interface Evidence {
  source: string;
  finding: string;
  url?: string | null;
}

interface NextStep {
  action: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface CheckResult {
  id: string;
  type: string;
  input: string;
  verdict: Verdict;
  verdictLabel: string;
  riskScore: number;
  confidence: number;
  summary: string;
  signals: Signal[];
  evidence: Evidence[];
  nextSteps: NextStep[];
  checkedAt: string;
}

const VERDICT_ICONS: Record<Verdict, React.ComponentType<{ className?: string }>> = {
  safe: ShieldCheck,
  insufficient: HelpCircle,
  suspicious: AlertTriangle,
  misleading: AlertOctagon,
  scam: XCircle,
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 border-red-200 dark:bg-red-950/30 dark:border-red-800",
  medium: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800",
  low: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "Важно",
  medium: "Препоръчително",
  low: "Незадължително",
};

export default function ResultPage() {
  const state = getCheckResult() as CheckResult | null;

  if (!state) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground text-lg mb-6">Няма резултат за показване.</p>
        <Link href="/">
          <Button data-testid="button-back-home">Върни се назад</Button>
        </Link>
      </div>
    );
  }

  const result = state;
  const config = VERDICT_CONFIG[result.verdict] ?? VERDICT_CONFIG.insufficient;
  const VerdictIcon = VERDICT_ICONS[result.verdict] ?? HelpCircle;
  const riskBarColor = getRiskBarColor(result.riskScore);
  const riskTextColor = getRiskColor(result.riskScore);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* What was checked */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
        </Link>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{CHECK_TYPE_LABELS[result.type] ?? result.type}</span>
        </div>
      </div>

      {/* Checked content */}
      <div className="bg-muted/50 border border-border rounded-lg px-4 py-3">
        <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Провереното съдържание</p>
        <p className="text-sm font-mono break-all text-foreground" data-testid="text-checked-input">{result.input}</p>
      </div>

      {/* Verdict badge */}
      <div className={`rounded-xl border-2 p-6 ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full bg-white/50 dark:bg-black/20`}>
            <VerdictIcon className={`w-8 h-8 ${config.textColor}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Оценка</p>
            <h2 className={`text-2xl font-bold ${config.textColor}`} data-testid="text-verdict-label">
              {result.verdictLabel}
            </h2>
          </div>
        </div>
      </div>

      {/* Risk meter + confidence */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Рискова оценка</p>
          <p className={`text-3xl font-bold mb-2 ${riskTextColor}`} data-testid="text-risk-score">{result.riskScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${riskBarColor}`}
              style={{ width: `${result.riskScore}%` }}
              data-testid="bar-risk"
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Безопасно</span>
            <span>Измама</span>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Увереност</p>
          <p className="text-3xl font-bold mb-2 text-foreground" data-testid="text-confidence">{result.confidence}<span className="text-sm font-normal text-muted-foreground">%</span></p>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-primary transition-all duration-700"
              style={{ width: `${result.confidence}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Базирана на налични данни</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Обяснение</h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed" data-testid="text-summary">{result.summary}</p>
      </div>

      {/* Signals */}
      {result.signals.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Открити сигнали</h3>
          <div className="space-y-3">
            {result.signals.map((signal) => (
              <div key={signal.id} className="flex items-start gap-3" data-testid={`signal-${signal.id}`}>
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  signal.isRisk ? "bg-red-100 dark:bg-red-900/40" : "bg-green-100 dark:bg-green-900/40"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${signal.isRisk ? "bg-red-500" : "bg-green-500"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{signal.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{signal.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence */}
      {result.evidence.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Доказателствена база</h3>
          <div className="space-y-3">
            {result.evidence.map((ev, i) => (
              <div key={i} className="border border-border rounded-lg p-3" data-testid={`evidence-${i}`}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{ev.source}</p>
                <p className="text-sm text-foreground">{ev.finding}</p>
                {ev.url && (
                  <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                    Виж източника
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next steps */}
      {result.nextSteps.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Какво да направите?</h3>
          <div className="space-y-3">
            {result.nextSteps.map((step, i) => (
              <div key={i} className={`border rounded-lg p-4 ${PRIORITY_COLORS[step.priority]}`} data-testid={`next-step-${i}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-foreground">{step.action}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[step.priority]}`}>
                    {PRIORITY_LABEL[step.priority]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-4">
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full gap-2" data-testid="button-check-new">
            Провери ново
          </Button>
        </Link>
        <Link href={`/report?content=${encodeURIComponent(result.input)}&type=${result.type}`} className="flex-1">
          <Button variant="destructive" className="w-full gap-2" data-testid="button-report">
            <Flag className="w-4 h-4" />
            Докладвай
          </Button>
        </Link>
      </div>
    </div>
  );
}
