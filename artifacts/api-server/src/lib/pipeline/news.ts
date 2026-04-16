import { type Signal, type RawPipelineResult, scoreToVerdict } from "./types";
import { aiCheck } from "./ai";

const MISINFORMATION_PATTERNS = [
  { pattern: /учени доказаха|изследвания показват|лекари потвърдиха/i, label: "Неверифицирана научна претенция", desc: "Текстът се позовава на неуточнени изследвания или учени", weight: 0.4 },
  { pattern: /правителството крие|тайно|не искат да знаете/i, label: "Конспиративен наратив", desc: "Текстът съдържа конспиративни твърдения за скрита информация", weight: 0.55 },
  { pattern: /ваксин[аи]|микрочип|5G|хемтрейл/i, label: "Известна дезинформация", desc: "Текстът засяга теми с документирани дезинформационни наративи", weight: 0.5 },
  { pattern: /СПОДЕЛЕТЕ СПЕШНО|разпространете|предупредете всички/i, label: "Вирален призив", desc: "Типична тактика за дезинформация", weight: 0.6 },
];

function runNewsHeuristic(input: string): { score: number; signals: Signal[] } {
  const signals: Signal[] = [];
  let score = 20;

  for (const p of MISINFORMATION_PATTERNS) {
    if (p.pattern.test(input)) {
      score += p.weight * 100;
      signals.push({ id: `risk-${signals.length}`, label: p.label, description: p.desc, weight: p.weight, isRisk: true });
    }
  }

  if (signals.length === 0) {
    signals.push({ id: "no-signals", label: "Неизвестен контекст", description: "Не са открити конкретни дезинформационни шаблони", weight: 0, isRisk: false });
    score = 35;
  }

  return { score: Math.max(0, Math.min(100, score)), signals };
}

function buildSummary(verdict: string): string {
  if (verdict === "safe") return "Анализираният текст не съдържа познати дезинформационни модели.";
  if (verdict === "insufficient") return "Не можем да дадем категорична оценка. Препоръчваме проверка в утвърдени медии.";
  if (verdict === "suspicious") return "Текстът съдържа елементи, характерни за дезинформация.";
  if (verdict === "misleading") return "Текстът показва множество признаци за подвеждащо съдържание.";
  return "Текстът съдържа силни индикатори за умишлена дезинформация.";
}

function buildNextSteps(verdict: string): Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> {
  if (verdict === "safe") return [{ action: "Проверете допълнително", description: "За важна информация, проверете в утвърдени медии", priority: "low" }];
  if (verdict === "insufficient") return [
    { action: "Потърсете в утвърдени медии", description: "Проверете дали БНТ, БНР, или агенция БТА съобщават за същото", priority: "medium" },
    { action: "Посетете factcheck.bg", description: "Factcheck.bg е български ресурс за проверка на новини", priority: "medium" },
  ];
  if (verdict === "suspicious" || verdict === "misleading") return [
    { action: "Не споделяйте", description: "Разпространението на дезинформация вреди", priority: "high" },
    { action: "Проверете в официални медии", description: "Потърсете темата в БНТ, БТА, или надеждни новинарски издания", priority: "high" },
    { action: "Докладвайте дезинформация", description: "Помогнете ни да предотвратим разпространението", priority: "medium" },
  ];
  return [
    { action: "Не споделяйте!", description: "Разпространението на умишлена дезинформация е опасно", priority: "high" },
    { action: "Предупредете споделящите", description: "Ако приятели споделят тази новина, уведомете ги за риска", priority: "high" },
    { action: "Докладвайте дезинформацията", description: "Подайте доклад до нас и до medialiteracy.eu", priority: "medium" },
  ];
}

export async function checkNews(input: string): Promise<RawPipelineResult> {
  const { score: hScore, signals: hSignals } = runNewsHeuristic(input);
  const hVerdict = scoreToVerdict(hScore);

  let aiScore: number | undefined;
  let aiSignals: Signal[] | undefined;
  let aiSummary: string | undefined;
  let aiEvidence: Array<{ source: string; finding: string; url: string | null }> | undefined;
  let aiNextSteps: Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> | undefined;
  let aiAvailable = false;

  try {
    const ai = await aiCheck("news", input);
    aiScore = ai.riskScore;
    aiSignals = ai.signals;
    aiSummary = ai.summary;
    aiEvidence = ai.evidence;
    aiNextSteps = ai.nextSteps;
    aiAvailable = true;
  } catch {
    // AI unavailable — fall back to heuristic-only scoring
  }

  return {
    heuristicScore: hScore,
    heuristicSignals: hSignals,
    aiScore,
    aiSignals,
    aiAvailable,
    aiSummary,
    aiEvidence,
    aiNextSteps,
    heuristicSummary: buildSummary(hVerdict),
    heuristicEvidence: [{ source: "Текстов анализ", finding: `Анализирани са ${hSignals.length} характеристики`, url: null }],
    heuristicNextSteps: buildNextSteps(hVerdict),
  };
}
