import { openai } from "@workspace/integrations-openai-ai-server";
import { type PipelineResult, scoreToVerdict, verdictToLabel } from "./types";

export type CheckType = "url" | "phone" | "message" | "news";

const SYSTEM_PROMPT = `Ти си Bulgarian Truth Scanner — AI асистент за анализ на измами и дезинформация на български език.

Анализирай подаденото съдържание и върни JSON отговор в точно следния формат:
{
  "riskScore": <число 0-100>,
  "confidence": <число 0-100>,
  "summary": "<кратко обяснение на български, 1-2 изречения>",
  "signals": [
    { "label": "<заглавие>", "description": "<описание>", "isRisk": <true/false>, "weight": <0.0-1.0> }
  ],
  "evidence": [
    { "source": "<източник>", "finding": "<откритие>" }
  ],
  "nextSteps": [
    { "action": "<действие>", "description": "<описание>", "priority": "<high|medium|low>" }
  ]
}

Правила:
- riskScore 0-19: безопасно (По-скоро безопасно)
- riskScore 20-39: недостатъчно данни (Недостатъчно данни)
- riskScore 40-59: съмнително (Съмнително)
- riskScore 60-79: подвеждащо (Подвеждащо / висок риск)
- riskScore 80-100: измама (Вероятно измама)
- Всички текстове в отговора ТРЯБВА да бъдат на БЪЛГАРСКИ език
- Бъди обективен и основавай оценката на конкретни признаци
- Предоставяй само оценки, базирани на доказателства — не претендирай за абсолютна истина
- За URL: анализирай домейна, структурата, ключовите думи и TLD
- За телефон: анализирай формата, префикса и познати схеми за измами
- За съобщение: анализирай съдържанието за измамни фрази и манипулативни техники
- За новина: анализирай за дезинформационни шаблони, конспиративни наративи, неверифицирани претенции`;

export async function aiCheck(type: CheckType, input: string): Promise<PipelineResult> {
  const typeLabels: Record<CheckType, string> = {
    url: "URL адрес",
    phone: "телефонен номер",
    message: "съобщение",
    news: "новина или текст",
  };

  const userPrompt = `Провери следния ${typeLabels[type]} за измами, фишинг или дезинформация:\n\n"${input}"`;

  let parsed: {
    riskScore: number;
    confidence: number;
    summary: string;
    signals: Array<{ label: string; description: string; isRisk: boolean; weight: number }>;
    evidence: Array<{ source: string; finding: string }>;
    nextSteps: Array<{ action: string; description: string; priority: "high" | "medium" | "low" }>;
  };

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI timeout")), 25000)
    );

    const aiCall = openai.chat.completions.create({
      model: "gpt-5-nano",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const response = await Promise.race([aiCall, timeout]);
    const content = response.choices[0]?.message?.content ?? "{}";
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error(`AI analysis failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const riskScore = Math.max(0, Math.min(100, Number(parsed.riskScore) || 30));
  const confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 70));
  const verdict = scoreToVerdict(riskScore);

  const signals = (parsed.signals ?? []).map((s, i) => ({
    id: `ai-signal-${i}`,
    label: s.label ?? "Сигнал",
    description: s.description ?? "",
    weight: Number(s.weight) || 0.5,
    isRisk: Boolean(s.isRisk),
  }));

  if (signals.length === 0) {
    signals.push({
      id: "ai-no-signals",
      label: "Не са открити конкретни сигнали",
      description: "AI анализът не откри ясни рискови индикатори",
      weight: 0,
      isRisk: false,
    });
  }

  const evidence = (parsed.evidence ?? []).map((e) => ({
    source: e.source ?? "AI анализ",
    finding: e.finding ?? "",
    url: null as string | null,
  }));

  evidence.push({
    source: "AI анализ (GPT)",
    finding: "Оценката е генерирана от изкуствен интелект, обучен да разпознава измами и дезинформация на български език",
    url: null,
  });

  const nextSteps = (parsed.nextSteps ?? []).map((n) => ({
    action: n.action ?? "",
    description: n.description ?? "",
    priority: (["high", "medium", "low"].includes(n.priority) ? n.priority : "medium") as "high" | "medium" | "low",
  }));

  return {
    verdict,
    verdictLabel: verdictToLabel(verdict),
    riskScore,
    confidence,
    summary: parsed.summary ?? "Анализът приключи.",
    signals,
    evidence,
    nextSteps,
  };
}
