"use client";

import * as React from "react";
import {
  Activity,
  ArrowRight,
  Boxes,
  FlaskConical,
  LayoutDashboard,
  Plug,
  Terminal,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ModuleHeader,
  EmptyState,
  StatusBadge,
} from "@/components/module-common";
import { useNavStore } from "@/hooks/use-nav";
import { toast } from "@/hooks/use-toast";
import type {
  ApiRequest,
  GhlConnection,
  ModuleId,
  WebhookEvent,
} from "@/lib/types";

interface OverviewStats {
  connections: number;
  apiRequests: number;
  webhooks: number;
  testRuns: number;
  monitorHealth: { total: number; successful: number; successRate: number };
  snapshots: number;
  reports: number;
}

interface RecentActivity {
  apiRequests: ApiRequest[];
  webhookEvents: WebhookEvent[];
}

const QUICK_START_CARDS: Array<{
  id: ModuleId;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "connections",
    title: "Connections",
    description: "Add a GHL location & access token",
    icon: <Plug className="h-5 w-5" />,
  },
  {
    id: "api-explorer",
    title: "API Explorer",
    description: "Test endpoints & inspect responses",
    icon: <Terminal className="h-5 w-5" />,
  },
  {
    id: "webhooks",
    title: "Webhook Inspector",
    description: "Capture & validate webhook events",
    icon: <Webhook className="h-5 w-5" />,
  },
  {
    id: "workflows",
    title: "Workflow Simulator",
    description: "Simulate lead journeys end-to-end",
    icon: <Workflow className="h-5 w-5" />,
  },
  {
    id: "testing",
    title: "Automation Testing",
    description: "Build test cases and run suites",
    icon: <FlaskConical className="h-5 w-5" />,
  },
  {
    id: "monitor",
    title: "Integration Monitor",
    description: "Track API latency & webhook health",
    icon: <Activity className="h-5 w-5" />,
  },
];

export function OverviewModule() {
  const setNav = useNavStore((s) => s.set);
  const [stats, setStats] = React.useState<OverviewStats | null>(null);
  const [recent, setRecent] = React.useState<RecentActivity | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    // Fire-and-forget demo seed (ignores errors)
    fetch("/api/seed", { method: "POST" }).catch(() => undefined);

    async function loadAll() {
      try {
        const [
          connsRes,
          apiRes,
          webhooksRes,
          workflowsRes,
          testRunsRes,
          monitorRes,
          snapshotsRes,
          reportsRes,
        ] = await Promise.all([
          fetch("/api/connections").then((r) => r.json()),
          fetch("/api/api-explorer/history").then((r) => r.json()),
          fetch("/api/webhooks").then((r) => r.json()),
          fetch("/api/workflows").then((r) => r.json()),
          fetch("/api/testing/run").then((r) => r.json()),
          fetch("/api/monitor").then((r) => r.json()),
          fetch("/api/snapshots").then((r) => r.json()),
          fetch("/api/reports").then((r) => r.json()),
        ]);

        if (cancelled) return;

        const connections: GhlConnection[] = connsRes.success
          ? (connsRes.data as GhlConnection[])
          : [];
        const apiRequests: ApiRequest[] = apiRes.success
          ? (apiRes.data as ApiRequest[])
          : [];
        const webhookEvents: WebhookEvent[] = webhooksRes.success
          ? (webhooksRes.data as WebhookEvent[])
          : [];

        const monitorMetrics = monitorRes.success
          ? (monitorRes.data?.metrics ?? {
              total: 0,
              successful: 0,
              successRate: 100,
            })
          : { total: 0, successful: 0, successRate: 100 };

        setStats({
          connections: connections.length,
          apiRequests: apiRequests.length,
          webhooks: webhookEvents.length,
          testRuns: testRunsRes.success
            ? ((testRunsRes.data as unknown[]) ?? []).length
            : 0,
          monitorHealth: {
            total: monitorMetrics.total ?? 0,
            successful: monitorMetrics.successful ?? 0,
            successRate: monitorMetrics.successRate ?? 100,
          },
          snapshots: snapshotsRes.success
            ? ((snapshotsRes.data as unknown[]) ?? []).length
            : 0,
          reports: reportsRes.success
            ? ((reportsRes.data as unknown[]) ?? []).length
            : 0,
        });

        setRecent({
          apiRequests: apiRequests.slice(0, 5),
          webhookEvents: webhookEvents.slice(0, 5),
        });
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "Error",
            description: err instanceof Error ? err.message : "Failed to load dashboard data",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Overview"
        description="Dashboard summary across every toolkit module"
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      {/* Hero card */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-muted/40">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                GHL DevOps Toolkit
              </h2>
              <Badge variant="outline" className="border-primary/30 text-primary">
                <Zap className="h-3 w-3" /> Demo Mode
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              An open-source developer platform for inspecting GoHighLevel
              automations &mdash; test APIs, capture webhooks, simulate
              workflows, and run regression suites in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setNav("connections")} className="gap-2">
              <Plug className="h-4 w-4" /> Get Started
            </Button>
            <Button
              variant="outline"
              onClick={() => setNav("api-explorer")}
              className="gap-2"
            >
              <Terminal className="h-4 w-4" /> Try API Explorer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metric grid */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          Activity summary
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Connections"
            value={stats?.connections}
            loading={loading}
            icon={<Plug className="h-5 w-5" />}
            onClick={() => setNav("connections")}
          />
          <MetricCard
            label="API Requests"
            value={stats?.apiRequests}
            loading={loading}
            icon={<Terminal className="h-5 w-5" />}
            onClick={() => setNav("api-explorer")}
          />
          <MetricCard
            label="Webhooks Captured"
            value={stats?.webhooks}
            loading={loading}
            icon={<Webhook className="h-5 w-5" />}
            onClick={() => setNav("webhooks")}
          />
          <MetricCard
            label="Test Runs"
            value={stats?.testRuns}
            loading={loading}
            icon={<FlaskConical className="h-5 w-5" />}
            onClick={() => setNav("testing")}
          />
        </div>
      </section>

      {/* Secondary metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Monitor checks
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {stats?.monitorHealth.total ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stats?.monitorHealth.successRate ?? 100}% success
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Snapshots
            </CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold">{stats?.snapshots ?? 0}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Reports
            </CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold">{stats?.reports ?? 0}</span>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick start */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          Quick start
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_START_CARDS.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
            >
              <button
                onClick={() => setNav(c.id)}
                className="flex w-full items-start gap-3 p-4 text-left"
                aria-label={`Open ${c.title}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {c.icon}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{c.title}</p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.description}
                  </p>
                </div>
              </button>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          Recent activity
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecentApiRequests
            loading={loading}
            items={recent?.apiRequests ?? []}
            onViewAll={() => setNav("api-explorer")}
          />
          <RecentWebhooks
            loading={loading}
            items={recent?.webhookEvents ?? []}
            onViewAll={() => setNav("webhooks")}
          />
        </div>
      </section>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function MetricCard({
  label,
  value,
  loading,
  icon,
  onClick,
}: {
  label: string;
  value?: number;
  loading: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Card className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <button
            onClick={onClick}
            className="flex w-full items-baseline justify-between text-left"
            aria-label={`View ${label}`}
          >
            <span className="text-2xl font-bold">{value ?? 0}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function RecentApiRequests({
  loading,
  items,
  onViewAll,
}: {
  loading: boolean;
  items: ApiRequest[];
  onViewAll: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Recent API requests</CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Terminal className="h-5 w-5" />}
            title="No requests yet"
            description="Run your first request in the API Explorer."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Badge
                    variant={
                      r.method === "GET"
                        ? "secondary"
                        : r.method === "DELETE"
                          ? "destructive"
                          : "default"
                    }
                    className="font-mono text-[10px]"
                  >
                    {r.method}
                  </Badge>
                  <span className="truncate font-mono text-xs">{r.endpoint}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r.statusCode && (
                    <span
                      className={
                        "font-mono text-xs " +
                        (r.statusCode >= 200 && r.statusCode < 300
                          ? "text-emerald-600 dark:text-emerald-400"
                          : r.statusCode >= 400
                            ? "text-destructive"
                            : "text-muted-foreground")
                      }
                    >
                      {r.statusCode}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(r.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecentWebhooks({
  loading,
  items,
  onViewAll,
}: {
  loading: boolean;
  items: WebhookEvent[];
  onViewAll: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Recent webhook events</CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Webhook className="h-5 w-5" />}
            title="No webhooks captured"
            description="Configure GHL to POST to your capture URL."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {w.eventType}
                  </Badge>
                  <span className="truncate font-mono text-xs">{w.endpoint}</span>
                </div>
                <div className="flex items-center gap-2">
                  {w.signatureValid === true ? (
                    <StatusBadge status="valid" />
                  ) : w.signatureValid === false ? (
                    <StatusBadge status="invalid" />
                  ) : null}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(w.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
