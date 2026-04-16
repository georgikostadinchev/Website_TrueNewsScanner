import { type Signal, type Evidence, type RawPipelineResult, scoreToVerdict } from "./types";
import { aiCheck } from "./ai";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizePhone(input: string): string {
  return input.replace(/[\s\-\(\)\.]/g, "");
}

function toInternationalFormat(normalized: string): string {
  if (/^0[0-9]/.test(normalized)) {
    return "+359" + normalized.slice(1);
  }
  return normalized;
}

function detectBgMobileOperatorPrefix(intl: string): "a1" | "yettel" | "vivacom" | null {
  if (/^\+359(87|88)/.test(intl)) return "a1";
  if (/^\+35989/.test(intl)) return "yettel";
  if (/^\+359(98|99)/.test(intl)) return "vivacom";
  return null;
}

function isValidBgLandline(intl: string): boolean {
  return /^\+3592\d{7}$/.test(intl) ||
    /^\+3593[1-9]\d{5,6}$/.test(intl) ||
    /^\+3594[1-9]\d{5,6}$/.test(intl) ||
    /^\+3595[1-9]\d{5,6}$/.test(intl) ||
    /^\+3596[1-9]\d{5,6}$/.test(intl) ||
    /^\+3597[1-9]\d{5,6}$/.test(intl);
}

function isSyntheticPhonePattern(digits: string): boolean {
  if (/^(\d)\1{6,}$/.test(digits)) return true;
  const ascending = "01234567890123456789";
  const descending = "98765432109876543210";
  if (ascending.includes(digits) && digits.length >= 7) return true;
  if (descending.includes(digits) && digits.length >= 7) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Core heuristic runner
// ---------------------------------------------------------------------------

function runPhoneHeuristic(input: string): { score: number; signals: Signal[] } {
  const signals: Signal[] = [];
  let score = 20;

  const normalized = normalizePhone(input);
  const intl = toInternationalFormat(normalized);
  const digitsOnly = normalized.replace(/^\+/, "");

  // --- Caller ID spoofing (obvious fakes) ---
  if (/^(0{9,}|9{9,})$/.test(digitsOnly)) {
    signals.push({
      id: "spoofed-caller-id",
      label: "Подправен Caller ID",
      description: "Номерът съдържа само нули или девятки — явен признак за подправен идентификатор",
      weight: 0.8,
      isRisk: true,
    });
    score += 80;
    return { score: Math.max(0, Math.min(100, score)), signals };
  }

  // --- Synthetic / sequential digits ---
  if (isSyntheticPhonePattern(digitsOnly)) {
    signals.push({
      id: "synthetic-pattern",
      label: "Синтетичен номер",
      description: "Номерът съдържа повтарящи се или последователни цифри — вероятно автоматично генериран",
      weight: 0.6,
      isRisk: true,
    });
    score += 60;
  }

  // --- BG premium SMS short code (18xxx) ---
  if (/^18\d{3}$/.test(normalized)) {
    signals.push({
      id: "premium-sms-short",
      label: "Премиум SMS кратък код",
      description: "Номерът е кратък код за платени SMS услуги (18xxx) — обаждането или изпращането може да е скъпо",
      weight: 0.45,
      isRisk: true,
    });
    score += 45;
  }

  // --- 0700/0900 premium BG numbers ---
  if (/^\+359700/.test(intl) || /^0700/.test(normalized)) {
    signals.push({
      id: "premium-0700",
      label: "Премиум номер (0700)",
      description: "Номерът е от платена категория (0700), разговорите могат да бъдат скъпи",
      weight: 0.3,
      isRisk: true,
    });
    score += 30;
  }

  if (/^\+359900/.test(intl) || /^0900/.test(normalized)) {
    signals.push({
      id: "premium-0900",
      label: "Номер с висока тарифа (0900)",
      description: "Номерът е от категория с висока тарифа (0900)",
      weight: 0.4,
      isRisk: true,
    });
    score += 40;
  }

  // --- US toll-free / premium prefixes (commonly spoofed) ---
  if (/^\+1(800|888|900)\d/.test(intl)) {
    signals.push({
      id: "us-tollfree",
      label: "Чуждестранен безплатен / премиум номер",
      description: "Номерът е американски безплатен или премиум тип (+1800/888/900) — нетипичен за легитимни BG контакти",
      weight: 0.4,
      isRisk: true,
    });
    score += 40;
  }

  // --- Operator safe signals (run before invalid-prefix check) ---
  const operator = detectBgMobileOperatorPrefix(intl);
  if (operator === "a1" && /^\+359(87|88)\d{7}$/.test(intl)) {
    signals.push({
      id: "bg-mobile-a1",
      label: "Валиден A1 мобилен номер",
      description: "Форматът съответства на стандартен мобилен номер на A1 България (087/088)",
      weight: -0.15,
      isRisk: false,
    });
    score -= 15;
  } else if (operator === "yettel" && /^\+35989\d{7}$/.test(intl)) {
    signals.push({
      id: "bg-mobile-yettel",
      label: "Валиден Yettel мобилен номер",
      description: "Форматът съответства на стандартен мобилен номер на Yettel (089)",
      weight: -0.15,
      isRisk: false,
    });
    score -= 15;
  } else if (operator === "vivacom" && /^\+359(98|99)\d{7}$/.test(intl)) {
    signals.push({
      id: "bg-mobile-vivacom",
      label: "Валиден Vivacom мобилен номер",
      description: "Форматът съответства на стандартен мобилен номер на Vivacom (098/099)",
      weight: -0.15,
      isRisk: false,
    });
    score -= 15;
  }

  // --- Valid BG landline ---
  if (isValidBgLandline(intl)) {
    signals.push({
      id: "bg-landline",
      label: "Валиден български стационарен номер",
      description: "Форматът съответства на стандартен български стационарен телефонен номер",
      weight: -0.15,
      isRisk: false,
    });
    score -= 15;
  }

  // --- Invalid BG international number (starts +359 but wrong prefix) ---
  const isBgNumber = intl.startsWith("+359");
  const hasValidBgOperator = operator !== null;
  const hasValidBgLandline = isValidBgLandline(intl);
  if (isBgNumber && !hasValidBgOperator && !hasValidBgLandline &&
      !/^\+359(700|800|900)/.test(intl)) {
    signals.push({
      id: "invalid-bg-prefix",
      label: "Невалиден български международен номер",
      description: "Номерът започва с кода на България (+359), но префиксът не съответства на известен оператор или стационарна мрежа",
      weight: 0.5,
      isRisk: true,
    });
    score += 50;
  }

  // --- Unexpected foreign country code ---
  if (intl.startsWith("+") && !isBgNumber) {
    const knownCodes = ["+1", "+44", "+49", "+33", "+39", "+34", "+31", "+32", "+43", "+41", "+46", "+47", "+45", "+358", "+30"];
    const isKnownCode = knownCodes.some((c) => intl.startsWith(c));
    if (!isKnownCode) {
      signals.push({
        id: "foreign-code",
        label: "Необичаен чуждестранен код",
        description: "Номерът е от държава с необичаен код, рядко срещан при легитимни BG контакти",
        weight: 0.35,
        isRisk: true,
      });
      score += 35;
    }
  }

  // --- Malformed / incomplete ---
  const totalDigits = digitsOnly.length;
  if (totalDigits < 7 || totalDigits > 15) {
    signals.push({
      id: "malformed-length",
      label: "Нестандартна дължина на номер",
      description: "Броят цифри не отговаря на стандартна дължина на телефонен номер (7–15 цифри)",
      weight: 0.35,
      isRisk: true,
    });
    score += 35;
  }

  if (signals.length === 0) {
    signals.push({
      id: "no-signals",
      label: "Неизвестен номер",
      description: "Нямаме информация за този номер",
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
    { action: "Потърсете номера в интернет", description: "Търсенето на номера онлайн може да разкрие отзиви от други потребители", priority: "medium" },
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

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

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
    heuristicEvidence: [{ source: "Анализ на структурата на номера", finding: "Номерът е проверен за формат, оператор и известни рискови префикси", url: null }],
    heuristicNextSteps: buildNextSteps(hVerdict),
  };
}
