import { useRef } from "react";
import jsPDF from "jspdf";

interface Competitor {
  name: string;
  country: string;
  type: string;
  languages: string;
  checkTypes: string[];
  ai: boolean;
  community: boolean;
  realTime: boolean;
  bulgarian: boolean;
  targetSegment: string;
  strengths: string[];
  weaknesses: string[];
  businessModel: string;
  url: string;
}

const COMPETITORS: Competitor[] = [
  {
    name: "factcheck.bg",
    country: "България",
    type: "Редакционна верификация",
    languages: "Български",
    checkTypes: ["news"],
    ai: false,
    community: false,
    realTime: false,
    bulgarian: true,
    targetSegment: "Журналисти, медии",
    strengths: [
      "Авторитетна редакционна екипа",
      "Задълбочен анализ на всяка проверка",
      "Установено доверие сред медиите",
      "Пълна локализация на български",
    ],
    weaknesses: [
      "Напълно ръчен процес — без автоматизация",
      "Обработва само новини, не URL или телефони",
      "Забавено публикуване (дни до седмици)",
      "Малък капацитет — ограничен брой проверки",
    ],
    businessModel: "НПО / Донорско финансиране",
    url: "https://factcheck.bg",
  },
  {
    name: "ScamAdviser",
    country: "Нидерландия",
    type: "Автоматизирана проверка на URL",
    languages: "Английски (+ частично /bg/ маршрут)",
    checkTypes: ["url"],
    ai: false,
    community: true,
    realTime: true,
    bulgarian: false,
    targetSegment: "Потребители, търговия на дребно",
    strengths: [
      "Огромна база данни с репутационни данни",
      "Бърза автоматична оценка на рискови URL",
      "Утвърдена марка в Западна Европа",
      "API за B2B интеграция",
    ],
    weaknesses: [
      "Само URL — не проверява телефони, съобщения или новини",
      "Интерфейсът не е на български",
      "Неясна AI методология",
      "Слаба адаптация към специфично BG съдържание",
    ],
    businessModel: "Freemium / B2B API",
    url: "https://www.scamadviser.com",
  },
  {
    name: "Truecaller",
    country: "Швеция",
    type: "Мобилна идентификация на обаждания",
    languages: "Английски + 15 езика",
    checkTypes: ["phone"],
    ai: false,
    community: true,
    realTime: true,
    bulgarian: false,
    targetSegment: "Мобилни потребители",
    strengths: [
      "Над 400 млн. активни потребители глобално",
      "Голяма общностна база за докладване на телефони",
      "Мобилна интеграция в реално време",
      "Разпознаване на спам обаждания",
    ],
    weaknesses: [
      "Само телефонни номера — няма URL или текст",
      "Интерфейсът не е на български",
      "Слаба покритие на BG номера",
      "Изисква мобилно приложение",
    ],
    businessModel: "Freemium / Абонамент",
    url: "https://www.truecaller.com",
  },
  {
    name: "URLVoid",
    country: "Италия",
    type: "Агрегатор на URL репутация",
    languages: "Английски",
    checkTypes: ["url"],
    ai: false,
    community: false,
    realTime: true,
    bulgarian: false,
    targetSegment: "ИТ специалисти, сигурност",
    strengths: [
      "Агрегира данни от 30+ репутационни бази",
      "Безплатен инструмент за технически потребители",
      "Подробен технически отчет",
    ],
    weaknesses: [
      "Само на английски",
      "Само URL проверки",
      "Без AI анализ или обяснения",
      "Насочен към ИТ, не към общата публика",
    ],
    businessModel: "Безплатен / API с такса",
    url: "https://www.urlvoid.com",
  },
  {
    name: "PhishTank",
    country: "САЩ",
    type: "Общностна база за фишинг",
    languages: "Английски",
    checkTypes: ["url"],
    ai: false,
    community: true,
    realTime: false,
    bulgarian: false,
    targetSegment: "ИТ специалисти, сигурност",
    strengths: [
      "Открита общностна база данни",
      "Безплатен API",
      "Утвърден стандарт в индустрията",
    ],
    weaknesses: [
      "Само фишинг URL — ограничен обхват",
      "Само на английски",
      "Без AI или обяснения на резултатите",
      "Намалена активност на общността",
    ],
    businessModel: "Безплатен / Отворена общност",
    url: "https://www.phishtank.com",
  },
  {
    name: "Truthmeter.mk",
    country: "Северна Македония",
    type: "Редакционна верификация",
    languages: "Македонски",
    checkTypes: ["news"],
    ai: false,
    community: false,
    realTime: false,
    bulgarian: false,
    targetSegment: "Журналисти, медии",
    strengths: [
      "Регионална перспектива (Балкани)",
      "Журналистически стандарти",
      "Разбиране на регионален контекст",
    ],
    weaknesses: [
      "Само на македонски — не е на български",
      "Ръчен процес без автоматизация",
      "Само новини",
      "Ограничен капацитет",
    ],
    businessModel: "НПО / Донорско финансиране",
    url: "https://truthmeter.mk",
  },
  {
    name: "EUvsDisinfo",
    country: "ЕС (Брюксел)",
    type: "Стратегически дезинформационен анализ",
    languages: "Английски + европейски езици",
    checkTypes: ["news"],
    ai: false,
    community: false,
    realTime: false,
    bulgarian: false,
    targetSegment: "Правителство, медии, изследователи",
    strengths: [
      "Институционален авторитет на ЕС",
      "Стратегически поглед върху дезинформацията",
      "Широко покритие на про-руски наративи",
      "Партньорство с правителствени структури",
    ],
    weaknesses: [
      "Не е в реално време — публикува по-рядко",
      "Само новини, не URL или телефони",
      "Фокус върху геополитика, не върху потребителски измами",
      "Интерфейсът не е пълностойно на български",
    ],
    businessModel: "Публично финансиране (ЕС)",
    url: "https://euvsdisinfo.eu",
  },
];

const FEATURE_MATRIX = [
  { feature: "Проверка на URL", tns: true, factcheckBg: false, scamAdviser: true, truecaller: false, urlvoid: true, phishtank: true, truthmeter: false, euvsdisinfo: false },
  { feature: "Проверка на телефон", tns: true, factcheckBg: false, scamAdviser: false, truecaller: true, urlvoid: false, phishtank: false, truthmeter: false, euvsdisinfo: false },
  { feature: "Проверка на съобщение", tns: true, factcheckBg: false, scamAdviser: false, truecaller: false, urlvoid: false, phishtank: false, truthmeter: false, euvsdisinfo: false },
  { feature: "Проверка на новини", tns: true, factcheckBg: true, scamAdviser: false, truecaller: false, urlvoid: false, phishtank: false, truthmeter: true, euvsdisinfo: true },
  { feature: "AI анализ", tns: true, factcheckBg: false, scamAdviser: false, truecaller: false, urlvoid: false, phishtank: false, truthmeter: false, euvsdisinfo: false },
  { feature: "Общностни сигнали", tns: true, factcheckBg: false, scamAdviser: true, truecaller: true, urlvoid: false, phishtank: true, truthmeter: false, euvsdisinfo: false },
  { feature: "Реално време", tns: true, factcheckBg: false, scamAdviser: true, truecaller: true, urlvoid: true, phishtank: false, truthmeter: false, euvsdisinfo: false },
  { feature: "Български интерфейс", tns: true, factcheckBg: true, scamAdviser: false, truecaller: false, urlvoid: false, phishtank: false, truthmeter: false, euvsdisinfo: false },
  { feature: "Хибридна оценка", tns: true, factcheckBg: false, scamAdviser: false, truecaller: false, urlvoid: false, phishtank: false, truthmeter: false, euvsdisinfo: false },
];

function Tick() {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

function Cross() {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-400">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

export default function App() {
  const _ref = useRef<HTMLDivElement>(null);

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const ML = 36;
    const MR = 36;
    const cw = W - ML - MR;
    let y = 0;
    let pageNum = 1;
    const totalPages = 8;

    const BLUE_RGB: [number, number, number] = [30, 80, 162];
    const DARK_RGB: [number, number, number] = [17, 24, 39];
    const MUTED_RGB: [number, number, number] = [107, 114, 128];
    const LIGHT_BG_RGB: [number, number, number] = [249, 250, 251];
    const BORDER_RGB: [number, number, number] = [229, 231, 235];
    const GREEN_RGB: [number, number, number] = [22, 163, 74];
    const RED_RGB: [number, number, number] = [220, 38, 38];

    const addHeader = (subtitle: string) => {
      doc.setFillColor(...BLUE_RGB);
      doc.rect(0, 0, W, 52, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("TrueNewsScanner", ML, 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(subtitle, ML, 38);
      doc.setTextColor(...MUTED_RGB);
      doc.text("16 Април 2026", W - MR, 22, { align: "right" });
      y = 72;
    };

    const addFooter = () => {
      const py = H - 24;
      doc.setDrawColor(...BORDER_RGB);
      doc.setLineWidth(0.5);
      doc.line(ML, py - 8, W - MR, py - 8);
      doc.setFontSize(8);
      doc.setTextColor(...MUTED_RGB);
      doc.setFont("helvetica", "normal");
      doc.text("© 2026 TrueNewsScanner — Поверително", ML, py);
      doc.text(`Страница ${pageNum} от ${totalPages}`, W - MR, py, { align: "right" });
    };

    const checkSpace = (needed: number, subtitle: string) => {
      if (y + needed > H - 50) {
        addFooter();
        doc.addPage();
        pageNum++;
        addHeader(subtitle);
      }
    };

    addHeader("Конкурентен анализ");

    doc.setFillColor(...BLUE_RGB);
    doc.rect(ML, y, cw, 140, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Конкурентен анализ", ML + 20, y + 36);
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.text("TrueNewsScanner vs. Пазарни алтернативи", ML + 20, y + 60);
    doc.setFontSize(9);
    doc.setTextColor(200, 220, 255);
    doc.text("Изготвен: 16 Април 2026  |  Версия 1.0  |  Конфиденциален документ", ML + 20, y + 82);
    doc.setFontSize(8);
    doc.text("Покритие: factcheck.bg · ScamAdviser · Truecaller · URLVoid · PhishTank · Truthmeter.mk · EUvsDisinfo", ML + 20, y + 98);
    y += 162;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_RGB);
    doc.text("Изпълнително резюме", ML, y);
    y += 16;
    doc.setLineWidth(2);
    doc.setDrawColor(...BLUE_RGB);
    doc.line(ML, y, ML + 140, y);
    y += 14;

    const execLines = [
      "TrueNewsScanner навлиза в пазар с ясни пропуски. Анализът на 7 конкурентни платформи",
      "показва, че нито една не предлага едновременно: (1) пълна локализация на български език,",
      "(2) автоматична AI-базирана проверка в реално време и (3) поддръжка на всички четири типа",
      "съдържание (URL, телефон, съобщение, новини). Тази комбинация е незаета пазарна ниша.",
    ];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK_RGB);
    for (const line of execLines) {
      doc.text(line, ML, y);
      y += 14;
    }
    y += 10;

    const kpis = [
      { label: "Конкуренти анализирани", value: "7" },
      { label: "Платформи на български", value: "1" },
      { label: "AI + многотипни платформи", value: "0" },
      { label: "Уникален пазарен профил", value: "TNS" },
    ];
    const kpiW = cw / 4;
    kpis.forEach((k, i) => {
      const kx = ML + i * kpiW;
      doc.setFillColor(...LIGHT_BG_RGB);
      doc.roundedRect(kx, y, kpiW - 8, 56, 4, 4, "F");
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BLUE_RGB);
      doc.text(k.value, kx + (kpiW - 8) / 2, y + 26, { align: "center" });
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED_RGB);
      const wrapped = doc.splitTextToSize(k.label, kpiW - 16);
      wrapped.forEach((wl: string, wi: number) => {
        doc.text(wl, kx + (kpiW - 8) / 2, y + 40 + wi * 10, { align: "center" });
      });
    });
    y += 72;

    addFooter();
    doc.addPage();
    pageNum++;
    addHeader("Профили на конкурентите");

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_RGB);
    doc.text("Профили на конкурентите", ML, y);
    y += 16;
    doc.setLineWidth(2);
    doc.setDrawColor(...BLUE_RGB);
    doc.line(ML, y, ML + 160, y);
    y += 18;

    COMPETITORS.forEach((c) => {
      checkSpace(118, "Профили на конкурентите");
      const bh = 112;
      doc.setFillColor(...LIGHT_BG_RGB);
      doc.roundedRect(ML, y, cw, bh, 5, 5, "F");
      doc.setDrawColor(...BORDER_RGB);
      doc.setLineWidth(0.5);
      doc.roundedRect(ML, y, cw, bh, 5, 5, "S");
      doc.setFillColor(...BLUE_RGB);
      doc.roundedRect(ML, y, 6, bh, 2, 2, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK_RGB);
      doc.text(c.name, ML + 16, y + 17);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED_RGB);
      doc.text(`${c.country}  ·  ${c.type}  ·  ${c.businessModel}`, ML + 16, y + 30);

      doc.setFontSize(8);
      doc.setTextColor(...DARK_RGB);
      doc.text("Типове:", ML + 16, y + 44);
      doc.setTextColor(...BLUE_RGB);
      doc.text(c.checkTypes.join(", "), ML + 54, y + 44);

      doc.setTextColor(...DARK_RGB);
      doc.text("Сегмент:", ML + 16, y + 57);
      doc.setTextColor(...BLUE_RGB);
      doc.text(c.targetSegment, ML + 58, y + 57);

      doc.setTextColor(...DARK_RGB);
      doc.text("Силни:", ML + 16, y + 70);
      doc.setTextColor(22, 120, 60);
      doc.text(doc.splitTextToSize(c.strengths.slice(0, 2).join("  ·  "), cw - 80)[0], ML + 52, y + 70);

      doc.setTextColor(...DARK_RGB);
      doc.text("Слаби:", ML + 16, y + 83);
      doc.setTextColor(...RED_RGB);
      doc.text(doc.splitTextToSize(c.weaknesses.slice(0, 2).join("  ·  "), cw - 80)[0], ML + 52, y + 83);

      const badges: [string, boolean][] = [["AI", c.ai], ["Общност", c.community], ["Реално вр.", c.realTime], ["Български", c.bulgarian]];
      badges.forEach(([lbl, val], fi) => {
        const fx = ML + 16 + fi * 94;
        doc.setFillColor(val ? 220 : 254, val ? 252 : 226, val ? 231 : 226);
        doc.roundedRect(fx, y + 94, 86, 12, 2, 2, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", val ? "bold" : "normal");
        if (val) { doc.setTextColor(...GREEN_RGB); } else { doc.setTextColor(...RED_RGB); }
        doc.text(`${val ? "✓" : "✗"} ${lbl}`, fx + 43, y + 103, { align: "center" });
      });

      y += bh + 6;
    });

    addFooter();
    doc.addPage();
    pageNum++;
    addHeader("Матрица на функциите");

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_RGB);
    doc.text("Матрица на функциите", ML, y);
    y += 16;
    doc.setLineWidth(2);
    doc.setDrawColor(...BLUE_RGB);
    doc.line(ML, y, ML + 160, y);
    y += 18;

    const colHeaders = ["TrueNewsScanner", "factcheck.bg", "ScamAdviser", "Truecaller", "URLVoid", "PhishTank", "Truthmeter", "EUvsDisinfo"];
    const featColW = 120;
    const valColW = (cw - featColW) / colHeaders.length;

    doc.setFillColor(...BLUE_RGB);
    doc.rect(ML, y, featColW, 24, "F");
    doc.setFillColor(40, 60, 100);
    doc.rect(ML + featColW, y, cw - featColW, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("Функция", ML + 4, y + 15);
    colHeaders.forEach((h, ci) => {
      const cx = ML + featColW + ci * valColW;
      if (ci === 0) doc.setFillColor(...BLUE_RGB);
      else doc.setFillColor(40, 60, 100);
      doc.rect(cx, y, valColW, 24, "F");
      const wh = doc.splitTextToSize(h, valColW - 4);
      doc.setFontSize(6.5);
      doc.text(wh, cx + valColW / 2, y + (wh.length > 1 ? 9 : 15), { align: "center" });
    });
    y += 24;

    FEATURE_MATRIX.forEach((row, ri) => {
      const vals = [row.tns, row.factcheckBg, row.scamAdviser, row.truecaller, row.urlvoid, row.phishtank, row.truthmeter, row.euvsdisinfo];
      doc.setFillColor(ri % 2 === 0 ? 255 : 249, ri % 2 === 0 ? 255 : 250, ri % 2 === 0 ? 255 : 251);
      doc.rect(ML, y, cw, 20, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK_RGB);
      doc.text(row.feature, ML + 4, y + 13);
      vals.forEach((v, ci) => {
        const cx = ML + featColW + ci * valColW;
        doc.setFontSize(10);
        if (v) { doc.setTextColor(...GREEN_RGB); } else { doc.setTextColor(...RED_RGB); }
        doc.text(v ? "✓" : "✗", cx + valColW / 2, y + 13, { align: "center" });
      });
      y += 20;
    });
    doc.setDrawColor(...BORDER_RGB);
    doc.setLineWidth(0.4);
    doc.rect(ML, y - FEATURE_MATRIX.length * 20, cw, FEATURE_MATRIX.length * 20, "S");
    y += 16;

    addFooter();
    doc.addPage();
    pageNum++;
    addHeader("SWOT Анализ");

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_RGB);
    doc.text("SWOT Анализ", ML, y);
    y += 16;
    doc.setLineWidth(2);
    doc.setDrawColor(...BLUE_RGB);
    doc.line(ML, y, ML + 100, y);
    y += 18;

    const swotItems = [
      { title: "Силни страни", color: [22, 163, 74] as [number, number, number], items: ["Единствена платформа на пълен български език", "Всички 4 типа: URL, телефон, съобщение, новини", "Хибридна AI + евристична оценка", "Общностни сигнали с верифицирано тегло", "Реално време — под 5 секунди"] },
      { title: "Слаби страни", color: [220, 38, 38] as [number, number, number], items: ["По-малка репутационна база от утвърдени играчи", "Зависимост от OpenAI API при мащабиране", "Нова марка без изградено масово доверие", "Ограничена общностна база в началото"] },
      { title: "Възможности", color: [37, 99, 235] as [number, number, number], items: ["Никой конкурент не покрива BG + AI + multi-type", "Нарастваща загриженост за онлайн измами", "DSA/GDPR отваря регулаторен B2B пазар", "Партньорства с банки, медии, правителство", "Балканска регионална експанзия"] },
      { title: "Заплахи", color: [217, 119, 6] as [number, number, number], items: ["ScamAdviser може да подобри BG локализацията", "Вградена проверка от Google/Meta", "Регулаторни изисквания за AI верификация", "Нарастващи API разходи при мащабиране"] },
    ];

    const swW = (cw - 8) / 2;
    swotItems.forEach((s, si) => {
      const sx = ML + (si % 2) * (swW + 8);
      const sy = y + Math.floor(si / 2) * 122;
      const [sr, sg, sb] = s.color;
      doc.setFillColor(sr, sg, sb);
      doc.rect(sx, sy, swW, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(s.title, sx + 8, sy + 12);
      doc.setFillColor(250, 251, 252);
      doc.rect(sx, sy + 18, swW, 100, "F");
      doc.setDrawColor(sr, sg, sb);
      doc.setLineWidth(0.3);
      doc.rect(sx, sy, swW, 118, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...DARK_RGB);
      s.items.forEach((item, ii) => {
        doc.text(`• ${item}`, sx + 8, sy + 34 + ii * 14, { maxWidth: swW - 14 });
      });
    });
    y += 260;

    addFooter();
    doc.addPage();
    pageNum++;
    addHeader("Пазарно позициониране");

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_RGB);
    doc.text("Пазарно позициониране", ML, y);
    y += 16;
    doc.setLineWidth(2);
    doc.setDrawColor(...BLUE_RGB);
    doc.line(ML, y, ML + 160, y);
    y += 18;

    const posLines = [
      "Анализът потвърждава, че TrueNewsScanner заема уникална позиция на пазара. Нито един",
      "от разгледаните конкуренти не комбинира: (1) пълен български интерфейс, (2) автоматизирана",
      "AI проверка в реално време и (3) поддръжка на всички 4 типа съдържание едновременно.",
    ];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK_RGB);
    for (const line of posLines) {
      doc.text(line, ML, y);
      y += 14;
    }
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Целеви пазарни сегменти", ML, y);
    y += 14;

    const segments = [
      { title: "Потребители", desc: "Пряк достъп чрез уеб и мобил. Защита от SMS фишинг, телефонни измами и фалшиви новини в реално време.", score: 95 },
      { title: "Журналисти и медии", desc: "API достъп, масово проверяване на линкове, интеграция в редакционни системи. Директна алтернатива на factcheck.bg с автоматизация.", score: 80 },
      { title: "Бизнес", desc: "API за банки, телеком и e-commerce за верификация на транзакции и регистрации в реално време.", score: 75 },
      { title: "Правителство", desc: "Бяло-лейблово решение за КЗП, МВР и ДАНС. Пълна локализация и съответствие с националното законодателство.", score: 70 },
    ];

    segments.forEach((seg) => {
      checkSpace(60, "Пазарно позициониране");
      doc.setFillColor(...LIGHT_BG_RGB);
      doc.roundedRect(ML, y, cw, 52, 4, 4, "F");
      doc.setDrawColor(...BORDER_RGB);
      doc.setLineWidth(0.3);
      doc.roundedRect(ML, y, cw, 52, 4, 4, "S");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK_RGB);
      doc.text(seg.title, ML + 12, y + 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED_RGB);
      const wrapped = doc.splitTextToSize(seg.desc, cw - 120);
      doc.text(wrapped, ML + 12, y + 30);

      const barX = W - MR - 80;
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(barX, y + 12, 72, 10, 3, 3, "F");
      doc.setFillColor(...BLUE_RGB);
      doc.roundedRect(barX, y + 12, 72 * seg.score / 100, 10, 3, 3, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK_RGB);
      doc.text(`${seg.score}%`, barX + 36, y + 10, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED_RGB);
      doc.text("Приоритет", barX + 36, y + 32, { align: "center" });

      y += 60;
    });

    addFooter();
    doc.addPage();
    pageNum++;
    addHeader("Стратегически препоръки");

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_RGB);
    doc.text("Стратегически препоръки", ML, y);
    y += 16;
    doc.setLineWidth(2);
    doc.setDrawColor(...BLUE_RGB);
    doc.line(ML, y, ML + 170, y);
    y += 18;

    const recs = [
      {
        badge: "ВИСОК ПРИОРИТЕТ", badgeColor: [220, 38, 38] as [number, number, number],
        title: "1. Позициониране като \"Bulgarian-First AI Scanner\"",
        items: ["Маркетинг фокус: единствената пълна AI платформа в България", "Активна SEO стратегия на български за \"проверка на измами\"", "Партньорства с НПО, медии и граждански организации"],
      },
      {
        badge: "ВИСОК ПРИОРИТЕТ", badgeColor: [220, 38, 38] as [number, number, number],
        title: "2. B2B API продукт — Банки, телеком и e-commerce",
        items: ["API тарифни планове с документация и SLA гаранции", "Пилотно партньорство с 2-3 банки или телеком оператора", "Интеграция с KYC/AML системи за финансовия сектор"],
      },
      {
        badge: "СРЕДЕН ПРИОРИТЕТ", badgeColor: [245, 158, 11] as [number, number, number],
        title: "3. Общностна стратегия — Trusted reporter мрежа",
        items: ["Gamification система за докладване (точки, значки)", "Партньорство с журналисти за верифициране на данни", "Отворен dataset на проверени измами за изследователи"],
      },
      {
        badge: "СРЕДЕН ПРИОРИТЕТ", badgeColor: [245, 158, 11] as [number, number, number],
        title: "4. Регионална експанзия — Балкани (Q3-Q4 2026)",
        items: ["Адаптация за македонски и сръбски езици", "Партньорство с Truthmeter.mk за споделен dataset", "Интеграция с EUvsDisinfo за геополитически контекст"],
      },
    ];

    recs.forEach((rec) => {
      checkSpace(96, "Стратегически препоръки");
      const [br, bg, bb] = rec.badgeColor;
      doc.setFillColor(br, bg, bb);
      doc.roundedRect(ML, y, 100, 14, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(rec.badge, ML + 50, y + 9.5, { align: "center" });
      y += 18;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK_RGB);
      doc.text(rec.title, ML, y);
      y += 14;

      rec.items.forEach((item) => {
        doc.setFillColor(...BLUE_RGB);
        doc.circle(ML + 4, y + 3.5, 2.5, "F");
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK_RGB);
        doc.text(item, ML + 14, y + 7, { maxWidth: cw - 14 });
        y += 16;
      });
      y += 10;
    });

    addFooter();
    doc.addPage();
    pageNum++;
    addHeader("Конкурентен мониторинг");

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_RGB);
    doc.text("Конкурентен мониторинг", ML, y);
    y += 16;
    doc.setLineWidth(2);
    doc.setDrawColor(...BLUE_RGB);
    doc.line(ML, y, ML + 170, y);
    y += 18;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK_RGB);
    doc.text("Следните сигнали трябва да се наблюдават на тримесечна база:", ML, y);
    y += 18;

    const monitorItems = [
      { title: "ScamAdviser — Езикова стратегия", desc: "Следете дали ScamAdviser добавя пълен /bg/ интерфейс или нови BG-специфични функции.", freq: "Тримесечно", risk: "Висок", rc: [220, 38, 38] as [number, number, number] },
      { title: "factcheck.bg — Технологично развитие", desc: "Наблюдавайте дали factcheck.bg добавя автоматизация или AI функционалност.", freq: "Тримесечно", risk: "Среден", rc: [217, 119, 6] as [number, number, number] },
      { title: "Нови навлизащи — AI проверка", desc: "Мониторинг на нови стартъпи в ЦИЕ с фокус върху AI дезинформация на local езици.", freq: "Тримесечно", risk: "Среден", rc: [217, 119, 6] as [number, number, number] },
      { title: "Google/Meta — Вградена проверка", desc: "Следете анонси за вградени scam detection функции в Bulgarian markets.", freq: "Месечно", risk: "Висок", rc: [220, 38, 38] as [number, number, number] },
      { title: "ЕС Регулации — DSA/AI Act", desc: "Нови регулаторни изисквания, открили задължителен B2B пазар.", freq: "Тримесечно", risk: "Нисък", rc: [22, 163, 74] as [number, number, number] },
    ];

    monitorItems.forEach((item) => {
      checkSpace(52, "Конкурентен мониторинг");
      doc.setFillColor(...LIGHT_BG_RGB);
      doc.roundedRect(ML, y, cw, 44, 4, 4, "F");
      doc.setDrawColor(...BORDER_RGB);
      doc.setLineWidth(0.3);
      doc.roundedRect(ML, y, cw, 44, 4, 4, "S");

      const [rr, rg, rb] = item.rc;
      doc.setFillColor(rr, rg, rb);
      doc.roundedRect(ML + 12, y + 26, 60, 12, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(`Риск: ${item.risk}`, ML + 42, y + 34, { align: "center" });

      doc.setFillColor(...BLUE_RGB);
      doc.roundedRect(ML + 78, y + 26, 60, 12, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(item.freq, ML + 108, y + 34, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK_RGB);
      doc.text(item.title, ML + 12, y + 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED_RGB);
      doc.text(doc.splitTextToSize(item.desc, cw - 80)[0], ML + 150, y + 16);

      y += 52;
    });

    addFooter();
    doc.addPage();
    pageNum++;
    addHeader("Заключение");

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_RGB);
    doc.text("Заключение", ML, y);
    y += 16;
    doc.setLineWidth(2);
    doc.setDrawColor(...BLUE_RGB);
    doc.line(ML, y, ML + 100, y);
    y += 22;

    doc.setFillColor(...BLUE_RGB);
    doc.roundedRect(ML, y, cw, 110, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("TrueNewsScanner е единствената Bulgarian-First,", ML + 20, y + 28);
    doc.text("AI-Powered, Multi-Type платформа за проверка.", ML + 20, y + 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 220, 255);
    const concl = ["Анализът на 7 конкурента показва ясна незаета ниша. Нито един съществуващ играч", "не предлага комбинацията от пълен BG език + AI автоматизация + 4 типа съдържание."];
    concl.forEach((line, li) => { doc.text(line, ML + 20, y + 70 + li * 14); });
    y += 128;

    const fm = [
      { label: "Уникални функции спрямо конкурентите", value: "4/4" },
      { label: "Конкуренти с пълен BG интерфейс", value: "0 от 7" },
      { label: "Конкуренти с AI + multi-type", value: "0 от 7" },
      { label: "Пазарна готовност", value: "Висока" },
    ];
    const fmW = cw / 4;
    fm.forEach((f, fi) => {
      const fx = ML + fi * fmW;
      doc.setFillColor(...LIGHT_BG_RGB);
      doc.roundedRect(fx, y, fmW - 8, 64, 4, 4, "F");
      doc.setDrawColor(...BORDER_RGB);
      doc.setLineWidth(0.3);
      doc.roundedRect(fx, y, fmW - 8, 64, 4, 4, "S");
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BLUE_RGB);
      doc.text(f.value, fx + (fmW - 8) / 2, y + 28, { align: "center" });
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED_RGB);
      const wl = doc.splitTextToSize(f.label, fmW - 16);
      wl.forEach((l: string, li: number) => {
        doc.text(l, fx + (fmW - 8) / 2, y + 44 + li * 11, { align: "center" });
      });
    });
    y += 80;

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...MUTED_RGB);
    doc.text("Настоящият анализ е изготвен на 16 Април 2026 г. и отразява публично достъпна информация към тази дата.", ML, y);
    y += 14;
    doc.text("Препоръките са стратегически насоки и не представляват правно или финансово съвет.", ML, y);

    addFooter();

    doc.save("TrueNewsScanner-Competitive-Analysis-2026.pdf");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-[#1e50a2] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="white" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-base leading-tight">TrueNewsScanner</div>
              <div className="text-xs text-blue-200">Конкурентен анализ · 16 Април 2026</div>
            </div>
          </div>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-white text-[#1e50a2] font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors shadow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Свали PDF
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">

        <section className="bg-[#1e50a2] rounded-2xl text-white overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-3">Конкурентен анализ · Поверителен</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
              TrueNewsScanner vs.<br className="hidden md:block" /> Пазарните алтернативи
            </h1>
            <p className="text-blue-100 text-base max-w-2xl mb-8">
              Задълбочен анализ на 7 конкурентни платформи, стратегическо позициониране и
              препоръки за растеж на единствената Bulgarian-First AI платформа за проверка на съдържание.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { v: "7", l: "Конкуренти анализирани" },
                { v: "0 от 7", l: "AI + BG + Multi-type" },
                { v: "Незаета", l: "Пазарна ниша" },
                { v: "4/4", l: "Уникални функции" },
              ].map((stat) => (
                <div key={stat.l} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="text-2xl md:text-3xl font-bold">{stat.v}</div>
                  <div className="text-xs text-blue-200 mt-1">{stat.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Изпълнително резюме</h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-700 leading-relaxed mb-4">
              Анализът на 7 конкурентни платформи потвърждава, че <strong>TrueNewsScanner заема уникална незаета пазарна ниша</strong>.
              Нито един съществуващ играч не предлага едновременно: пълна локализация на български език,
              автоматизирана AI проверка в реално време и поддръжка на всички 4 типа съдържание.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Конкурентите се делят в три категории: <em>редакционни верификатори</em> (factcheck.bg, Truthmeter.mk, EUvsDisinfo),
              <em> автоматизирани еднотипни скенери</em> (ScamAdviser, URLVoid, PhishTank, Truecaller),
              и нито един с пълната комбинация от функции.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Пазарна ниша", desc: "Нито един конкурент не покрива Bulgarian + AI + реално време + 4 типа съдържание", color: "border-l-4 border-green-500 bg-green-50 text-green-900" },
                { title: "Главен риск", desc: "ScamAdviser може да подобри BG локализацията — наблюдава се тримесечно", color: "border-l-4 border-red-500 bg-red-50 text-red-900" },
                { title: "B2B приоритет", desc: "API за банки и телеком — незаета ниша с висок приходен потенциал", color: "border-l-4 border-blue-500 bg-blue-50 text-blue-900" },
              ].map((box) => (
                <div key={box.title} className={`rounded-xl p-4 ${box.color}`}>
                  <div className="font-semibold text-sm mb-1">{box.title}</div>
                  <div className="text-sm opacity-80">{box.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Профили на конкурентите</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {COMPETITORS.map((c) => (
              <div key={c.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#1e50a2] px-5 py-4 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">{c.name}</h3>
                    <p className="text-blue-200 text-xs mt-0.5">{c.country} · {c.type}</p>
                  </div>
                  <span className="bg-white/20 text-white text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">{c.businessModel}</span>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.checkTypes.map((t) => <span key={t} className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full capitalize">{t}</span>)}
                    {c.ai && <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">AI</span>}
                    {c.realTime && <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">Реално време</span>}
                    {c.bulgarian && <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">Български</span>}
                    {c.community && <span className="bg-teal-100 text-teal-700 text-xs font-medium px-2 py-0.5 rounded-full">Общност</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Силни страни</div>
                      <ul className="space-y-1">
                        {c.strengths.map((s) => (
                          <li key={s} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-green-500 shrink-0 mt-0.5">✓</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Слаби страни</div>
                      <ul className="space-y-1">
                        {c.weaknesses.map((w) => (
                          <li key={w} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-red-500 shrink-0 mt-0.5">✗</span>{w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>Сегмент: <strong className="text-gray-700">{c.targetSegment}</strong></span>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{c.url.replace("https://", "")}</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Матрица на функциите</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 bg-[#1e50a2] text-white font-semibold rounded-tl-2xl min-w-[160px]">Функция</th>
                  <th className="px-3 py-3 bg-blue-900 text-white font-bold text-center text-xs min-w-[90px]">TrueNewsScanner</th>
                  {["factcheck.bg", "ScamAdviser", "Truecaller", "URLVoid", "PhishTank", "Truthmeter.mk", "EUvsDisinfo"].map((h, i) => (
                    <th key={h} className={`px-3 py-3 text-center text-xs font-medium min-w-[80px] ${i === 6 ? "rounded-tr-2xl" : ""} bg-[#1e50a2] text-blue-200`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_MATRIX.map((row, ri) => (
                  <tr key={row.feature} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-2.5 font-medium text-gray-800 text-sm">{row.feature}</td>
                    <td className="px-3 py-2.5 text-center bg-blue-50"><Tick /></td>
                    <td className="px-3 py-2.5 text-center">{row.factcheckBg ? <Tick /> : <Cross />}</td>
                    <td className="px-3 py-2.5 text-center">{row.scamAdviser ? <Tick /> : <Cross />}</td>
                    <td className="px-3 py-2.5 text-center">{row.truecaller ? <Tick /> : <Cross />}</td>
                    <td className="px-3 py-2.5 text-center">{row.urlvoid ? <Tick /> : <Cross />}</td>
                    <td className="px-3 py-2.5 text-center">{row.phishtank ? <Tick /> : <Cross />}</td>
                    <td className="px-3 py-2.5 text-center">{row.truthmeter ? <Tick /> : <Cross />}</td>
                    <td className="px-3 py-2.5 text-center">{row.euvsdisinfo ? <Tick /> : <Cross />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2 px-1">TrueNewsScanner е единствената платформа с всички 9 функции отбелязани.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">SWOT Анализ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Силни страни", color: "bg-green-600", bg: "bg-green-50 border-green-200", text: "text-green-900", icon: "↑", items: ["Единствена платформа на пълен български език", "Всички 4 типа: URL, телефон, съобщение, новини", "Хибридна AI + евристична оценка", "Общностни сигнали с верифицирано тегло", "Реално време — резултати под 5 секунди"] },
              { title: "Слаби страни", color: "bg-red-600", bg: "bg-red-50 border-red-200", text: "text-red-900", icon: "↓", items: ["По-малка репутационна база от утвърдени играчи", "Зависимост от OpenAI API при мащабиране", "Нова марка без изградено масово доверие", "Ограничена общностна база в началния период"] },
              { title: "Възможности", color: "bg-blue-600", bg: "bg-blue-50 border-blue-200", text: "text-blue-900", icon: "→", items: ["Никой конкурент не покрива BG + AI + multi-type", "Нарастваща загриженост за онлайн измами", "DSA/GDPR отваря регулаторен B2B пазар", "Партньорства с банки, медии, правителство", "Балканска регионална експанзия"] },
              { title: "Заплахи", color: "bg-amber-500", bg: "bg-amber-50 border-amber-200", text: "text-amber-900", icon: "⚠", items: ["ScamAdviser може да подобри BG локализацията", "Вградена проверка от Google/Meta", "Регулаторни изисквания за AI верификация", "Нарастващи API разходи при мащабиране"] },
            ].map((s) => (
              <div key={s.title} className={`rounded-2xl border overflow-hidden ${s.bg}`}>
                <div className={`${s.color} px-5 py-3 flex items-center gap-2`}>
                  <span className="text-white text-lg font-bold">{s.icon}</span>
                  <h3 className="text-white font-bold text-sm">{s.title}</h3>
                </div>
                <ul className="p-5 space-y-2">
                  {s.items.map((item) => (
                    <li key={item} className={`text-sm ${s.text} flex items-start gap-2`}>
                      <span className="mt-1 shrink-0 opacity-60">•</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Стратегически препоръки</h2>
          <div className="space-y-4">
            {[
              { badge: "ВИСОК ПРИОРИТЕТ", badgeColor: "bg-red-600", title: "1. Позициониране като \"Bulgarian-First AI Scanner\"", items: ["Маркетинг фокус: единствената пълна AI платформа за проверка в България", "Активна SEO стратегия на български за \"проверка на измами\", \"фалшиви новини\"", "Партньорства с граждански организации и водещи медии"] },
              { badge: "ВИСОК ПРИОРИТЕТ", badgeColor: "bg-red-600", title: "2. B2B API продукт — Банки, телеком и e-commerce", items: ["API тарифни планове с документация и SLA гаранции", "Пилотно партньорство с 2-3 банки или телеком оператора", "Интеграция с KYC/AML системи за финансовия сектор"] },
              { badge: "СРЕДЕН ПРИОРИТЕТ", badgeColor: "bg-amber-500", title: "3. Общностна стратегия — Изграждане на trusted reporter мрежа", items: ["Gamification система за докладване (точки, значки, класация)", "Партньорство с журналисти и факт-чекъри за верифициране", "Отворен dataset на проверени измами за изследователи"] },
              { badge: "СРЕДЕН ПРИОРИТЕТ", badgeColor: "bg-amber-500", title: "4. Регионална експанзия — Балкани (Q3-Q4 2026)", items: ["Адаптация за македонски и сръбски езици", "Партньорство с Truthmeter.mk за споделен dataset", "Интеграция с EUvsDisinfo за геополитически контекст"] },
            ].map((rec) => (
              <div key={rec.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start gap-4">
                  <span className={`${rec.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shrink-0 mt-0.5`}>{rec.badge}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">{rec.title}</h3>
                    <ul className="space-y-1.5">
                      {rec.items.map((item) => (
                        <li key={item} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-blue-500 shrink-0 mt-0.5">→</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Конкурентен мониторинг</h2>
          <div className="space-y-3">
            {[
              { title: "ScamAdviser — Езикова стратегия", freq: "Тримесечно", risk: "Висок", desc: "Следете дали ScamAdviser добавя пълен /bg/ интерфейс или нови BG-специфични функции.", riskColor: "bg-red-100 text-red-700" },
              { title: "factcheck.bg — Технологично развитие", freq: "Тримесечно", risk: "Среден", desc: "Наблюдавайте дали factcheck.bg добавя автоматизация или AI функционалност.", riskColor: "bg-amber-100 text-amber-700" },
              { title: "Нови навлизащи — AI проверка", freq: "Тримесечно", risk: "Среден", desc: "Мониторинг на нови стартъпи в ЦИЕ с фокус върху AI дезинформация на local езици.", riskColor: "bg-amber-100 text-amber-700" },
              { title: "Google/Meta — Вградена проверка", freq: "Месечно", risk: "Висок", desc: "Следете анонси за вградени scam detection функции в Bulgarian markets.", riskColor: "bg-red-100 text-red-700" },
              { title: "ЕС Регулации — DSA/AI Act", freq: "Тримесечно", risk: "Нисък", desc: "Нови регулаторни изисквания, способни да отворят задължителен B2B пазар.", riskColor: "bg-green-100 text-green-700" },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{item.title}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{item.desc}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.riskColor}`}>Риск: {item.risk}</span>
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">{item.freq}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#1e50a2] rounded-2xl text-white p-8">
          <h2 className="text-xl font-bold mb-4">Заключение</h2>
          <p className="text-blue-100 text-base leading-relaxed mb-6 max-w-3xl">
            TrueNewsScanner е единствената <strong className="text-white">Bulgarian-First, AI-Powered, Multi-Type</strong> платформа
            за проверка на съдържание. Анализът потвърждава ясна незаета ниша — нито един от 7-те конкурента
            не предлага тази комбинация. Препоръчваме незабавна реализация на B2B API стратегията
            и активен мониторинг на ScamAdviser като основен конкурентен риск.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { v: "4/4", l: "Уникални функции спрямо конкурентите" },
              { v: "0 от 7", l: "Конкуренти с BG + AI + multi-type" },
              { v: "Висока", l: "Пазарна готовност" },
              { v: "Q2 2026", l: "Целеви старт B2B" },
            ].map((stat) => (
              <div key={stat.l} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{stat.v}</div>
                <div className="text-xs text-blue-200 mt-1">{stat.l}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center text-xs text-gray-400 pb-6">
          © 2026 TrueNewsScanner · Конкурентен анализ · 16 Април 2026 · Поверителен документ
        </footer>
      </main>
    </div>
  );
}
