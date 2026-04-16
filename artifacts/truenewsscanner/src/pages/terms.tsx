import { motion } from "framer-motion";
import { FileText, AlertTriangle, Ban, ThumbsUp, RefreshCw, Scale, Mail } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: "easeOut" },
  }),
};

interface TermsSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  index: number;
}

function TermsSection({ icon, title, children, index }: TermsSectionProps) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeUp}
      className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2 pl-1">
        {children}
      </div>
    </motion.div>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14 space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
          <FileText className="w-4 h-4" />
          Правни условия
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Общи условия за използване
        </h1>
        <p className="text-muted-foreground">
          Последна актуализация: <strong className="text-foreground">16 април 2026 г.</strong>
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Моля, прочетете внимателно тези условия, преди да използвате TrueNewsScanner. С
          използването на платформата вие се съгласявате с изложените по-долу правила.
        </p>
      </motion.div>

      <div className="space-y-4">
        <TermsSection icon={<FileText className="w-5 h-5 text-primary" />} title="Описание на услугата" index={0}>
          <p>
            TrueNewsScanner е инструмент за гражданска защита, предназначен да помага на
            потребителите да разпознават потенциални измами, дезинформация и подозрително
            онлайн съдържание в България.
          </p>
          <p>
            Услугата е достъпна безплатно и е предназначена за лична, некомерсиална употреба.
          </p>
        </TermsSection>

        <TermsSection icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} title="Ограничение на отговорността" index={1}>
          <p>
            TrueNewsScanner предоставя{" "}
            <strong className="text-foreground">информационни оценки с вероятностен характер</strong>.
            Резултатите от проверките са автоматично генерирани и не представляват:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Юридическо становище или правен съвет.</li>
            <li>Журналистическа проверка на факти.</li>
            <li>Официално становище на държавен орган.</li>
            <li>Абсолютна истина за проверяваното съдържание.</li>
          </ul>
          <p>
            <strong className="text-foreground">Не носим отговорност</strong> за решения,
            взети въз основа на резултатите от платформата. Винаги проверявайте от
            независими източници.
          </p>
        </TermsSection>

        <TermsSection icon={<Ban className="w-5 h-5 text-red-500" />} title="Забранено използване" index={2}>
          <p>Забранено е да използвате TrueNewsScanner за:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Тормоз, дискриминация или насилие спрямо физически лица или организации.</li>
            <li>
              Масово автоматизирано изпращане на заявки (scraping, ботове) без предварително
              писмено съгласие.
            </li>
            <li>
              Опити за заобикаляне на техническите мерки за защита на платформата.
            </li>
            <li>
              Подаване на умишлено неверни доклади с цел увреждане на репутацията на лица или
              организации.
            </li>
            <li>Всяка дейност, противоречаща на българското и европейското законодателство.</li>
          </ul>
        </TermsSection>

        <TermsSection icon={<ThumbsUp className="w-5 h-5 text-emerald-500" />} title="Потребителски доклади и обратна връзка" index={3}>
          <p>
            Когато докладвате съдържание или оставяте обратна връзка, вие потвърждавате, че:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Докладът отразява вашето добросъвестно мнение.</li>
            <li>Не докладвате съдържание с цел злоупотреба или тормоз.</li>
            <li>
              Давате право на TrueNewsScanner да използва доклада за подобряване на алгоритъма
              и общностната база данни.
            </li>
          </ul>
          <p>
            Запазваме правото да премахваме доклади, които нарушават тези условия.
          </p>
        </TermsSection>

        <TermsSection icon={<RefreshCw className="w-5 h-5 text-primary" />} title="Промени в услугата и условията" index={4}>
          <p>
            Запазваме правото да:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Модифицираме, спираме или прекратяваме услугата по всяко време.</li>
            <li>Актуализираме тези общи условия с предизвестие чрез публикуване на тази страница.</li>
          </ul>
          <p>
            Продължаването на използването на платформата след промяна на условията се счита
            за приемане на новите условия.
          </p>
        </TermsSection>

        <TermsSection icon={<Scale className="w-5 h-5 text-primary" />} title="Приложимо право" index={5}>
          <p>
            Тези условия се уреждат от{" "}
            <strong className="text-foreground">законодателството на Република България</strong>{" "}
            и приложимото право на Европейския съюз. При спорове е компетентен съответният
            български съд.
          </p>
        </TermsSection>

        <TermsSection icon={<Mail className="w-5 h-5 text-primary" />} title="Контакт" index={6}>
          <p>
            При въпроси относно тези условия се свържете с нас на:{" "}
            <strong className="text-foreground">legal@truenewsscanner.bg</strong>
          </p>
        </TermsSection>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-border bg-muted/30 p-6 text-center"
      >
        <p className="text-sm text-muted-foreground">
          С използването на TrueNewsScanner вие потвърждавате, че сте прочели и разбрали тези
          общи условия.
        </p>
      </motion.div>
    </div>
  );
}
