import { useState } from "react";
import { Link } from "wouter";
import { Flag, CheckCircle, ArrowLeft, Link2, Phone, MessageSquare, Newspaper, ShieldAlert } from "lucide-react";
import { useSubmitReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";

type CheckType = "url" | "phone" | "message" | "news";

const TYPE_OPTIONS: { value: CheckType; label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string }[] = [
  { value: "url", label: "Уебсайт", icon: Link2, placeholder: "https://..." },
  { value: "phone", label: "Телефон", icon: Phone, placeholder: "+359 88 888 8888" },
  { value: "message", label: "Съобщение", icon: MessageSquare, placeholder: "Текст на SMS или чат..." },
  { value: "news", label: "Новина", icon: Newspaper, placeholder: "Съмнителна статия..." },
];

const schema = z.object({
  type: z.enum(["url", "phone", "message", "news"]),
  content: z.string().min(2, "Съдържанието е задължително"),
  description: z.string().min(10, "Моля, въведете поне кратко описание (10 символа)"),
  reporterContact: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState("");

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const prefillContent = params.get("content") ?? "";
  const prefillType = (params.get("type") ?? "url") as CheckType;

  const submitReport = useSubmitReport();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: prefillType,
      content: prefillContent,
      description: "",
      reporterContact: "",
    },
  });

  const selectedType = form.watch("type");
  const typeConfig = TYPE_OPTIONS.find((t) => t.value === selectedType) ?? TYPE_OPTIONS[0];

  function onSubmit(values: FormValues) {
    submitReport.mutate(
      {
        data: {
          type: values.type,
          content: values.content,
          description: values.description,
          reporterContact: values.reporterContact || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setReportId(data.id);
          setSubmitted(true);
        },
      }
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-8 shadow-sm"
        >
          <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
        </motion.div>
        <h1 className="text-4xl font-extrabold text-foreground mb-4">Докладът е приет</h1>
        <p className="text-lg font-medium text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
          Благодарим ви. Вашата бдителност помага на цялата общност да остане защитена.
        </p>
        <div className="bg-muted/50 border border-border rounded-xl p-4 mb-10 max-w-sm mx-auto">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Референтен номер</p>
          <p className="text-sm font-mono text-foreground font-bold">{reportId}</p>
        </div>
        <Link href="/">
          <Button size="lg" className="font-bold rounded-xl px-8" data-testid="button-back-home">
            Към началната страница
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2 font-bold text-muted-foreground -ml-4 mb-6 hover:text-foreground" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
            Назад
          </Button>
        </Link>
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Докладване</h1>
        </div>
        <p className="text-lg font-medium text-muted-foreground">
          Сблъскахте ли се с измама? Изпратете ни я за анализ и блокиране.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold uppercase tracking-wide">Вид на заплахата</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="select-type">
                      {TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = field.value === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all outline-none ${
                              isSelected
                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                : "border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-muted"
                            }`}
                            data-testid={`type-option-${opt.value}`}
                          >
                            <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-bold">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold uppercase tracking-wide">Съмнително съдържание</FormLabel>
                  <FormControl>
                    {selectedType === "message" || selectedType === "news" ? (
                      <Textarea
                        {...field}
                        placeholder={typeConfig.placeholder}
                        className="min-h-[120px] text-base resize-none bg-background focus-visible:ring-primary shadow-sm"
                        data-testid="input-content"
                      />
                    ) : (
                      <Input
                        {...field}
                        placeholder={typeConfig.placeholder}
                        className="h-14 text-base bg-background focus-visible:ring-primary shadow-sm"
                        data-testid="input-content"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold uppercase tracking-wide">Контекст</FormLabel>
                  <p className="text-sm font-medium text-muted-foreground mb-3">Защо смятате това за опасно? Как стигна до вас?</p>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Опишете ситуацията..."
                      className="min-h-[120px] text-base resize-none bg-background focus-visible:ring-primary shadow-sm"
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reporterContact"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-sm font-bold uppercase tracking-wide">Контакт за обратна връзка</FormLabel>
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">По желание</span>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Имейл или телефонен номер"
                      className="h-14 text-base bg-background focus-visible:ring-primary shadow-sm"
                      data-testid="input-contact"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold rounded-xl gap-2 shadow-md hover:shadow-lg transition-shadow"
              disabled={submitReport.isPending}
              data-testid="button-submit-report"
            >
              <Flag className="w-5 h-5" />
              {submitReport.isPending ? "Изпращане..." : "Изпрати за анализ"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
