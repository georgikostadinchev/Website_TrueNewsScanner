import { type Signal, type Evidence, type RawPipelineResult, scoreToVerdict } from "./types";
import { aiCheck } from "./ai";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ParsedUrl {
  protocol: string;
  hostname: string;
  pathname: string;
  search: string;
  port: string;
  searchParams: URLSearchParams;
  valid: boolean;
}

function tryParseUrl(input: string): ParsedUrl {
  try {
    const u = new URL(input);
    return {
      protocol: u.protocol,
      hostname: u.hostname,
      pathname: u.pathname,
      search: u.search,
      port: u.port,
      searchParams: u.searchParams,
      valid: true,
    };
  } catch {
    return {
      protocol: "",
      hostname: "",
      pathname: "",
      search: "",
      port: "",
      searchParams: new URLSearchParams(),
      valid: false,
    };
  }
}

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^www\./, "").toLowerCase();
}

function getSubdomainDepth(hostname: string): number {
  return normalizeHostname(hostname).split(".").length - 2;
}

function hasRandomLookingPathSegment(pathname: string): boolean {
  return pathname.split("/").some((seg) => seg.length > 60 && /^[a-zA-Z0-9_\-]{60,}$/.test(seg));
}

function hasRedirectParams(searchParams: URLSearchParams): boolean {
  const redirectKeys = ["redirect", "url", "next", "goto", "return", "returnurl", "forward"];
  let count = 0;
  for (const key of redirectKeys) {
    if (searchParams.has(key)) count++;
  }
  return count >= 2;
}

const TRUSTED_INSTITUTION_DOMAINS = new Set([
  "gov.bg", "bnb.bg", "nap.bg", "nsi.bg", "mvr.bg", "lex.bg",
  "bta.bg", "bnr.bg", "bntnews.bg", "parliament.bg", "president.bg",
  "mfa.bg", "mon.bg", "mh.government.bg",
]);

// Exact match only — used for the safe signal score
function isExactTrustedInstitutionDomain(hostname: string): boolean {
  return TRUSTED_INSTITUTION_DOMAINS.has(normalizeHostname(hostname));
}

// Broader check (includes official subdomains) — used to suppress related risk signals
function isTrustedInstitutionDomain(hostname: string): boolean {
  const norm = normalizeHostname(hostname);
  return (
    TRUSTED_INSTITUTION_DOMAINS.has(norm) ||
    [...TRUSTED_INSTITUTION_DOMAINS].some((d) => norm.endsWith("." + d))
  );
}

const TRUSTED_MEDIA_DOMAINS = new Set([
  "bnt.bg", "nova.bg", "btv.bg", "dir.bg", "mediapool.bg",
  "dnes.bg", "actualno.com", "capital.bg",
]);

// Exact match only — used for the safe signal score
function isExactTrustedMediaDomain(hostname: string): boolean {
  return TRUSTED_MEDIA_DOMAINS.has(normalizeHostname(hostname));
}

// Broader check — used to suppress related risk signals
function isTrustedMediaDomain(hostname: string): boolean {
  const norm = normalizeHostname(hostname);
  return (
    TRUSTED_MEDIA_DOMAINS.has(norm) ||
    [...TRUSTED_MEDIA_DOMAINS].some((d) => norm.endsWith("." + d))
  );
}

const BG_BANK_BRANDS = ["unicredit", "fibank", "dsk", "postbank", "raiffeisen", "dskbank", "obbank"];
const TRUSTED_BANK_DOMAINS = new Set([
  "unicreditbulbank.bg", "fibank.bg", "dskbank.bg", "postbank.bg",
  "raiffeisenbank.bg", "ob.bg",
]);

function isBankTyposquat(hostname: string): boolean {
  const norm = normalizeHostname(hostname);
  if (TRUSTED_BANK_DOMAINS.has(norm)) return false;
  if ([...TRUSTED_BANK_DOMAINS].some((d) => norm.endsWith("." + d))) return false;
  return BG_BANK_BRANDS.some((brand) => norm.includes(brand));
}

const EXPANDED_RISKY_TLDS = /\.(ru|xyz|tk|ml|ga|cf|top|click|gq|pw|cc|su|icu|cyou|cfd|rest)$/i;

const BG_TRUSTED_DOMAINS_BROAD = /\.bg$/i;

// ---------------------------------------------------------------------------
// Core heuristic runner
// ---------------------------------------------------------------------------

function runUrlHeuristic(input: string): { score: number; signals: Signal[] } {
  const signals: Signal[] = [];
  let score = 15;

  const parsed = tryParseUrl(input);

  // --- Dangerous scheme (early exit) ---
  if (/^(data:|javascript:)/i.test(input.trim())) {
    signals.push({
      id: "dangerous-scheme",
      label: "Опасен URL протокол",
      description: "URL използва опасен протокол (data: или javascript:), типичен за XSS атаки",
      weight: 0.9,
      isRisk: true,
    });
    score += 90;
    return { score: Math.max(0, Math.min(100, score)), signals };
  }

  // --- Malformed / unparseable ---
  if (!parsed.valid) {
    signals.push({
      id: "malformed-url",
      label: "Невалиден или деформиран URL",
      description: "URL не може да бъде разпознат като валиден адрес",
      weight: 0.3,
      isRisk: true,
    });
    score += 30;
    return { score: Math.max(0, Math.min(100, score)), signals };
  }

  const { hostname, pathname, port, searchParams } = parsed;
  const norm = normalizeHostname(hostname);
  // Exact-match checks used for the safe signals (score reduction)
  const isExactInstitution = isExactTrustedInstitutionDomain(hostname);
  const isExactMedia = isExactTrustedMediaDomain(hostname);
  // Broader checks used to suppress risk signals (e.g. subdomains of official domains)
  const isTrustedInstitution = isTrustedInstitutionDomain(hostname);
  const isTrustedMedia = isTrustedMediaDomain(hostname);
  const isTrusted = isTrustedInstitution || isTrustedMedia;
  const isTrustedBank = TRUSTED_BANK_DOMAINS.has(norm) || [...TRUSTED_BANK_DOMAINS].some((d) => norm.endsWith("." + d));

  // --- Safe: trusted institution (EXACT match only) ---
  if (isExactInstitution) {
    signals.push({
      id: "trusted-institution",
      label: "Официален домейн на българска институция",
      description: "Домейнът е в точния списък на официални български институции и държавни органи",
      weight: -0.4,
      isRisk: false,
    });
    score -= 40;
  }

  // --- Safe: trusted media (EXACT match only) ---
  if (isExactMedia) {
    signals.push({
      id: "trusted-media",
      label: "Утвърдена българска медия",
      description: "Домейнът е в точния списък на утвърдени български медии с доказана репутация",
      weight: -0.25,
      isRisk: false,
    });
    score -= 25;
  }

  // --- Safe: HTTPS (only when not already trusted) ---
  if (!isTrusted && /^https:/i.test(parsed.protocol)) {
    signals.push({
      id: "https",
      label: "HTTPS криптиране",
      description: "URL използва сигурен HTTPS протокол",
      weight: -0.2,
      isRisk: false,
    });
    score -= 20;
  }

  // --- IP address as hostname ---
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    signals.push({
      id: "ip-hostname",
      label: "IP адрес вместо домейн",
      description: "URL използва IP адрес вместо домейн — типичен признак за фишинг или измамен сайт",
      weight: 0.65,
      isRisk: true,
    });
    score += 65;
  }

  // --- BG bank typosquat (skip if exact trusted bank or institution) ---
  if (!isTrusted && !isTrustedBank && isBankTyposquat(hostname)) {
    signals.push({
      id: "bank-typosquat",
      label: "Имитация на банков домейн",
      description: "Домейнът наподобява официален домейн на българска банка, но не съвпада точно — вероятна фишинг страница",
      weight: 0.75,
      isRisk: true,
    });
    score += 75;
  }

  // --- Excessive subdomain depth (skip if trusted) ---
  if (!isTrusted && getSubdomainDepth(hostname) > 3) {
    signals.push({
      id: "subdomain-depth",
      label: "Прекомерна дълбочина на поддомейни",
      description: "URL съдържа повече от 3 нива на поддомейни — характерно за фишинг сайтове, маскиращи реалния домейн",
      weight: 0.5,
      isRisk: true,
    });
    score += 50;
  }

  // --- Non-standard port ---
  if (port && port !== "80" && port !== "443") {
    signals.push({
      id: "nonstandard-port",
      label: "Нестандартен порт",
      description: `URL използва нестандартен порт (${port}), което може да сочи към злонамерен сървър`,
      weight: 0.45,
      isRisk: true,
    });
    score += 45;
  }

  // --- Long random path segment ---
  if (!isTrusted && hasRandomLookingPathSegment(pathname)) {
    signals.push({
      id: "random-path",
      label: "Подозрителен дълъг URL път",
      description: "URL съдържа необичайно дълъг сегмент в пътя — характерно за автоматично генерирани фишинг адреси",
      weight: 0.35,
      isRisk: true,
    });
    score += 35;
  }

  // --- Redirect chain (cap: max one signal for this cluster) ---
  if (!isTrusted && hasRedirectParams(searchParams)) {
    signals.push({
      id: "redirect-chain",
      label: "Индикатор за пренасочване",
      description: "URL съдържа множество параметри за пренасочване, характерни за прикриване на реалната дестинация",
      weight: 0.4,
      isRisk: true,
    });
    score += 40;
  }

  // --- No TLD / hostname without dot (parseable but structurally suspicious) ---
  if (parsed.valid && !hostname.includes(".")) {
    signals.push({
      id: "no-tld",
      label: "Домейн без TLD",
      description: "Хост адресът не съдържа домейн от най-високо ниво (TLD) — нетипично за публичен уебсайт",
      weight: 0.3,
      isRisk: true,
    });
    score += 30;
  }

  // --- TLD squatting: trusted domain name embedded in suspicious TLD ---
  const trustedBgNames = ["bta", "bnb", "mvr", "nap", "nsi", "fibank", "dsk", "postbank"];
  const isTldSquat = trustedBgNames.some((name) => norm.startsWith(name + ".bg.") || norm.includes("." + name + ".bg."));
  if (!isTrusted && isTldSquat) {
    signals.push({
      id: "tld-squat",
      label: "Злоупотреба с TLD — имитация на български домейн",
      description: "Домейнът включва разпознаваема BG марка последвана от допълнително TLD разширение (напр. bta.bg.info)",
      weight: 0.55,
      isRisk: true,
    });
    score += 55;
  }

  // --- Expanded phishing TLDs ---
  if (!isTrusted && EXPANDED_RISKY_TLDS.test(norm)) {
    signals.push({
      id: "risky-tld",
      label: "Рисков домейн",
      description: "Домейнът е регистриран в юрисдикция с висок риск от измами (.ru, .xyz, .tk, .top, .click и др.)",
      weight: 0.4,
      isRisk: true,
    });
    score += 40;
  }

  // --- Known scam keyword patterns in path/query (not domain-level) ---
  const pathAndQuery = pathname + parsed.search;
  if (!isTrusted && /win|prize|lottery|lucky/i.test(pathAndQuery)) {
    signals.push({
      id: "scam-keywords",
      label: "Измамни ключови думи в URL",
      description: "URL пътят съдържа думи, типични за измамни схеми за печалба",
      weight: 0.6,
      isRisk: true,
    });
    score += 60;
  }

  if (!isTrusted && /click-here|free-money|urgent/i.test(pathAndQuery)) {
    signals.push({
      id: "cta-keywords",
      label: "Спешен призив за действие",
      description: "URL съдържа фрази за спешно кликване или безплатна печалба",
      weight: 0.5,
      isRisk: true,
    });
    score += 50;
  }

  if (!isTrusted && /login|signin|account.*verify|verify.*account/i.test(pathAndQuery)) {
    signals.push({
      id: "phishing-path",
      label: "Фишинг индикатор",
      description: "URL пътят изглежда като страница за верификация на акаунт",
      weight: 0.7,
      isRisk: true,
    });
    score += 70;
  }

  // --- URL shortener ---
  if (!isTrusted && /bit\.ly|tinyurl|t\.co|shorturl|ow\.ly|rb\.gy|is\.gd/i.test(norm)) {
    signals.push({
      id: "url-shortener",
      label: "Скъсен URL",
      description: "URL е скъсен чрез услуга за съкращаване, което прикрива реалната дестинация",
      weight: 0.2,
      isRisk: true,
    });
    score += 20;
  }

  if (signals.length === 0) {
    signals.push({
      id: "no-signals",
      label: "Няма разпознати сигнали",
      description: "Не са открити явни рискови сигнали за този URL",
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

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function checkUrl(input: string): Promise<RawPipelineResult> {
  const { score: hScore, signals: hSignals } = runUrlHeuristic(input);
  const domain = (() => { try { return new URL(input).hostname.replace(/^www\./, ""); } catch { return input; } })();
  const hVerdict = scoreToVerdict(hScore);

  let aiScore: number | undefined;
  let aiSignals: Signal[] | undefined;
  let aiSummary: string | undefined;
  let aiEvidence: Evidence[] | undefined;
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
    heuristicEvidence: [{ source: "Структурен анализ на URL", finding: `Домейнът "${domain}" е анализиран по компоненти: протокол, хост, път, параметри.`, url: null }],
    heuristicNextSteps: buildNextSteps(hVerdict),
  };
}
