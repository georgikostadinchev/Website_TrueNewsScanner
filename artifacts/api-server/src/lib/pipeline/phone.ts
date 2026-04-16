import { type Signal, type Evidence, type RawPipelineResult, scoreToVerdict } from "./types";
import { aiCheck } from "./ai";

const BG_SCAM_PREFIXES = [
  { prefix: "+359700", label: "Премиум номер", desc: "Номерът е от платена категория (0700), разговорите могат да бъдат скъпи", weight: 0.3 },
  { prefix: "+359900", label: "Номер с висока тарифа", desc: "Номерът е от категория с висока тарифа (0900)", weight: 0.4 },
];

function runPhoneHeuristic(input: string): { score: number; signals: Signal[] } {
  const signals: Signal[] = [];
  let score = 20;

  const normalized = input.replace(/[\s\-\(\)]/g, "");

  for (const p of BG_SCAM_PREFIXES) {
    if (normalized.startsWith(p.prefix)) {
      score += p.weight * 100;
      signals.push({ id: `risk-${signals.length}`, label: p.label, description: p.desc, weight: p.weight, isRisk: true });
    }
  }

  if (/^\+359[87]\d{8}$/.test(normalized)) {
    score -= 15;
    signals.push({ id: "bg-mobile", label: "Валиден български мобилен номер", description: "Форматът съответства на стандартен български мобилен номер", weight: -0.15, isRisk: false });
  }

  if (signals.length === 0) {
    signals.push({ id: "no-signals", label: "Неизвестен номер", description: "Нямаме информация за този номер", weight: 0, isRisk: false });
    score = 30;
  }

  return { score: Math.max(0, Math.min(100, score)), signals };
}

function buildSummary(verdict: string, subject: string): string {
  if (verdict === "safe") return `Телефонният номер "${subject}" не показва известни признаци за измама.`;
  if (verdict === "insufficient") return `Нямаме достатъчно данни за "${subject}". Препоръчваме проверка преди отговаряне.`;
  if (verdict === "suspicious") return `Телефонният номер "${subject}" има съмнителни характеристики.`;
  if (verdict === "misleading") return `Телефонният номер "${subject}" показва сериозни рискове.`;
  return `Телефонният номер "${subject}" вероятно е свързан с измамна дейност.`;
}

function buildNextSteps(verdict: string): Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> {
  if (verdict === "safe") return [
    { action: "Отговорете внимателно", description: "Никога не давайте ПИН кодове или пароли по телефон", priority: "low" },
  ];
  if (verdict === "insufficient") return [
    { action: "Потърсете номера в Google", description: "Търсенето на номера онлайн може да разкрие отзиви от други потребители", priority: "medium" },
    { action: "Не давайте лична информация", description: "Въздържайте се от споделяне на данни до изясняване на самоличността", priority: "medium" },
  ];
  if (verdict === "suspicious" || verdict === "misleading") return [
    { action: "Не отговаряйте", description: "Блокирайте номера и не изпращайте съобщения", priority: "high" },
    { action: "Докладвайте в КЗП", description: "Можете да подадете сигнал до Комисията за защита на потребителите", priority: "medium" },
    { action: "Докладвайте тук", description: "Помогнете ни да предупредим другите потребители", priority: "medium" },
  ];
  return [
    { action: "Блокирайте незабавно", description: "Блокирайте номера на вашето устройство", priority: "high" },
    { action: "Сигнализирайте МВР", description: "При финансова измама, подайте сигнал в ГДБОП (www.gdbop.bg)", priority: "high" },
    { action: "Докладвайте тук", description: "Ще добавим номера в нашата база данни за предупреждение на другите", priority: "high" },
  ];
}

export async function checkPhone(input: string): Promise<RawPipelineResult> {
  const { score: hScore, signals: hSignals } = runPhoneHeuristic(input);
  const hVerdict = scoreToVerdict(hScore);

  let aiScore: number | undefined;
  let aiSignals: Signal[] | undefined;
  let aiSummary: string | undefined;
  let aiEvidence: Evidence[] | undefined;
  let aiNextSteps: Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> | undefined;
  let aiAvailable = false;

  try {
    const ai = await aiCheck("phone", input);
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
    heuristicSummary: buildSummary(hVerdict, input),
    heuristicEvidence: [{ source: "Анализ на формата на номера", finding: "Номерът е проверен за структурни характеристики", url: null }],
    heuristicNextSteps: buildNextSteps(hVerdict),
  };
}
