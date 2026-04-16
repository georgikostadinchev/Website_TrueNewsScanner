import { type Signal, type Evidence, type RawPipelineResult, scoreToVerdict } from "./types";
import { aiCheck } from "./ai";

// ---------------------------------------------------------------------------
// Feature extraction helpers
// ---------------------------------------------------------------------------

function normalizeMessage(input: string): string {
  return input.trim();
}

function containsIban(text: string): boolean {
  return /\bBG\d{2}[A-Z]{4}\d{14}\b/i.test(text);
}

function containsCardLikeNumber(text: string): boolean {
  return /(?<!\d)\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}(?!\d)/.test(text);
}

function containsEmbeddedUrl(text: string): boolean {
  return /https?:\/\//i.test(text);
}

function countEmbeddedUrls(text: string): number {
  return (text.match(/https?:\/\//gi) ?? []).length;
}

function getCapsRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Zа-яА-Я]/gu, "");
  if (letters.length === 0) return 0;
  const upper = letters.replace(/[^A-ZА-Я]/gu, "");
  return upper.length / letters.length;
}

function countEmoji(text: string): number {
  return (text.match(/\p{Emoji_Presentation}/gu) ?? []).length;
}

function isTrackingOnlyMessage(text: string, hasUrl: boolean, hasUrgency: boolean, hasCredential: boolean): boolean {
  if (hasUrl || hasUrgency || hasCredential) return false;
  return /^[A-Z0-9]{8,20}$/i.test(text.trim()) ||
    /\b(CP|RR|EE|LY|BG)\d{9}BG\b/i.test(text) ||
    /\b[A-Z]{2}\d{9}[A-Z]{2}\b/.test(text);
}

function hasFormalSenderSignature(text: string): boolean {
  const tail = text.slice(-200);
  return /\b(АД|ООД|ЕООД|ЕАД|Банка|Bank|Ltd|Corp|Inc|S\.A\.|Group|Застрахов|Осигур|Здравн|Министерство|Агенция|Дирекция|Общ[а-я]+|Управ)\b/i.test(tail);
}

// ---------------------------------------------------------------------------
// Pattern groups (existing)
// ---------------------------------------------------------------------------

const BG_SCAM_PHRASES = [
  { pattern: /спечелил|спечелихте|спечелих/i, label: "Измамно обещание за печалба", desc: "Съобщението твърди, че сте спечелили нещо", weight: 0.65 },
  { pattern: /банков.*акаунт|сметка.*блокирана|карта.*блокирана/i, label: "Фалшива банкова спешност", desc: "Съобщението имитира банково известие за блокирана карта/сметка", weight: 0.8 },
  { pattern: /кликнете.*тук|натиснете.*тук|последвайте.*линк/i, label: "Призив за кликване", desc: "Съобщението настоява да кликнете на линк", weight: 0.4 },
  { pattern: /пакет.*чака|пощенска.*пратка|доставка.*задържана/i, label: "Фалшива доставка", desc: "Имитация на известие за задържана пощенска пратка", weight: 0.6 },
  { pattern: /верификация.*данни|потвърдете.*самоличност/i, label: "Фишинг — верификация", desc: "Иска верификация на лична информация", weight: 0.75 },
  { pattern: /глоба|санкция|КАТ|НАП|НОИ/i, label: "Имитация на държавна институция", desc: "Съобщението се представя за официална институция", weight: 0.7 },
  { pattern: /срочно|незабавно|веднага|последна.*возможност/i, label: "Изкуствена спешност", desc: "Използват се думи, създаващи изкуствен натиск", weight: 0.3 },
];

const ENGLISH_PHISHING_PHRASES = /click here|verify your account|your account (has been )?suspended|unauthorized access|confirm your (identity|details)|unusual activity/i;
const URGENCY_PATTERN = /срочно|незабавно|веднага|последна.*возможност|urgent|immediately/i;

// ---------------------------------------------------------------------------
// Credential/payment cluster cap
// Each triggered signal adds its score; the cluster total is capped at 150pts
// ---------------------------------------------------------------------------

interface CredentialSignalCandidate {
  id: string;
  label: string;
  description: string;
  weight: number;
  pts: number;
  triggered: boolean;
}

function applyCredentialCluster(
  candidates: CredentialSignalCandidate[],
  maxPts: number,
): { signals: Signal[]; totalPts: number } {
  const fired = candidates.filter((c) => c.triggered);
  const out: Signal[] = [];
  let used = 0;
  for (const c of fired) {
    const remaining = maxPts - used;
    if (remaining <= 0) break;
    const effective = Math.min(c.pts, remaining);
    out.push({ id: c.id, label: c.label, description: c.description, weight: c.weight, isRisk: true });
    used += effective;
  }
  return { signals: out, totalPts: used };
}

// ---------------------------------------------------------------------------
// Core heuristic runner
// ---------------------------------------------------------------------------

function runMessageHeuristic(input: string): { score: number; signals: Signal[] } {
  const signals: Signal[] = [];
  let score = 10;

  const msg = normalizeMessage(input);

  // --- Pre-compute features ---
  const hasUrl = containsEmbeddedUrl(msg);
  const urlCount = countEmbeddedUrls(msg);
  const hasUrgency = URGENCY_PATTERN.test(msg);
  const hasCredentialKeyword = /парола|password|pwd|CVV|CVC|ПИН|пин код|ЕГН|лична карта|личен номер/i.test(msg);

  // --- Existing BG scam patterns ---
  for (const p of BG_SCAM_PHRASES) {
    if (p.pattern.test(msg)) {
      signals.push({
        id: `bg-scam-${signals.length}`,
        label: p.label,
        description: p.desc,
        weight: p.weight,
        isRisk: true,
      });
      score += p.weight * 100;
    }
  }

  // --- Credential / payment cluster (capped at 150 pts combined) ---
  const credentialCandidates: CredentialSignalCandidate[] = [
    {
      id: "cvv-pin-request",
      label: "Искане на CVV / ПИН код",
      description: "Съобщението иска CVV, CVC или ПИН код — легитимните организации никога не правят това",
      weight: 0.8,
      pts: 80,
      triggered: /CVV|CVC|ПИН|пин код/i.test(msg),
    },
    {
      id: "password-request",
      label: "Искане на парола",
      description: "Съобщението иска парола — никоя легитимна организация не прави това",
      weight: 0.75,
      pts: 75,
      triggered: /парола|password\b|pwd\b/i.test(msg),
    },
    {
      id: "personal-id-request",
      label: "Искане на лични документи",
      description: "Съобщението иска ЕГН, номер на лична карта или друг личен идентификатор",
      weight: 0.65,
      pts: 65,
      triggered: /ЕГН|лична карта|личен номер/i.test(msg),
    },
    {
      id: "iban-present",
      label: "IBAN номер в съобщението",
      description: "Съобщението съдържа IBAN номер — рядко присъства в легитимни SMS/съобщения",
      weight: 0.7,
      pts: 70,
      triggered: containsIban(msg),
    },
    {
      id: "card-number",
      label: "Номер, подобен на банкова карта",
      description: "Съобщението съдържа 16-цифрена поредица, наподобяваща номер на платежна карта",
      weight: 0.7,
      pts: 70,
      triggered: !containsIban(msg) && containsCardLikeNumber(msg),
    },
    {
      id: "crypto-request",
      label: "Искане за криптовалута",
      description: "Съобщението споменава криптовалута или крипто портфейл — честа тактика при измами",
      weight: 0.7,
      pts: 70,
      triggered: /Bitcoin|BTC|Ethereum|ETH|крипто|портфейл|crypto\s*wallet|wallet\s*address/i.test(msg),
    },
    {
      id: "gift-card",
      label: "Искане на ваучер / gift card",
      description: "Съобщението иска покупка или изпращане на ваучер или gift card — класическа измамна тактика",
      weight: 0.65,
      pts: 65,
      triggered: /gift\s*card|ваучер|код за|iTunes|Amazon\s*voucher|Google\s*Play/i.test(msg),
    },
  ];

  const { signals: credSignals, totalPts: credPts } = applyCredentialCluster(credentialCandidates, 150);
  for (const s of credSignals) signals.push(s);
  score += credPts;

  // --- English phishing phrases ---
  if (ENGLISH_PHISHING_PHRASES.test(msg)) {
    signals.push({
      id: "english-phishing",
      label: "Английски фишинг фрази",
      description: "Съобщението съдържа типични английски фишинг фрази (click here, verify account и др.)",
      weight: 0.6,
      isRisk: true,
    });
    score += 60;
  }

  // --- Excessive CAPS ratio ---
  const capsRatio = getCapsRatio(msg);
  if (capsRatio > 0.4 && msg.length > 20) {
    signals.push({
      id: "caps-ratio",
      label: "Прекомерно използване на главни букви",
      description: "Над 40% от буквите са главни — характерно за алармиращи или манипулативни съобщения",
      weight: 0.3,
      isRisk: true,
    });
    score += 30;
  }

  // --- Emoji spam ---
  const emojiCount = countEmoji(msg);
  if (emojiCount >= 5) {
    signals.push({
      id: "emoji-spam",
      label: "Прекомерна употреба на емоджи",
      description: `Съобщението съдържа ${emojiCount} емоджи — характерно за вирусни измамни съобщения`,
      weight: 0.2,
      isRisk: true,
    });
    score += 20;
  }

  // --- Embedded URL ---
  if (hasUrl) {
    if (msg.length < 30 && urlCount === 1) {
      signals.push({
        id: "short-link-only",
        label: "Много кратко съобщение само с линк",
        description: "Съобщението е изключително кратко и съдържа само линк — типична тактика за фишинг",
        weight: 0.45,
        isRisk: true,
      });
      score += 45;
    } else {
      signals.push({
        id: "embedded-url",
        label: "Вграден URL адрес",
        description: "Съобщението съдържа URL адрес — проверете го отделно преди да кликнете",
        weight: 0.25,
        isRisk: true,
      });
      score += 25;
    }
  }

  // --- Safe: formal greeting + named sender signature ---
  const hasFormalGreeting = /^(Уважаем|Dear\b)/i.test(msg);
  if (hasFormalGreeting && hasFormalSenderSignature(msg)) {
    signals.push({
      id: "formal-greeting",
      label: "Официално обръщение с подателска подпис",
      description: "Съобщението започва с официално обръщение и завършва с идентифициран подател — характерно за легитимна кореспонденция",
      weight: -0.2,
      isRisk: false,
    });
    score -= 20;
  }

  // --- Safe: tracking-only message ---
  if (isTrackingOnlyMessage(msg, hasUrl, hasUrgency, hasCredentialKeyword)) {
    signals.push({
      id: "tracking-only",
      label: "Само номер на пратка",
      description: "Съобщението изглежда като стандартен номер за проследяване без допълнителни рискови елементи",
      weight: -0.15,
      isRisk: false,
    });
    score -= 15;
  }

  if (signals.length === 0) {
    signals.push({
      id: "no-signals",
      label: "Неизвестен модел",
      description: "Не са открити конкретни измамни шаблони",
      weight: 0,
      isRisk: false,
    });
    score = 30;
  }

  return { score: Math.max(0, Math.min(100, score)), signals };
}

// ---------------------------------------------------------------------------
// Summary / evidence / next steps
// ---------------------------------------------------------------------------

function buildSummary(verdict: string): string {
  if (verdict === "safe") return "Анализираното съобщение не съдържа познати измамни фрази или манипулативни модели.";
  if (verdict === "insufficient") return "Не можем да дадем категорична оценка за това съобщение. Препоръчваме внимание.";
  if (verdict === "suspicious") return "Съобщението съдържа фрази, типични за измамни схеми.";
  if (verdict === "misleading") return "Съобщението показва множество признаци за подвеждащо съдържание.";
  return "Съобщението съдържа силни индикатори за измамна схема. Изтрийте го незабавно.";
}

function buildNextSteps(verdict: string): Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> {
  if (verdict === "safe") return [{ action: "Продължете нормално", description: "Не са открити рискове.", priority: "low" }];
  if (verdict === "insufficient") return [
    { action: "Проверете изпращача", description: "Уверете се, че познавате изпращача лично", priority: "medium" },
    { action: "Не следвайте линкове", description: "Не кликвайте върху линкове от непознати", priority: "medium" },
  ];
  if (verdict === "suspicious" || verdict === "misleading") return [
    { action: "Не отговаряйте", description: "Не отговаряйте и не следвайте инструкциите", priority: "high" },
    { action: "Изтрийте съобщението", description: "Изтрийте съобщението от устройството си", priority: "medium" },
    { action: "Предупредете близките", description: "Ако сте го получили от познат, той може да е хакнат", priority: "medium" },
  ];
  return [
    { action: "Изтрийте незабавно", description: "Изтрийте съобщението и блокирайте изпращача", priority: "high" },
    { action: "Докладвайте измамата", description: "Подайте сигнал в ГДБОП и ни докладвайте", priority: "high" },
    { action: "Не предавайте съобщението", description: "Не препращайте съобщението дори ако изглежда безобидно", priority: "high" },
  ];
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function checkMessage(input: string): Promise<RawPipelineResult> {
  const { score: hScore, signals: hSignals } = runMessageHeuristic(input);
  const hVerdict = scoreToVerdict(hScore);

  let aiScore: number | undefined;
  let aiSignals: Signal[] | undefined;
  let aiSummary: string | undefined;
  let aiEvidence: Evidence[] | undefined;
  let aiNextSteps: Array<{ action: string; description: string; priority: "high" | "medium" | "low" }> | undefined;
  let aiAvailable = false;

  try {
    const ai = await aiCheck("message", input);
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
    heuristicEvidence: [{ source: "Текстов и структурен анализ", finding: `Анализирани са ${hSignals.length} характеристики на съобщението, включително фрази, финансови данни и структурни индикатори.`, url: null }],
    heuristicNextSteps: buildNextSteps(hVerdict),
  };
}
