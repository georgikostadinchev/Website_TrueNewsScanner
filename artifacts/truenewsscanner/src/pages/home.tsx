import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Link2, Phone, MessageSquare, Newspaper, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useSubmitCheck, useGetRecentChecks } from "@workspace/api-client-react";
import { setCheckResult } from "@/lib/checkStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type CheckType = "url" | "phone" | "message" | "news";

export default function Home() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<CheckType>("url");
  const [inputs, setInputs] = useState({ url: "", phone: "", message: "", news: "" });
  const [error, setError] = useState("");

  const submitCheck = useSubmitCheck();
  const { data: stats, isLoading: statsLoading } = useGetRecentChecks();

  function getInput(): string {
    return inputs[activeTab] ?? "";
  }

  function setInput(val: string) {
    setInputs((prev) => ({ ...prev, [activeTab]: val }));
  }

  function handleSubmit() {
    const input = getInput().trim();
    if (!input) {
      setError("Моля, въведете съдържание за проверка.");
      return;
    }
    setError("");
    submitCheck.mutate(
      { data: { type: activeTab, input } },
      {
        onSuccess: (result) => {
          setCheckResult(result as any);
          navigate("/result");
        },
        onError: () => {
          setError("Грешка при проверката. Опитайте отново.");
        },
      }
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(222,50%,18%)] to-[hsl(215,60%,22%)] text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6 text-sm text-blue-200">
            <Shield className="w-4 h-4" />
            Безплатна проверка за всеки
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Провери дали това е<br />
            <span className="text-blue-400">истина или измама</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-xl mx-auto mb-2">
            Въведете линк, телефонен номер, съобщение или новина и получете оценка, базирана на реални сигнали.
          </p>
          <p className="text-sm text-blue-300">
            Продуктът предоставя оценки, базирани на доказателства — не претендира за абсолютна истина.
          </p>
        </div>
      </section>

      {/* Check form */}
      <section className="max-w-3xl mx-auto px-4 -mt-8">
        <div className="bg-card border border-card-border rounded-2xl shadow-xl p-6">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as CheckType); setError(""); }}>
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="url" className="flex items-center gap-1.5 text-xs sm:text-sm" data-testid="tab-url">
                <Link2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Линк</span>
                <span className="sm:hidden">URL</span>
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-1.5 text-xs sm:text-sm" data-testid="tab-phone">
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Телефон</span>
                <span className="sm:hidden">Тел.</span>
              </TabsTrigger>
              <TabsTrigger value="message" className="flex items-center gap-1.5 text-xs sm:text-sm" data-testid="tab-message">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Съобщение</span>
                <span className="sm:hidden">SMS</span>
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-1.5 text-xs sm:text-sm" data-testid="tab-news">
                <Newspaper className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Новина</span>
                <span className="sm:hidden">Новина</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Поставете линка, който искате да проверите:</label>
                <Input
                  type="url"
                  placeholder="https://example.com/..."
                  value={inputs.url}
                  onChange={(e) => setInput(e.target.value)}
                  className="text-base h-12"
                  data-testid="input-url"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <p className="text-xs text-muted-foreground">Пример: https://спечелихте.bg/награда или https://bank-verify.ru/login</p>
              </div>
            </TabsContent>

            <TabsContent value="phone">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Въведете телефонния номер за проверка:</label>
                <Input
                  type="tel"
                  placeholder="+359 88 888 8888"
                  value={inputs.phone}
                  onChange={(e) => setInput(e.target.value)}
                  className="text-base h-12"
                  data-testid="input-phone"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <p className="text-xs text-muted-foreground">Въведете номера с код — например +359 за България</p>
              </div>
            </TabsContent>

            <TabsContent value="message">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Поставете текста на съобщението за проверка:</label>
                <Textarea
                  placeholder="Поставете SMS, имейл или съобщение тук..."
                  value={inputs.message}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[120px] text-base resize-none"
                  data-testid="input-message"
                />
                <p className="text-xs text-muted-foreground">Поставете целия текст на полученото съобщение</p>
              </div>
            </TabsContent>

            <TabsContent value="news">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Поставете текста на новината или заглавието за проверка:</label>
                <Textarea
                  placeholder="Поставете заглавие или текст на новина тук..."
                  value={inputs.news}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[120px] text-base resize-none"
                  data-testid="input-news"
                />
                <p className="text-xs text-muted-foreground">Можете да поставите заглавие, линк или целия текст на новината</p>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <p className="mt-3 text-sm text-destructive font-medium" data-testid="text-error">{error}</p>
          )}

          <Button
            className="w-full mt-4 h-12 text-base font-semibold"
            onClick={handleSubmit}
            disabled={submitCheck.isPending}
            data-testid="button-submit-check"
          >
            {submitCheck.isPending ? "Проверява се..." : "Провери сега"}
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-3xl mx-auto px-4 mt-12">
        <h2 className="text-lg font-semibold text-foreground mb-4 text-center">Какво провери общността</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : stats ? (
            <>
              <div className="bg-card border border-card-border rounded-xl p-4 text-center shadow-sm" data-testid="stat-total-checks">
                <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.totalChecks.toLocaleString("bg-BG")}</p>
                <p className="text-xs text-muted-foreground mt-1">Общо проверки</p>
              </div>
              <div className="bg-card border border-card-border rounded-xl p-4 text-center shadow-sm" data-testid="stat-today-checks">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.todayChecks.toLocaleString("bg-BG")}</p>
                <p className="text-xs text-muted-foreground mt-1">Днес</p>
              </div>
              <div className="col-span-2 md:col-span-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center shadow-sm" data-testid="stat-scams-detected">
                <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.scamsDetected.toLocaleString("bg-BG")}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Открити измами</p>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-4 mt-16 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-6 text-center">Как работи TrueNewsScanner?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Въведете съдържанието", desc: "Поставете линк, телефонен номер, съобщение или новина, за която имате съмнения" },
            { step: "2", title: "Анализ на сигналите", desc: "Системата анализира структурата, шаблоните и наличните данни за рискови характеристики" },
            { step: "3", title: "Получете оценка", desc: "Виждате рискова оценка, обяснение и конкретни стъпки за действие" },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
