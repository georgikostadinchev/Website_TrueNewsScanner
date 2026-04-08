import { useState } from "react";
import { Link } from "wouter";
import { Flag, CheckCircle, ArrowLeft, Link2, Phone, MessageSquare, Newspaper } from "lucide-react";
import { useSubmitReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type CheckType = "url" | "phone" | "message" | "news";

const TYPE_OPTIONS: { value: CheckType; label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string }[] = [
  { value: "url", label: "Линк / URL", icon: Link2, placeholder: "https://..." },
  { value: "phone", label: "Телефонен номер", icon: Phone, placeholder: "+359 88 888 8888" },
  { value: "message", label: "Съобщение / SMS", icon: MessageSquare, placeholder: "Текстът на съобщението..." },
  { value: "news", label: "Новина / дезинформация", icon: Newspaper, placeholder: "Заглавие или текст на новина..." },
];

const schema = z.object({
  type: z.enum(["url", "phone", "message", "news"]),
  content: z.string().min(2, "Съдържанието е твърде кратко"),
  description: z.string().min(10, "Описанието трябва да е поне 10 символа"),
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
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Благодарим ви!</h1>
        <p className="text-muted-foreground mb-2">
          Вашият доклад беше получен успешно и ще бъде прегледан от нашия екип.
        </p>
        <p className="text-xs text-muted-foreground mb-8">Идентификатор на доклада: <span className="font-mono">{reportId}</span></p>
        <Link href="/">
          <Button data-testid="button-back-home">Провери ново съдържание</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Flag className="w-5 h-5 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Докладвай подозрително съдържание</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Помогнете ни да защитим общността като докладвате измами, фишинг линкове или дезинформация, с която сте се сблъскали.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Type selector */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Вид съдържание</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-2" data-testid="select-type">
                    {TYPE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                            field.value === opt.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground hover:bg-muted"
                          }`}
                          data-testid={`type-option-${opt.value}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Content */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Подозрително съдържание</FormLabel>
                <FormControl>
                  {selectedType === "message" || selectedType === "news" ? (
                    <Textarea
                      {...field}
                      placeholder={typeConfig.placeholder}
                      className="min-h-[100px] resize-none"
                      data-testid="input-content"
                    />
                  ) : (
                    <Input
                      {...field}
                      placeholder={typeConfig.placeholder}
                      data-testid="input-content"
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Защо го смятате за подозрително?</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Опишете как сте получили това, какво се е случило, защо мислите, че е измама..."
                    className="min-h-[100px] resize-none"
                    data-testid="input-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact */}
          <FormField
            control={form.control}
            name="reporterContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Контакт (по избор)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Имейл или телефон, ако искате да бъдете информирани"
                    data-testid="input-contact"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">Незадължително. Използваме само за връзка при нужда от допълнителна информация.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={submitReport.isPending}
            data-testid="button-submit-report"
          >
            <Flag className="w-4 h-4" />
            {submitReport.isPending ? "Изпраща се..." : "Изпрати доклада"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
