"use client";

import * as React from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Gauge,
  Loader2,
  Plug,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ModuleHeader, EmptyState, StatusBadge } from "@/components/module-common";
import { toast } from "@/hooks/use-toast";
import type {
  AlertConfig,
  GhlConnection,
  HealthCheck,
  HttpMethod,
} from "@/lib/types";

interface MonitorData {
  checks: HealthCheck[];
  alerts: AlertConfig[];
  metrics: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    avgLatency: number;
    maxLatency: number;
  };
  trend: Array<{ time: string; ok: number; failed: number; avgLatency: number }>;
}

const ENDPOINTS = [
  "/contacts",
  "/contacts?limit=10",
  "/calendars/events",
  "/opportunities",
  "/users",
];

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const ALERT_TYPES: Array<{ value: AlertConfig["type"]; label: string; unit: string }> = [
  { value: "error_rate", label: "Error Rate (%)", unit: "%" },
  { value: "latency", label: "Latency (ms)", unit: "ms" },
  { value: "webhook_failure", label: "Webhook Failure Count", unit: "events" },
];

function formatTimeLabel(time: string): string {
  // time like "2025-01-01T13:05" -> "13:05"
  const t = time.split("T")[1] ?? time;
  return t.slice(0, 5);
}

export function MonitorModule() {
  const [data, setData] = React.useState<MonitorData | null>(null);
  const [connections, setConnections] = React.useState<GhlConnection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterConnectionId, setFilterConnectionId] = React.useState("all");

  const [checkOpen, setCheckOpen] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [runningCheck, setRunningCheck] = React.useState(false);
  const [savingAlert, setSavingAlert] = React.useState(false);
  const [togglingAlertId, setTogglingAlertId] = React.useState<string | null>(null);
  const [deletingAlertId, setDeletingAlertId] = React.useState<string | null>(null);

  // Check dialog state
  const [checkConn, setCheckConn] = React.useState("");
  const [checkEndpoint, setCheckEndpoint] = React.useState("/contacts");
  const [checkMethod, setCheckMethod] = React.useState<HttpMethod>("GET");

  // Alert dialog state
  const [alertName, setAlertName] = React.useState("");
  const [alertType, setAlertType] = React.useState<AlertConfig["type"]>("error_rate");
  const [alertThreshold, setAlertThreshold] = React.useState("10");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filterConnectionId === "all"
          ? "/api/monitor"
          : `/api/monitor?connectionId=${encodeURIComponent(filterConnectionId)}`;
      const [monRes, connRes] = await Promise.all([
        fetch(url),
        fetch("/api/connections"),
      ]);
      const monJson = await monRes.json();
      const connJson = await connRes.json();
      if (monJson.success) setData(monJson.data as MonitorData);
      if (connJson.success) setConnections(connJson.data as GhlConnection[]);
    } finally {
      setLoading(false);
    }
  }, [filterConnectionId]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Default check conn when opening dialog
  React.useEffect(() => {
    if (checkOpen) {
      setCheckConn(
        filterConnectionId !== "all"
          ? filterConnectionId
          : connections[0]?.id ?? "",
      );
    }
  }, [checkOpen, filterConnectionId, connections]);

  async function handleRunCheck() {
    if (!checkConn) {
      toast({
        title: "Select a connection",
        description: "Pick a GHL connection to run the check against.",
        variant: "destructive",
      });
      return;
    }
    setRunningCheck(true);
    try {
      const res = await fetch("/api/monitor/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: checkConn,
          endpoint: checkEndpoint,
          method: checkMethod,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const check = json.data as HealthCheck;
        toast({
          title: check.ok ? "Health check passed" : "Health check failed",
          description: `${check.method} ${check.endpoint} → HTTP ${check.statusCode ?? "?"} (${check.responseTimeMs ?? 0}ms)`,
          variant: check.ok ? "default" : "destructive",
        });
        setCheckOpen(false);
        await load();
      } else {
        toast({
          title: "Health check failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setRunningCheck(false);
    }
  }

  async function handleCreateAlert() {
    if (!alertName || !alertType || alertThreshold === "") {
      toast({
        title: "Missing fields",
        description: "Name, type, and threshold are required.",
        variant: "destructive",
      });
      return;
    }
    setSavingAlert(true);
    try {
      const res = await fetch("/api/monitor/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: alertName,
          type: alertType,
          threshold: Number(alertThreshold),
          enabled: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: "Alert created",
          description: `${alertName} will trigger when ${alertType} exceeds ${alertThreshold}.`,
        });
        setAlertOpen(false);
        setAlertName("");
        setAlertThreshold("10");
        setAlertType("error_rate");
        await load();
      } else {
        toast({
          title: "Failed to create alert",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setSavingAlert(false);
    }
  }

  async function handleToggleAlert(alert: AlertConfig) {
    setTogglingAlertId(alert.id);
    try {
      const res = await fetch(`/api/monitor/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !alert.enabled }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: alert.enabled ? "Alert disabled" : "Alert enabled",
          description: alert.name,
        });
        await load();
      } else {
        toast({
          title: "Update failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setTogglingAlertId(null);
    }
  }

  async function handleUpdateThreshold(alert: AlertConfig, threshold: number) {
    try {
      const res = await fetch(`/api/monitor/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Threshold updated", description: `${alert.name} → ${threshold}` });
        await load();
      } else {
        toast({
          title: "Update failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } catch {
      /* swallow */
    }
  }

  async function handleDeleteAlert(id: string) {
    setDeletingAlertId(id);
    try {
      const res = await fetch(`/api/monitor/alerts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Alert deleted" });
        await load();
      } else {
        toast({
          title: "Delete failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setDeletingAlertId(null);
    }
  }

  const metrics = data?.metrics;
  const trendData = (data?.trend ?? []).map((t) => ({
    ...t,
    timeLabel: formatTimeLabel(t.time),
  }));

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Integration Monitor"
        description="Track API latency, success rates, and trigger alerts when integrations degrade."
        icon={<Activity className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Select value={filterConnectionId} onValueChange={setFilterConnectionId}>
              <SelectTrigger className="h-9 w-[180px]" aria-label="Filter by connection">
                <SelectValue placeholder="All connections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All connections</SelectItem>
                {connections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setCheckOpen(true)} className="gap-2">
              <Gauge className="h-4 w-4" /> Run Health Check
            </Button>
          </div>
        }
      />

      {/* Top metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Success Rate"
          value={metrics ? `${metrics.successRate}%` : undefined}
          icon={<CheckCircle2 className="h-4 w-4" />}
          loading={loading}
          highlight={
            metrics && metrics.successRate >= 95
              ? "ok"
              : metrics && metrics.successRate < 80
                ? "bad"
                : undefined
          }
        />
        <MetricCard
          label="Total Checks"
          value={metrics?.total}
          icon={<Activity className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          label="Avg Latency"
          value={metrics ? `${metrics.avgLatency}ms` : undefined}
          icon={<Clock className="h-4 w-4" />}
          loading={loading}
          highlight={
            metrics && metrics.avgLatency > 1000 ? "bad" : undefined
          }
        />
        <MetricCard
          label="Failed Checks"
          value={metrics?.failed}
          icon={<XCircle className="h-4 w-4" />}
          loading={loading}
          highlight={
            metrics && metrics.failed > 0 ? "bad" : undefined
          }
        />
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Health Trend</CardTitle>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: "var(--chart-2)" }}
                />
                Avg Latency (ms)
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: "var(--chart-1)" }}
                />
                OK checks
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : trendData.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="No trend data yet"
              description="Run a few health checks to populate the trend chart."
            />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fontSize: 10 }}
                    className="fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10 }}
                    className="fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    className="fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    labelClassName="text-muted-foreground"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgLatency"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    fill="url(#latencyGrad)"
                    name="Avg Latency (ms)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ok"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={false}
                    name="OK checks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent checks table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Health Checks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : !data || data.checks.length === 0 ? (
            <EmptyState
              icon={<Gauge className="h-6 w-6" />}
              title="No health checks recorded"
              description="Run a manual health check from the action above."
              action={
                <Button onClick={() => setCheckOpen(true)} className="gap-2">
                  <Gauge className="h-4 w-4" /> Run Health Check
                </Button>
              }
            />
          ) : (
            <div className="max-h-96 overflow-y-auto custom-scroll rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="text-xs">Endpoint</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Latency</TableHead>
                    <TableHead className="text-xs">OK</TableHead>
                    <TableHead className="text-xs">Error</TableHead>
                    <TableHead className="text-xs">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.checks.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">
                        <span className="text-muted-foreground">{c.method}</span>{" "}
                        {c.endpoint}
                      </TableCell>
                      <TableCell>
                        {c.statusCode ? (
                          <span
                            className={
                              "font-mono text-xs " +
                              (c.statusCode >= 200 && c.statusCode < 300
                                ? "text-emerald-600 dark:text-emerald-400"
                                : c.statusCode >= 400
                                  ? "text-destructive"
                                  : "text-muted-foreground")
                            }
                          >
                            {c.statusCode}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.responseTimeMs ?? 0}ms
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.ok ? "success" : "failed"} />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {c.errorMessage || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.checkedAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" /> Alerts
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setAlertOpen(true)} className="gap-2">
              <Plus className="h-3.5 w-3.5" /> Add Alert
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : !data || data.alerts.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-6 w-6" />}
              title="No alerts configured"
              description="Add an alert to be notified when error rate, latency, or webhook failures exceed a threshold."
              action={
                <Button size="sm" onClick={() => setAlertOpen(true)} className="gap-2">
                  <Plus className="h-3.5 w-3.5" /> Add Alert
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {data.alerts.map((a) => {
                const unit =
                  ALERT_TYPES.find((t) => t.value === a.type)?.unit ?? "";
                return (
                  <li
                    key={a.id}
                    className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{a.name}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {a.type.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>Threshold:</span>
                          <Input
                            type="number"
                            defaultValue={a.threshold}
                            onBlur={(e) => {
                              const v = Number(e.target.value);
                              if (!Number.isNaN(v) && v !== a.threshold) {
                                handleUpdateThreshold(a, v);
                              }
                            }}
                            className="h-6 w-20 font-mono text-xs"
                            aria-label={`Threshold for ${a.name}`}
                          />
                          <span>{unit}</span>
                          {a.lastTriggered && (
                            <span>
                              · Last triggered{" "}
                              {formatDistanceToNow(new Date(a.lastTriggered), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`alert-toggle-${a.id}`} className="sr-only">
                          {a.enabled ? "Enabled" : "Disabled"}
                        </Label>
                        <Switch
                          id={`alert-toggle-${a.id}`}
                          checked={a.enabled}
                          disabled={togglingAlertId === a.id}
                          onCheckedChange={() => handleToggleAlert(a)}
                        />
                        <Badge variant={a.enabled ? "default" : "outline"} className="text-[10px]">
                          {a.enabled ? "On" : "Off"}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAlert(a.id)}
                        disabled={deletingAlertId === a.id}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Delete alert ${a.name}`}
                      >
                        {deletingAlertId === a.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Run Health Check dialog */}
      <Dialog open={checkOpen} onOpenChange={setCheckOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Run Health Check</DialogTitle>
            <DialogDescription>
              Sends a real request to the GHL API and records the response status,
              latency, and result.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="check-conn">Connection</Label>
              <Select value={checkConn} onValueChange={setCheckConn}>
                <SelectTrigger id="check-conn" className="w-full">
                  <SelectValue placeholder="Select a connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No connections available
                    </SelectItem>
                  ) : (
                    connections.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} · {c.locationId}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {connections.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No connections yet. Add one in the Connections module.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="check-endpoint">Endpoint</Label>
              <Select value={checkEndpoint} onValueChange={setCheckEndpoint}>
                <SelectTrigger id="check-endpoint" className="w-full font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENDPOINTS.map((e) => (
                    <SelectItem key={e} value={e} className="font-mono text-xs">
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="check-method">HTTP Method</Label>
              <Select
                value={checkMethod}
                onValueChange={(v) => setCheckMethod(v as HttpMethod)}
              >
                <SelectTrigger id="check-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckOpen(false)} disabled={runningCheck}>
              Cancel
            </Button>
            <Button onClick={handleRunCheck} disabled={runningCheck} className="gap-2">
              {runningCheck ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plug className="h-4 w-4" />
              )}
              Run Check
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Alert dialog */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Alert</DialogTitle>
            <DialogDescription>
              Alerts evaluate health checks and webhook failures against a threshold.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="alert-name">Name</Label>
              <Input
                id="alert-name"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
                placeholder="e.g. High error rate"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alert-type">Type</Label>
              <Select
                value={alertType}
                onValueChange={(v) => setAlertType(v as AlertConfig["type"])}
              >
                <SelectTrigger id="alert-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alert-threshold">Threshold</Label>
              <Input
                id="alert-threshold"
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                placeholder="e.g. 10"
              />
              <p className="text-[10px] text-muted-foreground">
                {ALERT_TYPES.find((t) => t.value === alertType)?.label} — alert
                fires when the metric exceeds this value.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertOpen(false)} disabled={savingAlert}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlert} disabled={savingAlert} className="gap-2">
              {savingAlert ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function MetricCard({
  label,
  value,
  icon,
  loading,
  highlight,
}: {
  label: string;
  value?: string | number;
  icon: React.ReactNode;
  loading: boolean;
  highlight?: "ok" | "bad";
}) {
  const valueColor =
    highlight === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : highlight === "bad"
        ? "text-destructive"
        : "text-foreground";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <span className={`text-2xl font-bold ${valueColor}`}>
            {value ?? "—"}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
