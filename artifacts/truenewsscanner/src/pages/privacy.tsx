import { motion } from "framer-motion";
import { Shield, Eye, Database, Lock, Mail, Cookie, Trash2, UserCheck } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: "easeOut" },
  }),
};

interface PolicySectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  index: number;
}

function PolicySection({ icon, title, children, index }: PolicySectionProps) {
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

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14 space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
          <Shield className="w-4 h-4" />
          Поверителност
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Политика за поверителност
        </h1>
        <p className="text-muted-foreground">
          Последна актуализация: <strong className="text-foreground">16 април 2026 г.</strong>
        </p>
        <p className="text-muted-foreground leading-relaxed">
          TrueNewsScanner е изграден с уважение към вашата поверителност. Тази политика обяснява
          каква информация събираме, как я използваме и какви права имате.
        </p>
      </motion.div>

      <div className="space-y-4">
        <PolicySection icon={<Eye className="w-5 h-5 text-primary" />} title="Каква информация събираме" index={0}>
          <p>
            <strong className="text-foreground">Съдържание за проверка:</strong> URL адреси,
            телефонни номера, текстове на съобщения и новинарски текстове, които вие въвеждате за
            анализ. Те се съхраняват за целите на оценката и агрегираната статистика.
          </p>
          <p>
            <strong className="text-foreground">Доклади на потребители:</strong> Когато
            докладвате съдържание, записваме доклада, вида му и незадължителния коментар.
          </p>
          <p>
            <strong className="text-foreground">Данни при вход:</strong> При влизане с Replit
            профил получаваме публичния ви потребителски идентификатор, имена и, ако е налице,
            профилна снимка. <strong className="text-foreground">Не съхраняваме пароли.</strong>
          </p>
          <p>
            <strong className="text-foreground">Технически данни:</strong> Стандартни сървърни
            логове (IP адрес, браузър, дата на заявка) — съхраняват се до 30 дни.
          </p>
        </PolicySection>

        <PolicySection icon={<Database className="w-5 h-5 text-primary" />} title="Как използваме информацията" index={1}>
          <p>Информацията се използва единствено за:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Извършване на заявената проверка и показване на резултата.</li>
            <li>Подобряване на точността на алгоритъма чрез обобщена статистика.</li>
            <li>Поддържане на общностна база данни с докладвани заплахи.</li>
            <li>Сигурност — засичане на злоупотреби с платформата.</li>
          </ul>
          <p>
            <strong className="text-foreground">Не продаваме, не отдаваме под наем и не
            споделяме лични данни с трети страни</strong> с цел реклама или профилиране.
          </p>
        </PolicySection>

        <PolicySection icon={<Trash2 className="w-5 h-5 text-primary" />} title="Съхранение и изтриване на данни" index={2}>
          <p>
            Съдържанието, изпратено за проверка (URL, телефон, текст), се съхранява в нашата
            база данни <strong className="text-foreground">до 90 дни</strong> след последния
            достъп, след което се изтрива автоматично.
          </p>
          <p>
            Потребителски доклади могат да се пазят по-дълго, тъй като са важни за
            общностната база с измами.
          </p>
          <p>
            Можете да поискате изтриване на данните си, свързани с вашия акаунт, като се
            свържете с нас на посочения по-долу имейл.
          </p>
        </PolicySection>

        <PolicySection icon={<Cookie className="w-5 h-5 text-primary" />} title="Бисквитки и сесии" index={3}>
          <p>
            Използваме <strong className="text-foreground">сесийни бисквитки</strong>{" "}
            единствено за управление на влизането в профил. Те изтичат при затваряне на
            браузъра или след 7 дни.
          </p>
          <p>
            <strong className="text-foreground">Не използваме проследяващи бисквитки</strong>{" "}
            или рекламни пиксели на трети страни.
          </p>
        </PolicySection>

        <PolicySection icon={<Lock className="w-5 h-5 text-primary" />} title="Сигурност на данните" index={4}>
          <p>
            Всички данни се пренасят по криптирана HTTPS връзка. Базата данни е защитена с
            ограничен достъп и редовни резервни копия. Въпреки взетите мерки, никоя система
            не е 100% защитена — уведомяваме потребителите при всеки инцидент с данни.
          </p>
        </PolicySection>

        <PolicySection icon={<UserCheck className="w-5 h-5 text-primary" />} title="Вашите права" index={5}>
          <p>Имате право да:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Получите достъп до данните, свързани с вашия акаунт.</li>
            <li>Поискате коригиране на неточни данни.</li>
            <li>Поискате изтриване на вашите данни.</li>
            <li>Оттеглите съгласието си по всяко време.</li>
          </ul>
          <p>
            За упражняване на правата си се свържете с нас на:{" "}
            <strong className="text-foreground">privacy@truenewsscanner.bg</strong>
          </p>
        </PolicySection>

        <PolicySection icon={<Mail className="w-5 h-5 text-primary" />} title="Промени в политиката" index={6}>
          <p>
            При съществени промени в тази политика ще публикуваме актуализирана версия на тази
            страница с нова дата. Препоръчваме да преглеждате политиката периодично.
          </p>
          <p>
            При въпроси: <strong className="text-foreground">privacy@truenewsscanner.bg</strong>
          </p>
        </PolicySection>
      </div>
    </div>
  );
}
