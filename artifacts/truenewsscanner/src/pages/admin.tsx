import { useState } from "react";
import { Shield, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, Save, Link2, Phone, MessageSquare, Newspaper, Lock, Clock, Search, Filter } from "lucide-react";
import { useGetAdminStats, useGetAdminReports, useGetAdminReport, useUpdateAdminReport, getGetAdminReportsQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_LABELS: Record<string, string> = {
  pending: "Чакащ преглед",
  reviewed: "Обработен",
  dismissed: "Отхвърлен",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  reviewed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  dismissed: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  url: Link2,
  phone: Phone,
  message: MessageSquare,
  news: Newspaper,
};

const TYPE_LABELS: Record<string, string> = {
  url: "Уебсайт",
  phone: "Телефон",
  message: "Съобщение",
  news: "Новина",
};

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-4xl font-extrabold text-foreground">{value}</p>
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
      className={`w-full text-left px-5 py-4 border-b border-border flex items-start gap-4 transition-all outline-none ${
        selected ? "bg-primary/5" : "hover:bg-muted/50 bg-card"
      }`}
      onClick={() => onSelect(report.id)}
      data-testid={`report-row-${report.id}`}
    >
      <div className={`p-2 rounded-xl shrink-0 ${selected ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'}`}>
        <TypeIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${STATUS_COLORS[report.status]}`}>
            {STATUS_LABELS[report.status] ?? report.status}
          </span>
          <span className="text-xs font-bold text-muted-foreground">{new Date(report.submittedAt).toLocaleDateString("bg-BG")}</span>
        </div>
        <p className="text-base font-bold text-foreground truncate mb-1">{report.content}</p>
        <p className="text-sm font-medium text-muted-foreground truncate">{report.description}</p>
      </div>
      <div className="shrink-0 pt-2 text-muted-foreground">
        {selected ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>
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

  if (isLoading) return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
  if (!report) return <div className="p-8 text-center text-muted-foreground font-medium">Докладът не беше намерен</div>;

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
    <div className="p-6 md:p-8 space-y-8 overflow-y-auto h-full bg-card">
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-muted rounded-xl">
            <TypeIcon className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Вид сигнал</p>
            <p className="text-lg font-extrabold text-foreground">{TYPE_LABELS[r.type] ?? r.type}</p>
          </div>
          <span className={`ml-auto text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-lg border ${STATUS_COLORS[r.status]}`}>
            {STATUS_LABELS[r.status] ?? r.status}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Анализирано съдържание</p>
          <div className="bg-muted/50 rounded-xl p-4 font-mono text-sm break-all border border-border/50 text-foreground">
            {r.content}
          </div>
        </div>
        
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Контекст от потребителя</p>
          <div className="bg-background rounded-xl p-4 border border-border text-foreground font-medium text-sm leading-relaxed">
            {r.description || <span className="text-muted-foreground italic">Няма въведено описание</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Дата на подаване</p>
            <p className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {new Date(r.submittedAt).toLocaleString("bg-BG")}
            </p>
          </div>
          {r.reporterContact && (
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Контакт</p>
              <p className="text-sm font-bold text-foreground truncate">{r.reporterContact}</p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-border space-y-4">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Вътрешни бележки</p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Въведете детайли от проверката..."
            className="min-h-[120px] resize-none text-sm bg-background border-border"
            data-testid="input-admin-notes"
          />
        </div>
        
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            className="font-bold"
            onClick={handleSaveNotes}
            disabled={updateReport.isPending}
            data-testid="button-save-notes"
          >
            <Save className="w-4 h-4 mr-2" />
            Запази
          </Button>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleStatus("reviewed")}
              disabled={updateReport.isPending || r.status === "reviewed"}
              data-testid="button-mark-reviewed"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Потвърди
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="font-bold text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-900/30"
              onClick={() => handleStatus("dismissed")}
              disabled={updateReport.isPending || r.status === "dismissed"}
              data-testid="button-mark-dismissed"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Отхвърли
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetAdminStats({
    query: { enabled: !!user?.isAdmin },
  });
  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = useGetAdminReports(
    {
      ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
      ...(typeFilter !== "all" ? { type: typeFilter as any } : {}),
      limit: 50,
    },
    {
      query: {
        enabled: !!user?.isAdmin,
        queryKey: getGetAdminReportsQueryKey({ status: statusFilter !== "all" ? (statusFilter as any) : undefined, type: typeFilter !== "all" ? (typeFilter as any) : undefined }),
      },
    }
  );

  const reports = (reportsData?.reports ?? []) as Report[];

  function handleRefresh() {
    refetchStats();
    refetchReports();
  }

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 text-center">
        <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-900 mb-6">
          <Lock className="w-12 h-12 text-slate-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-3">Ограничен достъп</h1>
        <p className="text-lg font-medium text-muted-foreground">Този модул е предназначен само за оторизирани модератори.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex-1 flex flex-col h-[calc(100dvh-5rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Работно табло</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Преглед и управление на потребителски сигнали</p>
        </div>
        <Button variant="outline" className="gap-2 font-bold shadow-sm" onClick={handleRefresh} data-testid="button-refresh">
          <RefreshCw className="w-4 h-4" />
          Обнови данните
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 shrink-0">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : stats ? (
          <>
            <StatCard label="Общо сигнали" value={(stats as any).totalReports ?? 0} color="text-primary" icon={Search} />
            <StatCard label="Чакащи" value={(stats as any).pendingReports ?? 0} color="text-amber-500" icon={Clock} />
            <StatCard label="Обработени" value={(stats as any).reviewedReports ?? 0} color="text-emerald-500" icon={CheckCircle} />
            <StatCard label="Отхвърлени" value={(stats as any).dismissedReports ?? 0} color="text-slate-400" icon={XCircle} />
          </>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 bg-card border border-border rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Left List Pane */}
        <div className="w-full md:w-[400px] lg:w-[450px] border-r border-border flex flex-col bg-background z-10 shrink-0">
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Филтри</span>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {["all", "pending", "reviewed", "dismissed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors outline-none ${
                      statusFilter === s ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    data-testid={`filter-status-${s}`}
                  >
                    {s === "all" ? "Всички" : STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {["all", "url", "phone", "message", "news"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors outline-none ${
                      typeFilter === t ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    data-testid={`filter-type-${t}`}
                  >
                    {t === "all" ? "Всички типове" : TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {reportsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-5 border-b border-border space-y-3">
                  <div className="flex gap-2"><Skeleton className="h-5 w-20 rounded" /><Skeleton className="h-5 w-24 rounded" /></div>
                  <Skeleton className="h-5 w-full rounded" />
                </div>
              ))
            ) : reports.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center">
                <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold text-muted-foreground">Няма намерени сигнали</p>
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

        {/* Right Detail Pane */}
        <div className="flex-1 bg-card min-w-0 flex flex-col h-[500px] md:h-auto">
          {selectedId ? (
            <ReportDetail key={selectedId} reportId={selectedId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-muted/10">
              <Shield className="w-16 h-16 text-muted-foreground/20 mb-4" strokeWidth={1} />
              <p className="text-lg font-bold text-muted-foreground">Изберете сигнал за преглед</p>
              <p className="text-sm font-medium text-muted-foreground/70 mt-1 max-w-sm">
                Използвайте списъка вляво, за да отворите детайлите и да модерирате сигнала.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
