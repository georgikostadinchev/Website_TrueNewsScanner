export type Verdict = "safe" | "insufficient" | "suspicious" | "misleading" | "scam";

export const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; bgColor: string; borderColor: string; textColor: string; icon: string }> = {
  safe: {
    label: "По-скоро безопасно",
    color: "green",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-300 dark:border-green-700",
    textColor: "text-green-700 dark:text-green-400",
    icon: "shield-check",
  },
  insufficient: {
    label: "Недостатъчно данни",
    color: "gray",
    bgColor: "bg-gray-50 dark:bg-gray-800/30",
    borderColor: "border-gray-300 dark:border-gray-600",
    textColor: "text-gray-600 dark:text-gray-400",
    icon: "help-circle",
  },
  suspicious: {
    label: "Съмнително",
    color: "yellow",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-300 dark:border-yellow-700",
    textColor: "text-yellow-700 dark:text-yellow-400",
    icon: "alert-triangle",
  },
  misleading: {
    label: "Подвеждащо / висок риск",
    color: "orange",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-300 dark:border-orange-700",
    textColor: "text-orange-700 dark:text-orange-400",
    icon: "alert-octagon",
  },
  scam: {
    label: "Вероятно измама",
    color: "red",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-300 dark:border-red-700",
    textColor: "text-red-700 dark:text-red-400",
    icon: "x-circle",
  },
};

export const CHECK_TYPE_LABELS: Record<string, string> = {
  url: "Линк / URL",
  phone: "Телефонен номер",
  message: "Съобщение",
  news: "Новина",
};

export function getRiskColor(score: number): string {
  if (score < 30) return "text-green-600 dark:text-green-400";
  if (score < 60) return "text-yellow-600 dark:text-yellow-400";
  if (score < 80) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

export function getRiskBarColor(score: number): string {
  if (score < 30) return "bg-green-500";
  if (score < 60) return "bg-yellow-500";
  if (score < 80) return "bg-orange-500";
  return "bg-red-500";
}
