import { Link } from "wouter";
import { ShieldCheck, HelpCircle, AlertTriangle, AlertOctagon, XCircle, ArrowLeft, Flag, Info, Check, ShieldAlert, ChevronRight } from "lucide-react";
import { getCheckResult } from "@/lib/checkStore";
import { Button } from "@/components/ui/button";
import { CHECK_TYPE_LABELS, VERDICT_CONFIG } from "@/lib/verdicts";
import { motion } from "framer-motion";

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
  suspicious: ShieldAlert,
  misleading: AlertOctagon,
  scam: XCircle,
};

const VERDICT_STYLES: Record<Verdict, { bg: string, text: string, border: string, gradient: string }> = {
  safe: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", gradient: "risk-gradient-safe" },
  insufficient: { bg: "bg-slate-50 dark:bg-slate-900/50", text: "text-slate-700 dark:text-slate-400", border: "border-slate-200 dark:border-slate-800", gradient: "" },
  suspicious: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", gradient: "risk-gradient-warning" },
  misleading: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800", gradient: "risk-gradient-warning" },
  scam: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800", gradient: "risk-gradient-danger" },
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "Незабавно действие",
  medium: "Препоръчително",
  low: "По желание",
};

export default function ResultPage() {
  const state = getCheckResult() as CheckResult | null;

  if (!state) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 text-center">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Няма активна проверка</h2>
        <p className="text-muted-foreground font-medium mb-8">Моля, стартирайте нова проверка от началната страница.</p>
        <Link href="/">
          <Button size="lg" className="font-bold rounded-full px-8" data-testid="button-back-home">
            Начална страница
          </Button>
        </Link>
      </div>
    );
  }

  const result = state;
  const styles = VERDICT_STYLES[result.verdict] ?? VERDICT_STYLES.insufficient;
  const VerdictIcon = VERDICT_ICONS[result.verdict] ?? HelpCircle;
  
  // Risk color interpolation for the score
  const getRiskColorClass = (score: number) => {
    if (score < 30) return "text-emerald-600 dark:text-emerald-400";
    if (score < 70) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };
  
  const getRiskBgClass = (score: number) => {
    if (score < 30) return "bg-emerald-500";
    if (score < 70) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="gap-2 font-bold text-muted-foreground hover:text-foreground" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
            Нова проверка
          </Button>
        </Link>
        <div className="bg-muted px-4 py-1.5 rounded-full text-sm font-bold text-muted-foreground border border-border flex items-center gap-2">
          {CHECK_TYPE_LABELS[result.type] ?? result.type}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* Main Verdict Card */}
        <div className={`md:col-span-8 rounded-3xl border ${styles.border} ${styles.bg} p-8 relative overflow-hidden shadow-lg`}>
          <div className={`absolute inset-0 ${styles.gradient} opacity-50 pointer-events-none`} />
          <div className="relative z-10">
            <div className="flex items-start gap-6 mb-8">
              <div className={`p-4 rounded-2xl bg-background border ${styles.border} shadow-sm shrink-0`}>
                <VerdictIcon className={`w-12 h-12 ${styles.text}`} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1" style={{ color: "inherit" }}>Окончателна оценка</p>
                <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight ${styles.text}`} data-testid="text-verdict-label">
                  {result.verdictLabel}
                </h1>
              </div>
            </div>
            
            <div className="bg-background/60 backdrop-blur-md rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Info className={`w-5 h-5 ${styles.text}`} />
                <h3 className="font-bold text-foreground">Какво означава това?</h3>
              </div>
              <p className="text-foreground/90 font-medium leading-relaxed text-lg" data-testid="text-summary">
                {result.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Scores Sidebar */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-md flex-1 flex flex-col justify-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 text-center">Рисков индекс</p>
            <div className="flex items-baseline justify-center mb-4">
              <span className={`text-6xl font-extrabold tracking-tighter ${getRiskColorClass(result.riskScore)}`} data-testid="text-risk-score">
                {result.riskScore}
              </span>
              <span className="text-xl font-bold text-muted-foreground ml-1">/100</span>
            </div>
            
            <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.riskScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`absolute top-0 left-0 h-full rounded-full ${getRiskBgClass(result.riskScore)}`}
                data-testid="bar-risk"
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Безопасно</span>
              <span>Критично</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Увереност на модела</p>
              <span className="text-lg font-extrabold text-foreground" data-testid="text-confidence">{result.confidence}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence}%` }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Target Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6 shadow-sm"
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <ArrowRight className="w-4 h-4" /> Анализирано съдържание
        </p>
        <div className="bg-muted/50 rounded-xl p-4 font-mono text-sm break-all text-foreground/80 border border-border/50" data-testid="text-checked-input">
          {result.input}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Next Steps */}
        {result.nextSteps.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Check className="w-6 h-6 text-primary" /> Препоръчани действия
            </h3>
            <div className="space-y-3">
              {result.nextSteps.map((step, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm" data-testid={`next-step-${i}`}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="font-bold text-foreground text-lg leading-tight">{step.action}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${PRIORITY_BADGE[step.priority]}`}>
                      {PRIORITY_LABEL[step.priority]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Signals Breakdown */}
        {result.signals.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" /> Детайлен анализ
            </h3>
            <div className="bg-card border border-border rounded-2xl p-2 shadow-sm">
              {result.signals.map((signal, i) => (
                <div key={signal.id} className={`flex items-start gap-4 p-4 ${i !== result.signals.length - 1 ? 'border-b border-border/50' : ''}`} data-testid={`signal-${signal.id}`}>
                  <div className={`mt-1 shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${
                    signal.isRisk ? "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                  }`}>
                    {signal.isRisk ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{signal.label}</p>
                    <p className="text-sm font-medium text-muted-foreground mt-1">{signal.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 pt-8 pb-12 mt-8 border-t border-border"
      >
        <Link href={`/report?content=${encodeURIComponent(result.input)}&type=${result.type}`} className="flex-1">
          <Button variant="outline" className="w-full h-14 text-base font-bold rounded-xl gap-2 border-border hover:bg-muted" data-testid="button-report">
            <Flag className="w-5 h-5 text-muted-foreground" />
            Докладвай като грешка
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

// Ensure these imports are present for the icons
import { ArrowRight, Activity, CheckCircle } from "lucide-react";