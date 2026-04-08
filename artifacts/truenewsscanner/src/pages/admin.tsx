import { useState } from "react";
import { Shield, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, Save, Link2, Phone, MessageSquare, Newspaper } from "lucide-react";
import { useGetAdminStats, useGetAdminReports, useGetAdminReport, useUpdateAdminReport, getGetAdminReportsQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_LABELS: Record<string, string> = {
  pending: "Чакащ",
  reviewed: "Прегледан",
  dismissed: "Отхвърлен",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  reviewed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  dismissed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  url: Link2,
  phone: Phone,
  message: MessageSquare,
  news: Newspaper,
};

const TYPE_LABELS: Record<string, string> = {
  url: "Линк",
  phone: "Телефон",
  message: "Съобщение",
  news: "Новина",
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

interface Report {
  id: string;
  type: string;
  content: string;
  description: string;
  reporterContact?: string | null;
  status: string;
  adminNotes?: string | null;
  reviewedBy?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

function ReportRow({ report, onSelect, selected }: { report: Report; onSelect: (id: string) => void; selected: boolean }) {
  const TypeIcon = TYPE_ICONS[report.type] ?? Shield;
  return (
    <button
      className={`w-full text-left px-4 py-3 border-b border-border flex items-start gap-3 hover:bg-muted/50 transition-colors ${selected ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
      onClick={() => onSelect(report.id)}
      data-testid={`report-row-${report.id}`}
    >
      <TypeIcon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[report.status]}`}>
            {STATUS_LABELS[report.status] ?? report.status}
          </span>
          <span className="text-xs text-muted-foreground">{TYPE_LABELS[report.type] ?? report.type}</span>
        </div>
        <p className="text-sm font-medium text-foreground truncate">{report.content}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{new Date(report.submittedAt).toLocaleDateString("bg-BG", { dateStyle: "medium" })}</p>
      </div>
      {selected ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
    </button>
  );
}

function ReportDetail({ reportId }: { reportId: string }) {
  const queryClient = useQueryClient();
  const { data: report, isLoading } = useGetAdminReport(reportId, {
    query: { queryKey: ["admin-report", reportId] },
  });
  const updateReport = useUpdateAdminReport();
  const [notes, setNotes] = useState<string>("");
  const [notesReady, setNotesReady] = useState(false);

  if (isLoading) return <div className="p-4 space-y-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-20" /></div>;
  if (!report) return <p className="p-4 text-sm text-muted-foreground">Докладът не беше намерен</p>;

  const r = report as Report;

  if (!notesReady) {
    setNotes(r.adminNotes ?? "");
    setNotesReady(true);
  }

  function handleStatus(status: string) {
    updateReport.mutate(
      { id: reportId, data: { status: status as any, adminNotes: notes, reviewedBy: "Admin" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-report", reportId] });
          queryClient.invalidateQueries({ queryKey: getGetAdminReportsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        },
      }
    );
  }

  function handleSaveNotes() {
    updateReport.mutate(
      { id: reportId, data: { adminNotes: notes } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-report", reportId] });
        },
      }
    );
  }

  const TypeIcon = TYPE_ICONS[r.type] ?? Shield;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <TypeIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{TYPE_LABELS[r.type] ?? r.type}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-auto ${STATUS_COLORS[r.status]}`}>
          {STATUS_LABELS[r.status] ?? r.status}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Съдържание</p>
          <p className="text-sm font-mono bg-muted/50 rounded p-2 break-all">{r.content}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Описание от потребителя</p>
          <p className="text-sm text-foreground">{r.description}</p>
        </div>
        {r.reporterContact && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Контакт</p>
            <p className="text-sm text-foreground">{r.reporterContact}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Дата на подаване</p>
          <p className="text-sm text-foreground">{new Date(r.submittedAt).toLocaleString("bg-BG")}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Бележки на модератора</p>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Добавете бележки за проверката..."
          className="min-h-[80px] resize-none text-sm"
          data-testid="input-admin-notes"
        />
        <Button
          size="sm"
          variant="outline"
          className="mt-2 gap-1.5"
          onClick={handleSaveNotes}
          disabled={updateReport.isPending}
          data-testid="button-save-notes"
        >
          <Save className="w-3.5 h-3.5" />
          Запази бележките
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700"
          onClick={() => handleStatus("reviewed")}
          disabled={updateReport.isPending || r.status === "reviewed"}
          data-testid="button-mark-reviewed"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Прегледан
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={() => handleStatus("dismissed")}
          disabled={updateReport.isPending || r.status === "dismissed"}
          data-testid="button-mark-dismissed"
        >
          <XCircle className="w-3.5 h-3.5" />
          Отхвърлен
        </Button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetAdminStats();
  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = useGetAdminReports(
    {
      ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
      ...(typeFilter !== "all" ? { type: typeFilter as any } : {}),
      limit: 50,
    },
    {
      query: { queryKey: getGetAdminReportsQueryKey({ status: statusFilter !== "all" ? (statusFilter as any) : undefined, type: typeFilter !== "all" ? (typeFilter as any) : undefined }) },
    }
  );

  const reports = (reportsData?.reports ?? []) as Report[];

  function handleRefresh() {
    refetchStats();
    refetchReports();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Административен панел</h1>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRefresh} data-testid="button-refresh">
          <RefreshCw className="w-4 h-4" />
          Обнови
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : stats ? (
          <>
            <StatCard label="Общо доклади" value={(stats as any).totalReports ?? 0} color="text-foreground" />
            <StatCard label="Чакащи" value={(stats as any).pendingReports ?? 0} color="text-yellow-600 dark:text-yellow-400" />
            <StatCard label="Прегледани" value={(stats as any).reviewedReports ?? 0} color="text-green-600 dark:text-green-400" />
            <StatCard label="Отхвърлени" value={(stats as any).dismissedReports ?? 0} color="text-muted-foreground" />
          </>
        ) : null}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Статус:</span>
          {["all", "pending", "reviewed", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card text-foreground hover:bg-muted"
              }`}
              data-testid={`filter-status-${s}`}
            >
              {s === "all" ? "Всички" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Тип:</span>
          {["all", "url", "phone", "message", "news"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card text-foreground hover:bg-muted"
              }`}
              data-testid={`filter-type-${t}`}
            >
              {t === "all" ? "Всички" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Reports list + detail */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm">Доклади ({reportsData?.total ?? 0})</h2>
            {(stats as any)?.pendingReports > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                {(stats as any).pendingReports} чакащи
              </span>
            )}
          </div>
          <div className="divide-y divide-border overflow-auto max-h-[600px]">
            {reportsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Няма доклади за показване
              </div>
            ) : (
              reports.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  selected={selectedId === report.id}
                  onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm">Детайли и модерация</h2>
          </div>
          {selectedId ? (
            <ReportDetail key={selectedId} reportId={selectedId} />
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Изберете доклад от списъка за преглед
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
