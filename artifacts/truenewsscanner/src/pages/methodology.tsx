import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Globe,
  Phone,
  MessageSquare,
  Newspaper,
  Brain,
  Users,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Layers,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  signals: { label: string; detail: string }[];
  index: number;
  accent: string;
}

function CheckSection({ icon, title, description, signals, index, accent }: SectionProps) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <p className="text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {signals.map((s) => (
          <div key={s.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50 border border-border">
            <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const sections: Omit<SectionProps, "index">[] = [
  {
    icon: <Globe className="w-6 h-6 text-blue-500" />,
    title: "Проверка на URL адреси",
    description:
      "Анализираме структурата, домейна и поведението на уеб адреса, за да открием измамни сайтове, фишинг и фалшиви онлайн магазини.",
    accent: "bg-blue-500/10",
    signals: [
      {
        label: "Имитация на марки",
        detail: "Открива думи като 'vivacom', 'postbank', 'dhl' в подозрителни домейни.",
      },
      {
        label: "Подозрителни ключови думи",
        detail: "Сканира за 'promo', 'win', 'free', 'спечели', 'награда' в пътя на URL-а.",
      },
      {
        label: "Липса на HTTPS",
        detail: "HTTP без криптиране е рисков индикатор при финансови сайтове.",
      },
      {
        label: "Необичайни разширения",
        detail: "Домейни с .xyz, .top, .click са статистически по-чести при измами.",
      },
      {
        label: "Прекалено дълъг URL",
        detail: "Адреси с дълги произволни низове са характерни за фишинг.",
      },
      {
        label: "IP адрес вместо домейн",
        detail: "Директни IP адреси вместо имена са силен сигнал за измама.",
      },
    ],
  },
  {
    icon: <Phone className="w-6 h-6 text-emerald-500" />,
    title: "Проверка на телефонни номера",
    description:
      "Валидираме формата и префикса на номера и го сравняваме с база данни от докладвани измамни контакти.",
    accent: "bg-emerald-500/10",
    signals: [
      {
        label: "Формат и валидност",
        detail: "Проверяваме дали номерът е валиден български мобилен или фиксиран номер.",
      },
      {
        label: "Рискови префикси",
        detail: "Номера с +44, +1900 или известни измамни префикси получават по-висок рисков бал.",
      },
      {
        label: "Общностни доклади",
        detail: "Колко пъти е докладван номерът от потребители на платформата.",
      },
      {
        label: "Честота на докладване",
        detail: "Скорошни и многократни доклади увеличават оценката автоматично.",
      },
    ],
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-violet-500" />,
    title: "Проверка на съобщения",
    description:
      "Анализираме текст на SMS, имейл или чат съобщение за манипулативни техники, спешност и искане на лични данни.",
    accent: "bg-violet-500/10",
    signals: [
      {
        label: "Изкуствена спешност",
        detail: "Фрази като 'веднага', 'изтича', 'последен шанс' са класически измамни сигнали.",
      },
      {
        label: "Финансова примамка",
        detail: "Обещания за награди, компенсации или необичайно изгодни оферти.",
      },
      {
        label: "Искане на лични данни",
        detail: "Молба за ЕГН, парола, номер на карта или банкова сметка.",
      },
      {
        label: "Вградени подозрителни връзки",
        detail: "URL адреси в текста се проверяват отделно по URL правилата.",
      },
    ],
  },
  {
    icon: <Newspaper className="w-6 h-6 text-amber-500" />,
    title: "Проверка на новини",
    description:
      "Оценяваме достоверността на новинарски текстове и публикации чрез разпознаване на манипулативен език и анализ на твърдения.",
    accent: "bg-amber-500/10",
    signals: [
      {
        label: "Сензационен заглавен ред",
        detail: "Клик-бейт заглавия с преувеличени твърдения или ВСИЧКИ ГЛАВНИ БУКВИ.",
      },
      {
        label: "Конспиративни фрази",
        detail: "Думи като 'правителството крие', 'масова измама', 'те не искат да знаеш'.",
      },
      {
        label: "Липса на източници",
        detail: "Новини без цитирани медии, институции или конкретни лица.",
      },
      {
        label: "Емоционална манипулация",
        detail: "Текст, проектиран да предизвика страх, гняв или паника.",
      },
    ],
  },
];

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-14 space-y-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-2">
          <Layers className="w-4 h-4" />
          Прозрачност
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Как проверяваме фактите
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          TrueNewsScanner използва многопластова система за оценка — комбинация от{" "}
          <span className="text-foreground font-medium">евристични правила</span>,{" "}
          <span className="text-foreground font-medium">изкуствен интелект</span> и{" "}
          <span className="text-foreground font-medium">общностни доклади</span>. Предоставяме
          вероятностна оценка, не абсолютна истина.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid md:grid-cols-3 gap-4"
      >
        {[
          {
            icon: <ShieldCheck className="w-5 h-5 text-primary" />,
            label: "Евристичен анализ",
            detail: "Над 30 правила, специфични за всеки тип съдържание",
          },
          {
            icon: <Brain className="w-5 h-5 text-violet-500" />,
            label: "AI семантичен анализ",
            detail: "GPT модел за разбиране на контекст и намерение",
          },
          {
            icon: <Users className="w-5 h-5 text-emerald-500" />,
            label: "Общностни доклади",
            detail: "Потребителски сигнали, включени в крайната оценка",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-card p-5 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="space-y-6">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-2xl font-bold text-foreground"
        >
          Сигнали по тип съдържание
        </motion.h2>
        {sections.map((s, i) => (
          <CheckSection key={s.title} {...s} index={i} />
        ))}
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={0}
        className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">AI слой — GPT семантичен анализ</h3>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              След евристичния анализ, съдържанието се изпраща към GPT модел, който оценява
              контекста, намерението и манипулативния потенциал. AI сигналите допълват, но не
              заменят правилата.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: "Контекстуален анализ", detail: "Разбиране на смисъла отвъд ключовите думи." },
            { label: "Намерение за измама", detail: "Оценка дали текстът е проектиран да заблуди." },
            { label: "Правдоподобност", detail: "Логическа последователност и реалистичност на твърденията." },
            { label: "Манипулативен тон", detail: "Засичане на емоционална манипулация и натиск." },
            { label: "Идентификация на субект", detail: "Разпознаване на имитирани брандове или институции." },
            { label: "AI доверие", detail: "AI дава оценка на собствената си увереност в анализа.", },
          ].map((s) => (
            <div key={s.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50 border border-border">
              <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={0}
        className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Крайна оценка и вердикт</h3>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              Всички сигнали се комбинират в рискова оценка от <strong>0 до 100</strong>. По-високата
              стойност означава по-голям риск. Вердиктът се определя по следния праг:
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { range: "0 – 29", label: "Безопасно", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
            { range: "30 – 59", label: "Подозрително", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20", icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
            { range: "60 – 100", label: "Опасно / Измама", color: "text-red-600", bg: "bg-red-500/10 border-red-500/20", icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
          ].map((v) => (
            <div key={v.range} className={`rounded-xl border p-4 ${v.bg} text-center space-y-1`}>
              {v.icon}
              <p className={`text-lg font-extrabold ${v.color} mt-1`}>{v.range}</p>
              <p className="text-sm font-semibold text-foreground">{v.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={0}
        className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 flex items-start gap-4"
      >
        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-foreground">Важно ограничение</h4>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            TrueNewsScanner предоставя{" "}
            <strong className="text-foreground">вероятностна оценка</strong>, основана на
            алгоритмичен анализ. Системата не е непогрешима и не замества журналистическа
            проверка или правен съвет. Винаги проверявайте от множество независими източници,
            преди да вземете решение.
          </p>
        </div>
      </motion.div>

      <div className="text-center">
        <Link href="/">
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
            <ShieldCheck className="w-4 h-4" />
            Направи проверка
          </button>
        </Link>
      </div>
    </div>
  );
}
