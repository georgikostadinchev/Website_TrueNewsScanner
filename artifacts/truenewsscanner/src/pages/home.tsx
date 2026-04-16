import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Link2, Phone, MessageSquare, Newspaper, TrendingUp, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { useSubmitCheck, useGetRecentChecks } from "@workspace/api-client-react";
import { setCheckResult } from "@/lib/checkStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

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
          setError("Грешка при проверката. Моля, опитайте отново по-късно.");
        },
      }
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden bg-noise bg-[hsl(230,40%,12%)] text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-8 text-sm font-medium text-primary-foreground backdrop-blur-sm"
          >
            <Shield className="w-4 h-4" />
            Вашият дигитален защитник
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
          >
            Разпознайте истината.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-300">
              Спрете измамата.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-blue-100/80 max-w-2xl mx-auto mb-4 font-medium"
          >
            Моментален анализ на съмнителни линкове, съобщения и обаждания.
          </motion.p>
        </div>
      </section>

      {/* Main App Interface */}
      <section className="px-6 relative z-20 -mt-24 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-primary/5 p-2 sm:p-4 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as CheckType); setError(""); }}>
              <TabsList className="w-full grid grid-cols-4 h-auto p-1.5 mb-4 sm:mb-6 bg-muted/50 rounded-xl">
                <TabsTrigger value="url" className="flex flex-col sm:flex-row items-center gap-2 py-3 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm" data-testid="tab-url">
                  <Link2 className="w-5 h-5" />
                  <span className="text-xs sm:text-sm font-bold">Линк</span>
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex flex-col sm:flex-row items-center gap-2 py-3 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm" data-testid="tab-phone">
                  <Phone className="w-5 h-5" />
                  <span className="text-xs sm:text-sm font-bold">Телефон</span>
                </TabsTrigger>
                <TabsTrigger value="message" className="flex flex-col sm:flex-row items-center gap-2 py-3 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm" data-testid="tab-message">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs sm:text-sm font-bold">Съобщение</span>
                </TabsTrigger>
                <TabsTrigger value="news" className="flex flex-col sm:flex-row items-center gap-2 py-3 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm" data-testid="tab-news">
                  <Newspaper className="w-5 h-5" />
                  <span className="text-xs sm:text-sm font-bold">Новина</span>
                </TabsTrigger>
              </TabsList>

              <div className="p-2 sm:p-4">
                <TabsContent value="url" className="mt-0 focus-visible:outline-none">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Уеб адрес за проверка</label>
                    <Input
                      type="url"
                      placeholder="https://example.com/..."
                      value={inputs.url}
                      onChange={(e) => setInput(e.target.value)}
                      className="text-lg h-14 bg-background border-border focus-visible:ring-primary shadow-sm"
                      data-testid="input-url"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                    <p className="text-sm font-medium text-muted-foreground">Напр. https://спечелихте.bg/награда</p>
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="mt-0 focus-visible:outline-none">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Телефонен номер</label>
                    <Input
                      type="tel"
                      placeholder="+359 88 888 8888"
                      value={inputs.phone}
                      onChange={(e) => setInput(e.target.value)}
                      className="text-lg h-14 bg-background border-border focus-visible:ring-primary shadow-sm"
                      data-testid="input-phone"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                    <p className="text-sm font-medium text-muted-foreground">Моля, включете кода на страната (+359).</p>
                  </div>
                </TabsContent>

                <TabsContent value="message" className="mt-0 focus-visible:outline-none">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Текст на съобщението</label>
                    <Textarea
                      placeholder="Поставете съдържанието на SMS, имейл или чат тук..."
                      value={inputs.message}
                      onChange={(e) => setInput(e.target.value)}
                      className="min-h-[140px] text-lg resize-none bg-background border-border focus-visible:ring-primary shadow-sm p-4"
                      data-testid="input-message"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="news" className="mt-0 focus-visible:outline-none">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Новинарски текст или заглавие</label>
                    <Textarea
                      placeholder="Поставете текста, който ви съмнява..."
                      value={inputs.news}
                      onChange={(e) => setInput(e.target.value)}
                      className="min-h-[140px] text-lg resize-none bg-background border-border focus-visible:ring-primary shadow-sm p-4"
                      data-testid="input-news"
                    />
                  </div>
                </TabsContent>

                <AnimatePresence>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 text-sm font-bold text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 flex items-center gap-2" 
                      data-testid="text-error"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button
                  className="w-full mt-6 h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all group"
                  onClick={handleSubmit}
                  disabled={submitCheck.isPending}
                  data-testid="button-submit-check"
                >
                  {submitCheck.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Анализиране...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 w-full">
                      Стартирай проверка
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </div>
            </Tabs>
          </div>
        </motion.div>
      </section>

      {/* Global Stats */}
      <section className="bg-muted/30 py-20 px-6 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-foreground mb-3">Обединени срещу измамите</h2>
            <p className="text-lg font-medium text-muted-foreground max-w-2xl mx-auto">
              Всяка проверка помага на системата да става по-точна и да предпазва повече хора.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))
            ) : stats ? (
              <>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                  data-testid="stat-total-checks"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingUp className="w-24 h-24 text-primary" />
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary mb-4 relative z-10" />
                  <p className="text-4xl font-extrabold text-foreground mb-1 relative z-10">{stats.totalChecks.toLocaleString("bg-BG")}</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide relative z-10">Общо проверки</p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                  data-testid="stat-today-checks"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <CheckCircle className="w-24 h-24 text-emerald-500" />
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-4 relative z-10" />
                  <p className="text-4xl font-extrabold text-foreground mb-1 relative z-10">{stats.todayChecks.toLocaleString("bg-BG")}</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide relative z-10">Проверени днес</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                  data-testid="stat-scams-detected"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <AlertTriangle className="w-24 h-24 text-destructive" />
                  </div>
                  <AlertTriangle className="w-8 h-8 text-destructive mb-4 relative z-10" />
                  <p className="text-4xl font-extrabold text-destructive mb-1 relative z-10">{stats.scamsDetected.toLocaleString("bg-BG")}</p>
                  <p className="text-sm font-bold text-destructive/80 uppercase tracking-wide relative z-10">Блокирани измами</p>
                </motion.div>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
