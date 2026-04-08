// TODO: Replace mock logic with real providers:
// - NLP classifier for Bulgarian scam patterns
// - SMS scam database lookup

import { type PipelineResult, type Signal, type Evidence, scoreToVerdict, verdictToLabel } from "./types";

const SCAM_PATTERNS = [
  { pattern: /спечелил|спечелихте|спечелих/i, label: "Измамно обещание за печалба", desc: "Съобщението твърди, че сте спечелили нещо", weight: 0.65 },
  { pattern: /банков.*акаунт|сметка.*блокирана|карта.*блокирана/i, label: "Фалшива банкова спешност", desc: "Съобщението имитира банково известие за блокирана карта/сметка", weight: 0.8 },
  { pattern: /кликнете.*тук|натиснете.*тук|последвайте.*линк/i, label: "Призив за кликване", desc: "Съобщението настоява да кликнете на линк", weight: 0.4 },
  { pattern: /пакет.*чака|пощенска.*пратка|доставка.*задържана/i, label: "Фалшива доставка", desc: "Имитация на известие за задържана пощенска пратка", weight: 0.6 },
  { pattern: /верификация.*данни|потвърдете.*самоличност/i, label: "Фишинг — верификация", desc: "Иска верификация на лична информация", weight: 0.75 },
  { pattern: /глоба|санкция|КАТ|НАП|НОИ/i, label: "Имитация на държавна институция", desc: "Съобщението се представя за официална институция", weight: 0.7 },
  { pattern: /срочно|незабавно|веднага|последна.*возможност/i, label: "Изкуствена спешност", desc: "Използват се думи, създаващи изкуствен натиск", weight: 0.3 },
];

const SAFE_PATTERNS = [
  { pattern: /^[А-Яа-я\w\s,.!?-]{5,100}$/, label: "Нормален текст", desc: "Текстът изглежда като стандартно съобщение", weight: -0.1 },
];

function buildSummary(verdict: string, score: number): string {
  if (verdict === "safe") return `Анализираното съобщение не съдържа познати измамни фрази или манипулативни модели. Оценката е базирана на текстово съответствие.`;
  if (verdict === "insufficient") return `Не можем да дадем категорична оценка за това съобщение. Препоръчваме внимание при взаимодействие.`;
  if (verdict === "suspicious") return `Съобщението съдържа фрази, типични за измамни схеми. Рискова оценка: ${score}/100. Не следвайте инструкциите в него.`;
  if (verdict === "misleading") return `Съобщението показва множество признаци за подвеждащо съдържание. Рискова оценка: ${score}/100. Вероятно е опит за измама.`;
  return `Съобщението съдържа силни индикатори за измамна схема. Рискова оценка: ${score}/100. Не реагирайте — изтрийте го незабавно.`;
}

function buildNextSteps(verdict: string): Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> {
  if (verdict === "safe") {
    return [{ action: "Продължете нормално", description: "Не са открити рискове. Все пак внимавайте при съобщения, изискващи лични данни", priority: "low" }];
  }
  if (verdict === "insufficient") {
    return [
      { action: "Проверете изпращача", description: "Уверете се, че познавате лично изпращача на съобщението", priority: "medium" },
      { action: "Не следвайте линкове", description: "Не кликвайте върху линкове от непознати", priority: "medium" },
    ];
  }
  if (verdict === "suspicious" || verdict === "misleading") {
    return [
      { action: "Не отговаряйте", description: "Не отговаряйте на съобщението и не следвайте инструкциите в него", priority: "high" },
      { action: "Изтрийте съобщението", description: "Изтрийте съобщението от устройството си", priority: "medium" },
      { action: "Предупредете близките", description: "Ако сте го получили от познат, той може да е хакнат", priority: "medium" },
    ];
  }
  return [
    { action: "Изтрийте незабавно", description: "Изтрийте съобщението и блокирайте изпращача", priority: "high" },
    { action: "Докладвайте измамата", description: "Подайте сигнал в ГДБОП и ни докладвайте за предупреждение на другите", priority: "high" },
    { action: "Не предавайте съобщението", description: "Не препращайте съобщението, дори ако изглежда смешно — измамниците разчитат на това", priority: "high" },
  ];
}

export async function checkMessage(input: string): Promise<PipelineResult> {
  const signals: Signal[] = [];
  let score = 10;

  for (const p of SCAM_PATTERNS) {
    if (p.pattern.test(input)) {
      score += p.weight * 100;
      signals.push({ id: `risk-${signals.length}`, label: p.label, description: p.desc, weight: p.weight, isRisk: true });
    }
  }

  for (const p of SAFE_PATTERNS) {
    if (p.pattern.test(input) && signals.length === 0) {
      signals.push({ id: `safe-${signals.length}`, label: p.label, description: p.desc, weight: p.weight, isRisk: false });
    }
  }

  if (signals.length === 0) {
    signals.push({ id: "no-signals", label: "Неизвестен модел", description: "Не са открити конкретни измамни шаблони в текста", weight: 0, isRisk: false });
    score = 30;
  }

  score = Math.max(0, Math.min(100, score));
  const verdict = scoreToVerdict(score);

  const evidence: Evidence[] = [
    { source: "Текстов анализ на шаблони", finding: `Анализирани са ${signals.length} текстови характеристики за съответствие с познати измамни съобщения`, url: null },
    { source: "TODO: NLP класификатор за български", finding: "Машинно обучение за разпознаване на измами на български ще бъде добавено в следваща версия", url: null },
  ];

  return {
    verdict,
    verdictLabel: verdictToLabel(verdict),
    riskScore: score,
    confidence: 50,
    summary: buildSummary(verdict, score),
    signals,
    evidence,
    nextSteps: buildNextSteps(verdict),
  };
}
