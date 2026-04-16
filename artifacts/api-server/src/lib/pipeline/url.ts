import { type Signal, type RawPipelineResult, scoreToVerdict } from "./types";
import { aiCheck } from "./ai";

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const KNOWN_SCAM_PATTERNS = [
  { pattern: /win|prize|lottery|lucky/i, label: "Измамни ключови думи", desc: "URL съдържа думи, типични за измамни схеми за печалба", weight: 0.6 },
  { pattern: /click-here|free-money|urgent/i, label: "Спешен призив за действие", desc: "URL съдържа фрази за спешно кликване", weight: 0.5 },
  { pattern: /login|signin|account.*verify/i, label: "Фишинг индикатор", desc: "URL изглежда като страница за верификация на акаунт", weight: 0.7 },
  { pattern: /\.ru$|\.xyz$|\.tk$|\.ml$|\.ga$|\.cf$/i, label: "Рисков домейн", desc: "Домейнът е регистриран в юрисдикция с висок риск от измами", weight: 0.4 },
  { pattern: /bit\.ly|tinyurl|t\.co|shorturl/i, label: "Скъсен URL", desc: "URL е скъсен, което може да прикрива реалната дестинация", weight: 0.2 },
];

const SAFE_INDICATORS = [
  { pattern: /^https:/i, label: "HTTPS криптиране", desc: "URL използва сигурен HTTPS протокол", weight: -0.2 },
  { pattern: /gov\.bg$|\.bg$|\.edu\./i, label: "Надежден домейн", desc: "Домейнът е от надеждна категория (.gov.bg, .bg, .edu)", weight: -0.3 },
];

function runUrlHeuristic(input: string): { score: number; signals: Signal[] } {
  const signals: Signal[] = [];
  let score = 15;

  for (const p of KNOWN_SCAM_PATTERNS) {
    if (p.pattern.test(input)) {
      score += p.weight * 100;
      signals.push({ id: `risk-${signals.length}`, label: p.label, description: p.desc, weight: p.weight, isRisk: true });
    }
  }

  for (const p of SAFE_INDICATORS) {
    if (p.pattern.test(input)) {
      score += p.weight * 100;
      signals.push({ id: `safe-${signals.length}`, label: p.label, description: p.desc, weight: p.weight, isRisk: false });
    }
  }

  if (signals.length === 0) {
    signals.push({ id: "no-signals", label: "Няма разпознати сигнали", description: "Не са открити явни рискови сигнали за този URL", weight: 0, isRisk: false });
    score = 30;
  }

  return { score: Math.max(0, Math.min(100, score)), signals };
}

function buildSummary(verdict: string, domain: string): string {
  if (verdict === "safe") return `Проверката на "${domain}" не откри явни признаци на измама или злонамерено съдържание.`;
  if (verdict === "insufficient") return `За "${domain}" няма достатъчно данни за категорична оценка. Препоръчваме допълнителна проверка.`;
  if (verdict === "suspicious") return `Открити са съмнителни характеристики при "${domain}". Препоръчваме внимание.`;
  if (verdict === "misleading") return `"${domain}" показва сериозни признаци на подвеждащо или рисково съдържание.`;
  return `"${domain}" вероятно е измамно. Силно препоръчваме да не взаимодействате.`;
}

function buildNextSteps(verdict: string): Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> {
  if (verdict === "safe") return [
    { action: "Продължете с внимание", description: "Не са открити явни заплахи, но проверявайте преди да споделяте лична информация", priority: "low" },
  ];
  if (verdict === "insufficient") return [
    { action: "Потърсете допълнителна информация", description: "Проверете дали познавате изпращача", priority: "medium" },
    { action: "Не споделяйте лични данни", description: "Въздържайте се от въвеждане на пароли или лична информация", priority: "medium" },
  ];
  if (verdict === "suspicious") return [
    { action: "Не кликвайте върху линкове", description: "Избягвайте взаимодействие с тази страница", priority: "high" },
    { action: "Предупредете близки", description: "Ако сте получили това в съобщение, предупредете изпращача", priority: "medium" },
    { action: "Докладвайте", description: "Помогнете ни да защитим общността", priority: "medium" },
  ];
  return [
    { action: "Не взаимодействайте!", description: "Не кликвайте, не въвеждайте данни, не споделяйте с близки", priority: "high" },
    { action: "Докладвайте незабавно", description: "Докладвайте на нашия екип и на CERT Bulgaria (cert@comsoc.bg)", priority: "high" },
    { action: "Ако сте засегнати, действайте бързо", description: "Свържете се с банката си и сменете паролите при нужда", priority: "high" },
  ];
}

export async function checkUrl(input: string): Promise<RawPipelineResult> {
  const { score: hScore, signals: hSignals } = runUrlHeuristic(input);
  const domain = extractDomain(input);
  const hVerdict = scoreToVerdict(hScore);

  let aiScore: number | undefined;
  let aiSignals: Signal[] | undefined;
  let aiSummary: string | undefined;
  let aiEvidence: Array<{ source: string; finding: string; url: string | null }> | undefined;
  let aiNextSteps: Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> | undefined;
  let aiAvailable = false;

  try {
    const ai = await aiCheck("url", input);
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
    heuristicSummary: buildSummary(hVerdict, domain),
    heuristicEvidence: [{ source: "Анализ на структурата на URL", finding: `Домейнът "${domain}" е анализиран за структурни рискове.`, url: null }],
    heuristicNextSteps: buildNextSteps(hVerdict),
  };
}
