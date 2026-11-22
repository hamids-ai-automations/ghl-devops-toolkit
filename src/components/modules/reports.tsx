"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  Eye,
  FileBarChart,
  FileCode,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ModuleHeader, EmptyState, JsonView } from "@/components/module-common";
import { toast } from "@/hooks/use-toast";
import type { Report, ReportType } from "@/lib/types";

const REPORT_TYPES: Array<{ value: ReportType; label: string; description: string }> = [
  { value: "api_diagnostics", label: "API Diagnostics", description: "Recent API request outcomes" },
  { value: "testing_results", label: "Testing Results", description: "Test runs and pass rate" },
  { value: "webhook_history", label: "Webhook History", description: "Captured webhook events" },
  { value: "integration_health", label: "Integration Health", description: "Health check metrics" },
  { value: "full_summary", label: "Full Summary", description: "Everything in one report" },
];

const FORMATS = [
  { value: "html", label: "HTML", icon: <FileCode className="h-4 w-4" />, ext: "html", mime: "text/html" },
  { value: "json", label: "JSON", icon: <FileText className="h-4 w-4" />, ext: "json", mime: "application/json" },
  { value: "csv", label: "CSV", icon: <FileSpreadsheet className="h-4 w-4" />, ext: "csv", mime: "text/csv" },
  { value: "pdf", label: "PDF", icon: <FileBarChart className="h-4 w-4" />, ext: "html", mime: "text/html" },
] as const;

function formatMeta(meta: Record<string, unknown> | null): string {
  if (!meta) return "";
  const entries = Object.entries(meta);
  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

function safeFileName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function ReportsModule() {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [genOpen, setGenOpen] = React.useState(false);
  const [viewTarget, setViewTarget] = React.useState<Report | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Report | null>(null);

  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<ReportType>("full_summary");
  const [format, setFormat] = React.useState<"html" | "json" | "csv" | "pdf">("html");
  const [generating, setGenerating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const json = await res.json();
      if (json.success) setReports(json.data as Report[]);
      else
        toast({ title: "Error", description: json.error, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, format, title: title || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        const report = json.data as Report;
        toast({
          title: "Report generated",
          description: `${report.title} (${report.format.toUpperCase()})`,
        });
        setGenOpen(false);
        setTitle("");
        setViewTarget(report);
        await load();
      } else {
        toast({
          title: "Generation failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Report deleted" });
        if (viewTarget?.id === id) setViewTarget(null);
        await load();
      } else {
        toast({
          title: "Delete failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  function handleDownload(report: Report) {
    try {
      const fmt = FORMATS.find((f) => f.value === report.format) ?? FORMATS[0];
      const blob = new Blob([report.content], { type: fmt.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeFileName(report.title) || "report"}.${fmt.ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Download started", description: a.download });
    } catch (e) {
      toast({
        title: "Download failed",
        description: e instanceof Error ? e.message : "Could not create file",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Report Generator"
        description="Compile API diagnostics, test results, webhooks, and integration health into downloadable reports."
        icon={<FileBarChart className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setGenOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Generate Report
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<FileBarChart className="h-6 w-6" />}
          title="No reports generated yet"
          description="Generate your first report to download a snapshot of API diagnostics, test results, or integration health."
          action={
            <Button onClick={() => setGenOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Generate Report
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onView={() => setViewTarget(r)}
              onDownload={() => handleDownload(r)}
              onDelete={() => setConfirmDelete(r)}
              deleting={deletingId === r.id}
            />
          ))}
        </div>
      )}

      {/* Generate dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Pick a report type and output format. The toolkit aggregates data
              from your recent activity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="rep-title">Title (optional)</Label>
              <Input
                id="rep-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Auto-generated from type if blank"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rep-type">Report Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
                <SelectTrigger id="rep-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex flex-col">
                        <span>{t.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {t.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rep-format">Format</Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as "html" | "json" | "csv" | "pdf")}
              >
                <SelectTrigger id="rep-format" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span className="flex items-center gap-2">
                        {f.icon} {f.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {format === "pdf" && (
                <p className="text-[10px] text-muted-foreground">
                  PDF format generates an HTML report you can print to PDF from
                  your browser.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)} disabled={generating}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileBarChart className="h-4 w-4" />
              )}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <ReportViewDialog
        report={viewTarget}
        onOpenChange={(open) => !open && setViewTarget(null)}
        onDownload={() => viewTarget && handleDownload(viewTarget)}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes "{confirmDelete?.title}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function ReportCard({
  report,
  onView,
  onDownload,
  onDelete,
  deleting,
}: {
  report: Report;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const typeLabel =
    REPORT_TYPES.find((t) => t.value === report.type)?.label ?? report.type;
  const fmtMeta = formatMeta(report.metadata ?? null);

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-sm font-medium">
            {report.title}
          </CardTitle>
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant="secondary" className="text-[10px]">
              {typeLabel}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase">
              {report.format}
            </Badge>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {report.summary && (
          <p className="line-clamp-3 text-xs text-muted-foreground">
            {report.summary}
          </p>
        )}
        {fmtMeta && (
          <p className="text-[10px] text-muted-foreground">{fmtMeta}</p>
        )}
        <div className="mt-auto flex items-center gap-1 pt-2">
          <Button size="sm" variant="outline" onClick={onView} className="gap-2">
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          <Button size="sm" variant="ghost" onClick={onDownload} className="gap-2">
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={deleting}
            className="ml-auto text-muted-foreground hover:text-destructive"
            aria-label="Delete report"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportViewDialog({
  report,
  onOpenChange,
  onDownload,
}: {
  report: Report | null;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
}) {
  if (!report) return null;
  const fmtMeta = formatMeta(report.metadata ?? null);

  return (
    <Dialog open={!!report} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            <span className="truncate">{report.title}</span>
            <Badge variant="outline" className="text-[10px] uppercase">
              {report.format}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {report.summary}
            {fmtMeta && ` · ${fmtMeta}`}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto custom-scroll pr-1" style={{ maxHeight: "calc(90vh - 160px)" }}>
          <ReportContent report={report} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onDownload} className="gap-2">
            <Download className="h-4 w-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportContent({ report }: { report: Report }) {
  if (report.format === "html" || report.format === "pdf") {
    return (
      <div className="space-y-2">
        {report.format === "pdf" && (
          <p className="rounded-md border border-muted bg-muted/30 p-2 text-xs text-muted-foreground">
            PDF preview uses the HTML content below. Use the Download button and
            print to PDF from your browser to save as a real PDF file.
          </p>
        )}
        <iframe
          srcDoc={report.content}
          title={report.title}
          className="h-[60vh] w-full rounded-md border bg-white"
          sandbox="allow-same-origin"
        />
      </div>
    );
  }
  if (report.format === "json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(report.content);
    } catch {
      parsed = report.content;
    }
    return <JsonView data={parsed} className="max-h-[60vh] overflow-y-auto custom-scroll" />;
  }
  if (report.format === "csv") {
    return (
      <pre className="font-mono text-xs bg-muted/40 rounded-md p-3 max-h-[60vh] overflow-auto custom-scroll whitespace-pre">
        {report.content}
      </pre>
    );
  }
  return null;
}
