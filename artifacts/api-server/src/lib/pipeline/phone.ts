// TODO: Replace mock logic with real providers:
// - Twilio Lookup API (carrier info, line type, fraud score)
// - Internal community report database

import { type PipelineResult, type Signal, type Evidence, scoreToVerdict, verdictToLabel } from "./types";

const BG_SCAM_PREFIXES = [
  { prefix: "+359700", label: "Премиум номер", desc: "Номерът е от платена категория (0700), разговорите могат да бъдат скъпи", weight: 0.3 },
  { prefix: "+359900", label: "Номер с висока тарифа", desc: "Номерът е от категория с висока тарифа (0900)", weight: 0.4 },
];

const INTERNATIONAL_RISK = [
  { pattern: /^\+(?!359)/, label: "Международен номер", desc: "Номерът е от чужбина, което е необичайно за бългаски услуги", weight: 0.2 },
];

function buildSummary(verdict: string, score: number, subject: string): string {
  if (verdict === "safe") return `Телефонният номер "${subject}" не показва известни признаци за измама. Въпреки това, никога не давайте лична информация по телефон.`;
  if (verdict === "insufficient") return `Нямаме достатъчно данни за "${subject}". Препоръчваме проверка в публичните бази данни преди отговаряне.`;
  if (verdict === "suspicious") return `Телефонният номер "${subject}" има съмнителни характеристики. Рискова оценка: ${score}/100. Проявете внимание.`;
  if (verdict === "misleading") return `Телефонният номер "${subject}" показва сериозни рискове. Рискова оценка: ${score}/100. Не давайте лична информация.`;
  return `Телефонният номер "${subject}" вероятно е свързан с измамна дейност. Рискова оценка: ${score}/100. Прекратете контакта.`;
}

function buildNextSteps(verdict: string): Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> {
  if (verdict === "safe") {
    return [
      { action: "Отговорете внимателно", description: "Не са открити рискове, но никога не давайте ПИН кодове или пароли по телефон", priority: "low" },
    ];
  }
  if (verdict === "insufficient") {
    return [
      { action: "Потърсете номера в Google", description: "Търсенето на номера онлайн може да разкрие отзиви от други потребители", priority: "medium" },
      { action: "Не давайте лична информация", description: "До изясняване на самоличността, въздържайте се от споделяне на данни", priority: "medium" },
    ];
  }
  if (verdict === "suspicious" || verdict === "misleading") {
    return [
      { action: "Не отговаряйте", description: "Блокирайте номера и не изпращайте съобщения", priority: "high" },
      { action: "Докладвайте в КЗП", description: "Можете да подадете сигнал до Комисията за защита на потребителите", priority: "medium" },
      { action: "Докладвайте тук", description: "Помогнете ни да предупредим другите потребители", priority: "medium" },
    ];
  }
  return [
    { action: "Блокирайте незабавно", description: "Блокирайте номера на вашето устройство", priority: "high" },
    { action: "Сигнализирайте МВР", description: "При финансова измама, подайте сигнал в ГДБОП (www.gdbop.bg)", priority: "high" },
    { action: "Докладвайте тук", description: "Ще добавим номера в нашата база данни за предупреждение на другите", priority: "high" },
  ];
}

export async function checkPhone(input: string): Promise<PipelineResult> {
  const signals: Signal[] = [];
  let score = 20;

  const normalized = input.replace(/[\s\-\(\)]/g, "");

  for (const p of BG_SCAM_PREFIXES) {
    if (normalized.startsWith(p.prefix)) {
      score += p.weight * 100;
      signals.push({ id: `risk-${signals.length}`, label: p.label, description: p.desc, weight: p.weight, isRisk: true });
    }
  }

  for (const p of INTERNATIONAL_RISK) {
    if (p.pattern.test(normalized)) {
      score += p.weight * 100;
      signals.push({ id: `intl-${signals.length}`, label: p.label, description: p.desc, weight: p.weight, isRisk: true });
    }
  }

  if (/^\+359[87]\d{8}$/.test(normalized)) {
    score -= 15;
    signals.push({ id: "bg-mobile", label: "Валиден български мобилен номер", description: "Форматът съответства на стандартен български мобилен номер", weight: -0.15, isRisk: false });
  }

  if (signals.length === 0) {
    signals.push({ id: "no-signals", label: "Неизвестен номер", description: "Нямаме информация за този номер в нашите бази данни", weight: 0, isRisk: false });
    score = 30;
  }

  // TODO: Twilio Lookup integration
  const evidence: Evidence[] = [
    { source: "Анализ на формата на номера", finding: `Номерът "${normalized}" е проверен за структурни характеристики`, url: null },
    { source: "TODO: Twilio Lookup API", finding: "Проверката за оператор, тип линия и рискова оценка е запазена за бъдеща интеграция", url: null },
    { source: "Общностни доклади", finding: "Проверката в базата данни с докладвани номера ще бъде добавена при мащабиране", url: null },
  ];

  score = Math.max(0, Math.min(100, score));
  const verdict = scoreToVerdict(score);

  return {
    verdict,
    verdictLabel: verdictToLabel(verdict),
    riskScore: score,
    confidence: 45,
    summary: buildSummary(verdict, score, input),
    signals,
    evidence,
    nextSteps: buildNextSteps(verdict),
  };
}
