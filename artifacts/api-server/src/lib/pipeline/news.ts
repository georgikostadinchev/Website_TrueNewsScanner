// TODO: Replace mock logic with real providers:
// - Google Fact Check Tools API
// - Bulgarian fact-checking databases (factcheck.bg, AFP Fact Check)

import { type PipelineResult, type Signal, type Evidence, scoreToVerdict, verdictToLabel } from "./types";

const MISINFORMATION_PATTERNS = [
  { pattern: /учени доказаха|изследвания показват|лекари потвърдиха/i, label: "Неверифицирана научна претенция", desc: "Текстът се позовава на неуточнени изследвания или учени", weight: 0.4 },
  { pattern: /правителството крие|тайно|не искат да знаете/i, label: "Конспиративен наратив", desc: "Текстът съдържа конспиративни твърдения за скрита информация", weight: 0.55 },
  { pattern: /ваксин[аи]|микрочип|5G|хемтрейл/i, label: "Известна дезинформация", desc: "Текстът засяга теми с документирани дезинформационни наративи", weight: 0.5 },
  { pattern: /СПОДЕЛЕТЕ СПЕШНО|разпространете|предупредете всички/i, label: "Вирален призив", desc: "Текстът подканва за спешно споделяне — типична тактика за дезинформация", weight: 0.6 },
  { pattern: /цената на|цените ще/i, label: "Сензационни икономически твърдения", desc: "Несъответстващи твърдения за цени или икономически промени", weight: 0.3 },
];

const CREDIBILITY_INDICATORS = [
  { pattern: /според.*министерство|по данни на.*агенц/i, label: "Позоваване на официален източник", desc: "Текстът се позовава на официална институция", weight: -0.2 },
  { pattern: /публикувано в|според изданието|цитат от/i, label: "Посочен медиен източник", desc: "Текстът посочва конкретен медиен източник", weight: -0.15 },
];

function buildSummary(verdict: string, score: number): string {
  if (verdict === "safe") return `Анализираният текст не съдържа познати дезинформационни модели. Оценката е базирана на текстов анализ и не замества пълна фактологична проверка.`;
  if (verdict === "insufficient") return `Не можем да дадем категорична оценка за достоверността на тази новина. Препоръчваме проверка в утвърдени медии.`;
  if (verdict === "suspicious") return `Текстът съдържа елементи, характерни за дезинформация. Рискова оценка: ${score}/100. Проверете информацията в официални източници.`;
  if (verdict === "misleading") return `Текстът показва множество признаци за подвеждащо съдържание. Рискова оценка: ${score}/100. Вероятно е дезинформация или силно манипулирана новина.`;
  return `Текстът съдържа силни индикатори за умишлена дезинформация. Рискова оценка: ${score}/100. Не споделяйте и не вярвайте на твърденията без проверка.`;
}

function buildNextSteps(verdict: string): Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> {
  if (verdict === "safe") {
    return [{ action: "Проверете допълнително", description: "Нашата проверка е ограничена. За важна информация, проверете в утвърдени медии", priority: "low" }];
  }
  if (verdict === "insufficient") {
    return [
      { action: "Потърсете в утвърдени медии", description: "Проверете дали БНТ, БНР, или агенция БТА съобщават за същото", priority: "medium" },
      { action: "Посетете factcheck.bg", description: "Factcheck.bg е български ресурс за проверка на новини", priority: "medium" },
    ];
  }
  if (verdict === "suspicious" || verdict === "misleading") {
    return [
      { action: "Не споделяйте", description: "Ако дезинформацията е неточна, разпространението й вреди", priority: "high" },
      { action: "Проверете в официални медии", description: "Потърсете темата в БНТ, БТА, или надеждни новинарски издания", priority: "high" },
      { action: "Докладвайте дезинформация", description: "Помогнете ни да предотвратим разпространението на дезинформация", priority: "medium" },
    ];
  }
  return [
    { action: "Не споделяйте!", description: "Разпространението на умишлена дезинформация е опасно", priority: "high" },
    { action: "Предупредете споделящите", description: "Ако приятели споделят тази новина, уведомете ги за риска", priority: "high" },
    { action: "Докладвайте дезинформацията", description: "Подайте доклад до нас и до medialiteracy.eu", priority: "medium" },
  ];
}

export async function checkNews(input: string): Promise<PipelineResult> {
  const signals: Signal[] = [];
  let score = 20;

  for (const p of MISINFORMATION_PATTERNS) {
    if (p.pattern.test(input)) {
      score += p.weight * 100;
      signals.push({ id: `risk-${signals.length}`, label: p.label, description: p.desc, weight: p.weight, isRisk: true });
    }
  }

  for (const p of CREDIBILITY_INDICATORS) {
    if (p.pattern.test(input)) {
      score += p.weight * 100;
      signals.push({ id: `cred-${signals.length}`, label: p.label, description: p.desc, weight: p.weight, isRisk: false });
    }
  }

  if (signals.length === 0) {
    signals.push({ id: "no-signals", label: "Неизвестен контекст", description: "Не са открити конкретни дезинформационни шаблони в текста", weight: 0, isRisk: false });
    score = 35;
  }

  score = Math.max(0, Math.min(100, score));
  const verdict = scoreToVerdict(score);

  const evidence: Evidence[] = [
    { source: "Текстов анализ", finding: `Анализирани са ${signals.length} характеристики на текста за дезинформационни модели`, url: null },
    { source: "TODO: Google Fact Check Tools API", finding: "Кръстосана проверка с международни фактчекъри ще бъде добавена в следваща версия", url: null },
    { source: "TODO: Factcheck.bg интеграция", finding: "Интеграция с български фактчекъри е планирана за следваща версия", url: null },
  ];

  return {
    verdict,
    verdictLabel: verdictToLabel(verdict),
    riskScore: score,
    confidence: 40,
    summary: buildSummary(verdict, score),
    signals,
    evidence,
    nextSteps: buildNextSteps(verdict),
  };
}
