import { type Signal, type Evidence, type RawPipelineResult, scoreToVerdict } from "./types";
import { aiCheck } from "./ai";

// ---------------------------------------------------------------------------
// Feature extraction helpers
// ---------------------------------------------------------------------------

function hasAttribution(text: string): boolean {
  return /\b(според|по данни на|съобщи|заяви|отчете|публикува|агенция|журналист|репортер|редакция)\b/i.test(text);
}

function hasOfficialAttribution(text: string): boolean {
  return /\b(БТА|МВР|НСИ|БНБ|Министерство|МОСВ|МОН|НАП|НЗОК|ДАНС)\b/.test(text) && hasAttribution(text);
}

function hasBalancedLanguage(text: string): boolean {
  return /от една страна.*от друга|спорен въпрос|различни мнения|двете страни|оспорва|отрича/i.test(text);
}

function hasSensationalLanguage(text: string): boolean {
  return /невероятно|шокиращо|скандално|невиждано|зашеметяващо|потресаващо/i.test(text);
}

function hasPoliticalDisinfoMarkers(text: string): boolean {
  return /Сорос|дълбока държава|НАТОвска агресия|Брюксел командва|глобалист|Нов световен ред|световна елита/i.test(text);
}

function hasHealthMisinformationMarkers(text: string): boolean {
  return /лекува рак|чудодейно|забранено от фарм|природно лечение победи|лечи диабет|изкорени вируса|медицината крие/i.test(text);
}

function hasEconomicClickbaitMarkers(text: string): boolean {
  return /Тайната на богатите|банките крият|пасивен доход|работи от вкъщи без опит|забогатей от вкъщи|хакна системата за печалба/i.test(text);
}

function hasPunctuationDeficit(text: string): boolean {
  if (text.length < 60) return false;
  const hasPunctuation = /[.!?]/.test(text);
  const letters = text.replace(/[^a-zA-Zа-яА-Я]/gu, "");
  const allCaps = letters.length > 0 && letters === letters.toUpperCase();
  return !hasPunctuation || allCaps;
}

function matchesClickbaitEnding(text: string): boolean {
  return /и ето какво се случи[\.\!\…]?$|Ще се шашнете[\.\!\…]?$|Не повярвахте[\.\!\…]?$|ще ви стресне[\.\!\…]?$|реакцията е неочаквана[\.\!\…]?$/i.test(text.trim());
}

function hasCivilUnrestMarkers(text: string): boolean {
  return /свалете правителството|народен бунт|въстание срещу|масови протести срещу|революция срещу/i.test(text);
}

function hasProKremlinNarratives(text: string): boolean {
  return /специална военна операция|нацистки режим в Киев|биолаборатории на САЩ|денацификация на Украйна|западна провокация в Украйна/i.test(text);
}

function hasViralCallToShare(text: string): boolean {
  return /СПОДЕЛЕТЕ СПЕШНО|разпространете|предупредете всички|пратете на всеки|изпратете на приятели/i.test(text);
}

// ---------------------------------------------------------------------------
// Sensationalism cluster cap — returns signal entries with their EFFECTIVE pts
// ---------------------------------------------------------------------------

interface SensationalEntry {
  id: string;
  label: string;
  desc: string;
  weight: number;
  effectivePts: number;
}

function cappedSensationalismScore(
  triggers: Array<{ triggered: boolean; id: string; label: string; desc: string; weight: number }>,
  maxContributionPts: number,
): SensationalEntry[] {
  const fired = triggers.filter((t) => t.triggered);
  if (fired.length === 0) return [];
  let usedPts = 0;
  const result: SensationalEntry[] = [];
  for (const t of fired) {
    const remaining = maxContributionPts - usedPts;
    if (remaining <= 0) break;
    const effectivePts = Math.min(t.weight * 100, remaining);
    result.push({ id: t.id, label: t.label, desc: t.desc, weight: t.weight, effectivePts });
    usedPts += effectivePts;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Core heuristic runner
// ---------------------------------------------------------------------------

function runNewsHeuristic(input: string): { score: number; signals: Signal[] } {
  const signals: Signal[] = [];
  let score = 20;

  const text = input.trim();

  // --- Pre-compute features ---
  const hasAttr = hasAttribution(text);
  const hasOfficialAttr = hasOfficialAttribution(text);
  const isBalanced = hasBalancedLanguage(text);
  const isShortText = text.length < 80;

  // --- Existing misinformation patterns ---
  if (/учени доказаха|изследвания показват|лекари потвърдиха/i.test(text)) {
    signals.push({
      id: "unverified-science",
      label: "Неверифицирана научна претенция",
      description: "Текстът се позовава на неуточнени изследвания или учени",
      weight: 0.4,
      isRisk: true,
    });
    score += 40;
  }

  if (/правителството крие|тайно|не искат да знаете/i.test(text)) {
    signals.push({
      id: "conspiracy-narrative",
      label: "Конспиративен наратив",
      description: "Текстът съдържа конспиративни твърдения за скрита информация",
      weight: 0.55,
      isRisk: true,
    });
    score += 55;
  }

  if (/ваксин[аи]|микрочип|5G|хемтрейл/i.test(text)) {
    signals.push({
      id: "known-disinfo",
      label: "Известна дезинформация",
      description: "Текстът засяга теми с документирани дезинформационни наративи (ваксини, 5G, хемтрейли)",
      weight: 0.5,
      isRisk: true,
    });
    score += 50;
  }

  if (hasViralCallToShare(text)) {
    signals.push({
      id: "viral-call",
      label: "Вирален призив за споделяне",
      description: "Съдържа призив за спешно масово споделяне — типична тактика за дезинформация",
      weight: 0.6,
      isRisk: true,
    });
    score += 60;
  }

  // --- Missing attribution (only for longer texts) ---
  if (!isShortText && !hasAttr) {
    signals.push({
      id: "no-attribution",
      label: "Липсваща атрибуция",
      description: "Текстът не съдържа препратка към журналист, агенция или официален източник",
      weight: 0.35,
      isRisk: true,
    });
    score += 35;
  }

  // --- Sensationalism cluster — scores are CAPPED at 60pts combined ---
  const sensationalTriggers = [
    {
      triggered: hasSensationalLanguage(text),
      id: "sensational-lang",
      label: "Емоционални суперлативи",
      desc: "Текстът използва шокиращ или сензационен език без конкретни факти",
      weight: 0.3,
    },
    {
      triggered: matchesClickbaitEnding(text),
      id: "clickbait-ending",
      label: "Клик-бейт формула",
      desc: "Текстът завършва с типична клик-бейт фраза, целяща да провокира кликване",
      weight: 0.4,
    },
    {
      triggered: /само тук|преди официалното|ексклузивно|преди да изтрие/i.test(text),
      id: "false-urgency",
      label: "Изкуствена спешност / ексклузивност",
      desc: "Твърди се, че информацията е достъпна единствено тук или ще бъде изтрита скоро",
      weight: 0.45,
    },
    {
      triggered: hasPunctuationDeficit(text),
      id: "punctuation-deficit",
      label: "Дефицит на пунктуация / главни букви",
      desc: "Текстът липсва нормална пунктуация или е изписан с главни букви — признак за ниско качество",
      weight: 0.25,
    },
  ];

  const firedSensational = cappedSensationalismScore(sensationalTriggers, 60);
  for (const s of firedSensational) {
    signals.push({ id: s.id, label: s.label, description: s.desc, weight: s.weight, isRisk: true });
    score += s.effectivePts;
  }

  // --- Political / propaganda markers ---
  // False-positive guard: suppress if text is balanced/analytical or has proper attribution
  if (hasPoliticalDisinfoMarkers(text) && !isBalanced && !hasOfficialAttr) {
    signals.push({
      id: "political-disinfo",
      label: "Политически дезинформационни маркери",
      description: "Текстът съдържа ключови думи, свързани с документирани политически дезинформационни наративи",
      weight: 0.5,
      isRisk: true,
    });
    score += 50;
  }

  // --- Pro-Kremlin narratives ---
  if (hasProKremlinNarratives(text)) {
    signals.push({
      id: "pro-kremlin",
      label: "Про-Кремълски наративи",
      description: "Текстът съдържа фрази, характерни за руска дезинформация относно войната в Украйна",
      weight: 0.65,
      isRisk: true,
    });
    score += 65;
  }

  // --- Health misinformation ---
  if (hasHealthMisinformationMarkers(text)) {
    signals.push({
      id: "health-misinfo",
      label: "Здравна дезинформация",
      description: "Текстът промотира неоснователни здравни твърдения или отрича конвенционалната медицина",
      weight: 0.55,
      isRisk: true,
    });
    score += 55;
  }

  // --- Economic clickbait ---
  if (hasEconomicClickbaitMarkers(text)) {
    signals.push({
      id: "economic-clickbait",
      label: "Икономически клик-бейт",
      description: "Текстът съдържа обещания за лесни пари или финансови тайни — характерно за измамни схеми",
      weight: 0.5,
      isRisk: true,
    });
    score += 50;
  }

  // --- Civil unrest ---
  if (hasCivilUnrestMarkers(text) && !isBalanced) {
    signals.push({
      id: "civil-unrest",
      label: "Призив за гражданско недоволство",
      description: "Текстът съдържа призиви за протести или гражданско неподчинение в провокативен контекст",
      weight: 0.45,
      isRisk: true,
    });
    score += 45;
  }

  // --- Safe: official attribution ---
  if (hasOfficialAttr) {
    signals.push({
      id: "official-attribution",
      label: "Официален институционален източник",
      description: "Текстът цитира официална българска институция (БТА, МВР, НСИ и др.) в атрибутивен контекст",
      weight: -0.25,
      isRisk: false,
    });
    score -= 25;
  }

  // --- Safe: clear attribution language ---
  if (!hasOfficialAttr && /по данни на|според официални|потвърди официално/i.test(text)) {
    signals.push({
      id: "clear-attribution",
      label: "Ясна атрибуция",
      description: "Текстът съдържа ясен език за приписване на информацията на конкретен източник",
      weight: -0.2,
      isRisk: false,
    });
    score -= 20;
  }

  // --- Safe: balanced language ---
  if (isBalanced) {
    signals.push({
      id: "balanced-language",
      label: "Балансиран език",
      description: "Текстът използва балансиран език и признава различни гледни точки",
      weight: -0.15,
      isRisk: false,
    });
    score -= 15;
  }

  if (signals.length === 0) {
    signals.push({
      id: "no-signals",
      label: "Неизвестен контекст",
      description: "Не са открити конкретни дезинформационни шаблони",
      weight: 0,
      isRisk: false,
    });
    score = 35;
  }

  return { score: Math.max(0, Math.min(100, score)), signals };
}

// ---------------------------------------------------------------------------
// Summary / evidence / next steps
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function checkNews(input: string): Promise<RawPipelineResult> {
  const { score: hScore, signals: hSignals } = runNewsHeuristic(input);
  const hVerdict = scoreToVerdict(hScore);

  let aiScore: number | undefined;
  let aiSignals: Signal[] | undefined;
  let aiSummary: string | undefined;
  let aiEvidence: Evidence[] | undefined;
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
    heuristicEvidence: [{ source: "Риторичен и структурен анализ", finding: `Анализирани са ${hSignals.length} характеристики: атрибуция, реторика, дезинформационни маркери и структура на текста.`, url: null }],
    heuristicNextSteps: buildNextSteps(hVerdict),
  };
}
