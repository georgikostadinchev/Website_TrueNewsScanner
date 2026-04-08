// TODO: Replace mock logic with real providers:
// - Google Web Risk API (malware/phishing detection)
// - RDAP (domain registration lookup)
// - urlscan.io (optional: screenshot + threat analysis)

import { type PipelineResult, type Signal, type Evidence, scoreToVerdict, verdictToLabel } from "./types";

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

function buildSummary(verdict: string, score: number, subject: string): string {
  if (verdict === "safe") return `Проверката на "${subject}" не откри явни признаци на измама или злонамерено съдържание. Въпреки това, препоръчваме внимание при споделяне на лична информация.`;
  if (verdict === "insufficient") return `За "${subject}" няма достатъчно данни за категорична оценка. Препоръчваме допълнителна проверка преди взаимодействие.`;
  if (verdict === "suspicious") return `Открити са съмнителни характеристики при "${subject}". Рискова оценка: ${score}/100. Бъдете внимателни.`;
  if (verdict === "misleading") return `"${subject}" показва сериозни признаци на подвеждащо или рисково съдържание. Рискова оценка: ${score}/100. Не споделяйте лична информация.`;
  return `"${subject}" вероятно е измамно. Рискова оценка: ${score}/100. Силно препоръчваме да не взаимодействате с това съдържание.`;
}

function buildNextSteps(verdict: string): Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> {
  if (verdict === "safe") {
    return [
      { action: "Продължете с внимание", description: "Не са открити явни заплахи, но винаги проверявайте преди да споделяте лична информация", priority: "low" },
      { action: "Докладвайте при съмнение", description: "Ако все пак нещо изглежда подозрително, използвайте нашия формуляр за докладване", priority: "low" },
    ];
  }
  if (verdict === "insufficient") {
    return [
      { action: "Потърсете допълнителна информация", description: "Не разполагаме с достатъчно данни. Проверете дали познавате изпращача", priority: "medium" },
      { action: "Не споделяйте лични данни", description: "Докато не сте сигурни, въздържайте се от въвеждане на пароли или лична информация", priority: "medium" },
    ];
  }
  if (verdict === "suspicious") {
    return [
      { action: "Не кликвайте върху линкове", description: "Избягвайте взаимодействие с тази страница до допълнителна проверка", priority: "high" },
      { action: "Предупредете близки", description: "Ако сте получили това в съобщение, предупредете изпращача за риска", priority: "medium" },
      { action: "Докладвайте", description: "Помогнете ни да защитим общността, като докладвате това съдържание", priority: "medium" },
    ];
  }
  return [
    { action: "Не взаимодействайте!", description: "Не кликвайте, не въвеждайте данни, не споделяйте с близки", priority: "high" },
    { action: "Докладвайте незабавно", description: "Докладвайте на нашия екип и на CERT Bulgaria (cert@comsoc.bg)", priority: "high" },
    { action: "Ако сте засегнати, действайте бързо", description: "Свържете се с банката си и сменете паролите при нужда", priority: "high" },
  ];
}

export async function checkUrl(input: string): Promise<PipelineResult> {
  const signals: Signal[] = [];
  let score = 15;

  const domain = extractDomain(input);

  for (const p of KNOWN_SCAM_PATTERNS) {
    if (p.pattern.test(input)) {
      score += p.weight * 100;
      signals.push({
        id: `risk-${signals.length}`,
        label: p.label,
        description: p.desc,
        weight: p.weight,
        isRisk: true,
      });
    }
  }

  for (const p of SAFE_INDICATORS) {
    if (p.pattern.test(input)) {
      score += p.weight * 100;
      signals.push({
        id: `safe-${signals.length}`,
        label: p.label,
        description: p.desc,
        weight: p.weight,
        isRisk: false,
      });
    }
  }

  if (signals.length === 0) {
    signals.push({
      id: "no-signals",
      label: "Няма разпознати сигнали",
      description: "Не са открити явни рискови или защитни сигнали за този URL",
      weight: 0,
      isRisk: false,
    });
    score = 30;
  }

  score = Math.max(0, Math.min(100, score));
  const verdict = scoreToVerdict(score);

  const evidence: Evidence[] = [
    {
      source: "Анализ на структурата на URL",
      finding: `Домейнът "${domain}" е анализиран за структурни рискове. ${score > 50 ? "Открити са тревожни характеристики." : "Не са открити явни структурни проблеми."}`,
      url: null,
    },
    {
      source: "TODO: Google Web Risk",
      finding: "Проверката срещу базата данни за известни заплахи е запазена за бъдеща интеграция",
      url: null,
    },
  ];

  const nextSteps = buildNextSteps(verdict);
  const summary = buildSummary(verdict, score, domain);

  return { verdict, verdictLabel: verdictToLabel(verdict), riskScore: score, confidence: 55, summary, signals, evidence, nextSteps };
}
