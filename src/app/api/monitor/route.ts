import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, safeParse } from "@/lib/api";

// GET /api/monitor - health checks + alerts + summary metrics
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const connectionId = url.searchParams.get("connectionId");

  const checks = await db.healthCheck.findMany({
    where: connectionId ? { connectionId } : {},
    orderBy: { checkedAt: "desc" },
    take: 200,
  });

  const alerts = await db.alertConfig.findMany({ orderBy: { createdAt: "desc" } });

  // Compute metrics
  const total = checks.length;
  const successful = checks.filter((c) => c.ok).length;
  const failed = total - successful;
  const successRate = total ? (successful / total) * 100 : 100;
  const avgLatency = total ? checks.reduce((a, c) => a + (c.responseTimeMs ?? 0), 0) / total : 0;
  const maxLatency = total ? Math.max(...checks.map((c) => c.responseTimeMs ?? 0)) : 0;

  // Group by hour for trend (last 24 buckets of 5 min = 2 hours)
  const trend: Array<{ time: string; ok: number; failed: number; avgLatency: number }> = [];
  const buckets = new Map<string, { ok: number; failed: number; totalLatency: number; count: number }>();
  for (const c of checks) {
    const t = new Date(c.checkedAt).toISOString().slice(0, 16); // yyyy-mm-ddTHH:MM
    const b = buckets.get(t) ?? { ok: 0, failed: 0, totalLatency: 0, count: 0 };
    if (c.ok) b.ok++;
    else b.failed++;
    b.totalLatency += c.responseTimeMs ?? 0;
    b.count++;
    buckets.set(t, b);
  }
  for (const [time, b] of buckets) {
    trend.push({ time, ok: b.ok, failed: b.failed, avgLatency: Math.round(b.totalLatency / b.count) });
  }
  trend.sort((a, b) => (a.time < b.time ? -1 : 1));

  return ok({
    checks: checks.map((c) => ({ ...c })),
    alerts,
    metrics: {
      total,
      successful,
      failed,
      successRate: Math.round(successRate * 10) / 10,
      avgLatency: Math.round(avgLatency),
      maxLatency,
    },
    trend,
  });
}
