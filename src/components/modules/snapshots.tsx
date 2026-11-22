"use client";

import * as React from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Eye,
  FileJson,
  Info,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ModuleHeader,
  EmptyState,
  JsonView,
  StatusBadge,
} from "@/components/module-common";
import { toast } from "@/hooks/use-toast";
import type {
  SnapshotIssue,
  SnapshotReport,
  SnapshotSummary,
} from "@/lib/types";

const SAMPLE_SNAPSHOT = {
  version: "1.4",
  workflows: [
    { id: "wf_1", name: "New Lead Welcome", pipelineId: "pipe_1", calendarId: "cal_1" },
    { id: "wf_2", name: "Appointment Reminder", pipelineId: "pipe_1", calendarId: "cal_2" },
    { id: "wf_3", name: "New Lead Welcome", pipelineId: "pipe_missing" },
  ],
  pipelines: [
    { id: "pipe_1", name: "Sales Pipeline" },
    { id: "pipe_2", name: "Onboarding" },
  ],
  calendars: [
    { id: "cal_1", name: "Discovery Calls" },
    { id: "cal_2", name: "Demo Calls" },
  ],
  forms: [
    { id: "form_1", name: "Contact Us" },
    { id: "form_2", name: "Lead Magnet Download" },
  ],
  customFields: [
    { id: "cf_1", name: "Lead Source" },
  ],
  tags: [
    { id: "tag_1", name: "hot-lead" },
    { id: "tag_2", name: "newsletter" },
  ],
  campaigns: [
    { id: "camp_1", name: "Welcome Sequence" },
  ],
};

const ENTITY_LABELS: Array<{ key: keyof SnapshotSummary; label: string }> = [
  { key: "workflows", label: "Workflows" },
  { key: "pipelines", label: "Pipelines" },
  { key: "calendars", label: "Calendars" },
  { key: "forms", label: "Forms" },
  { key: "customFields", label: "Custom Fields" },
  { key: "tags", label: "Tags" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const ISSUE_LEVEL_STYLE: Record<
  SnapshotIssue["level"],
  { label: string; className: string; icon: React.ReactNode }
> = {
  error: {
    label: "Error",
    className:
      "border-destructive/40 bg-destructive/10 text-destructive",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  warning: {
    label: "Warning",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  info: {
    label: "Info",
    className:
      "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    icon: <Info className="h-3 w-3" />,
  },
};

export function SnapshotsModule() {
  const [reports, setReports] = React.useState<SnapshotReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [validateOpen, setValidateOpen] = React.useState(false);
  const [viewTarget, setViewTarget] = React.useState<SnapshotReport | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [fileName, setFileName] = React.useState("snapshot.json");
  const [snapshotText, setSnapshotText] = React.useState("");
  const [jsonError, setJsonError] = React.useState<string | null>(null);
  const [validating, setValidating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/snapshots");
      const json = await res.json();
      if (json.success) {
        setReports(json.data as SnapshotReport[]);
      } else {
        toast({
          title: "Error",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function validateJson(text: string): boolean {
    if (!text.trim()) {
      setJsonError(null);
      return false;
    }
    try {
      JSON.parse(text);
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      return false;
    }
  }

  function handleTextChange(value: string) {
    setSnapshotText(value);
    validateJson(value);
  }

  function loadSample() {
    setSnapshotText(JSON.stringify(SAMPLE_SNAPSHOT, null, 2));
    setFileName("ghl-snapshot-sample.json");
    setJsonError(null);
  }

  async function handleValidate() {
    if (!snapshotText.trim()) {
      toast({
        title: "Empty snapshot",
        description: "Paste a snapshot JSON or click Load Sample.",
        variant: "destructive",
      });
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(snapshotText);
    } catch (e) {
      toast({
        title: "Invalid JSON",
        description: e instanceof Error ? e.message : "Could not parse JSON",
        variant: "destructive",
      });
      return;
    }
    setValidating(true);
    try {
      const res = await fetch("/api/snapshots/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: fileName || "snapshot.json", snapshot: parsed }),
      });
      const json = await res.json();
      if (json.success) {
        const report = json.data as SnapshotReport;
        toast({
          title: "Snapshot validated",
          description: `Status: ${report.status} · ${report.issues.length} issues found.`,
        });
        setValidateOpen(false);
        setSnapshotText("");
        setFileName("snapshot.json");
        setViewTarget(report);
        await load();
      } else {
        toast({
          title: "Validation failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setValidating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/snapshots/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Deleted", description: "Snapshot report removed." });
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
    }
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Snapshot Validator"
        description="Inspect GHL snapshot exports for structure, references, duplicates, and compatibility before importing."
        icon={<Boxes className="h-5 w-5" />}
        actions={
          <Button onClick={() => setValidateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Validate Snapshot
          </Button>
        }
      />

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>About this tool</AlertTitle>
        <AlertDescription>
          Snapshot Validator inspects GHL snapshot exports for structure,
          references, duplicates, and compatibility. Only verified capabilities
          are implemented; experimental checks are labeled as info-level
          findings.
        </AlertDescription>
      </Alert>

      {/* Reports grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<FileJson className="h-6 w-6" />}
          title="No snapshot reports yet"
          description="Click 'Validate Snapshot' to inspect a GHL snapshot export. Use 'Load Sample' to see how it works."
          action={
            <Button onClick={() => setValidateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Validate Snapshot
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <SnapshotCard
              key={r.id}
              report={r}
              onView={() => setViewTarget(r)}
              onDelete={() => handleDelete(r.id)}
              deleting={deletingId === r.id}
            />
          ))}
        </div>
      )}

      {/* Validate dialog */}
      <Dialog open={validateOpen} onOpenChange={setValidateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Validate Snapshot</DialogTitle>
            <DialogDescription>
              Paste a GHL snapshot export JSON. The validator checks entity
              structure, references, duplicates, and version compatibility.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1">
                <Label htmlFor="snap-filename">File name</Label>
                <Input
                  id="snap-filename"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="snapshot.json"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadSample}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" /> Load Sample
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="snap-json">Snapshot JSON</Label>
              <Textarea
                id="snap-json"
                value={snapshotText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder='{\n  "version": "1.4",\n  "workflows": [...],\n  ...'
                className="min-h-[280px] font-mono text-xs"
                aria-label="Snapshot JSON payload"
              />
              {jsonError && (
                <p className="text-xs text-destructive">{jsonError}</p>
              )}
              {!jsonError && snapshotText && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  JSON syntax OK
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setValidateOpen(false)}
              disabled={validating}
            >
              Cancel
            </Button>
            <Button onClick={handleValidate} disabled={validating} className="gap-2">
              {validating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Validate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <SnapshotViewDialog
        report={viewTarget}
        onOpenChange={(open) => !open && setViewTarget(null)}
      />
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function SnapshotCard({
  report,
  onView,
  onDelete,
  deleting,
}: {
  report: SnapshotReport;
  onView: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const summary = report.summary ?? ({} as SnapshotSummary);
  const errorCount = report.issues.filter((i) => i.level === "error").length;
  const warnCount = report.issues.filter((i) => i.level === "warning").length;

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-sm font-medium">
              {report.fileName}
            </CardTitle>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {formatFileSize(report.fileSize)} ·{" "}
              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <StatusBadge status={report.status} />
            {report.importReady ? (
              <Badge
                variant="outline"
                className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Import Ready
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Not Ready
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Entity counts */}
        <div className="flex flex-wrap gap-1.5">
          {ENTITY_LABELS.filter((e) => summary[e.key]).map((e) => (
            <Badge
              key={e.key}
              variant="secondary"
              className="text-[10px] font-medium"
            >
              {e.label}: {summary[e.key]}
            </Badge>
          ))}
          {summary.totalEntities !== undefined &&
            summary.totalEntities > 0 &&
            ENTITY_LABELS.every((e) => !summary[e.key]) && (
              <Badge variant="secondary" className="text-[10px]">
                Total: {summary.totalEntities}
              </Badge>
            )}
        </div>

        {/* Issue summary */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-muted-foreground">
            {report.issues.length} issue{report.issues.length === 1 ? "" : "s"}
          </span>
          {errorCount > 0 && (
            <span className="text-destructive">{errorCount} error{errorCount === 1 ? "" : "s"}</span>
          )}
          {warnCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {warnCount} warning{warnCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={onView} className="gap-2">
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={deleting}
            className="ml-auto gap-2 text-muted-foreground hover:text-destructive"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SnapshotViewDialog({
  report,
  onOpenChange,
}: {
  report: SnapshotReport | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [rawOpen, setRawOpen] = React.useState(false);
  const summary = report?.summary ?? ({} as SnapshotSummary);

  return (
    <Dialog open={!!report} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            <span className="truncate">{report?.fileName}</span>
            {report && <StatusBadge status={report.status} />}
          </DialogTitle>
          <DialogDescription>
            {report
              ? `${formatFileSize(report.fileSize)} · ${report.issues.length} issues · ${formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {report && (
          <div className="flex flex-col gap-4 overflow-y-auto custom-scroll pr-1" style={{ maxHeight: "calc(90vh - 130px)" }}>
            {/* Summary grid */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Entity counts
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                <SummaryStat label="Total Entities" value={summary.totalEntities ?? 0} />
                <SummaryStat label="Workflows" value={summary.workflows ?? 0} />
                <SummaryStat label="Pipelines" value={summary.pipelines ?? 0} />
                <SummaryStat label="Calendars" value={summary.calendars ?? 0} />
                <SummaryStat label="Forms" value={summary.forms ?? 0} />
                <SummaryStat label="Custom Fields" value={summary.customFields ?? 0} />
                <SummaryStat label="Tags" value={summary.tags ?? 0} />
                <SummaryStat
                  label="Import Ready"
                  value={report.importReady ? "Yes" : "No"}
                  highlight={report.importReady ? "ok" : "bad"}
                />
              </div>
            </section>

            {/* Issues list */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Issues ({report.issues.length})
              </h3>
              {report.issues.length === 0 ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="mr-2 inline h-4 w-4" />
                  No issues found. Snapshot passed all structural, reference, and
                  compatibility checks.
                </div>
              ) : (
                <ul className="space-y-2">
                  {report.issues.map((issue, i) => {
                    const style = ISSUE_LEVEL_STYLE[issue.level];
                    return (
                      <li
                        key={i}
                        className="rounded-md border bg-card p-3 text-sm"
                      >
                        <div className="flex items-start gap-3">
                          <Badge
                            variant="outline"
                            className={`mt-0.5 gap-1 text-[10px] ${style.className}`}
                          >
                            {style.icon}
                            {style.label}
                          </Badge>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <Badge variant="secondary" className="text-[10px] capitalize">
                                {issue.category}
                              </Badge>
                              {issue.path && (
                                <code className="font-mono text-[10px] text-muted-foreground break-all">
                                  {issue.path}
                                </code>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">
                              {issue.message}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Raw JSON */}
            <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileJson className="h-3.5 w-3.5" />
                  {rawOpen ? "Hide raw snapshot JSON" : "Show raw snapshot JSON"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <JsonView
                  data={report.snapshotJson}
                  className="max-h-80 overflow-y-auto custom-scroll"
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: "ok" | "bad";
}) {
  const valueClass =
    highlight === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : highlight === "bad"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="rounded-md border bg-muted/30 p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 text-lg font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}
