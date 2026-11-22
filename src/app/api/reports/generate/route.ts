import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit, safeParse } from "@/lib/api";

type ReportType = "api_diagnostics" | "testing_results" | "webhook_history" | "integration_health" | "full_summary";

// POST /api/reports/generate - generate a technical report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type = "full_summary", format = "html", title } = body || {};
    if (!["api_diagnostics", "testing_results", "webhook_history", "integration_health", "full_summary"].includes(type)) {
      return fail("Invalid report type");
    }
    if (!["html", "json", "csv", "pdf"].includes(format)) {
      return fail("Invalid format (html, json, csv, pdf)");
    }

    const t = type as ReportType;

    // Gather data
    const [apiRequests, webhookEvents, testRuns, healthChecks, snapshots, connections] = await Promise.all([
      db.apiRequest.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      db.webhookEvent.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      db.testRun.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      db.healthCheck.findMany({ orderBy: { checkedAt: "desc" }, take: 100 }),
      db.snapshotReport.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      db.ghlConnection.findMany(),
    ]);

    const totalChecks = healthChecks.length;
    const okChecks = healthChecks.filter((c) => c.ok).length;
    const successRate = totalChecks ? (okChecks / totalChecks) * 100 : 100;
    const avgLatency = totalChecks ? Math.round(healthChecks.reduce((a, c) => a + (c.responseTimeMs ?? 0), 0) / totalChecks) : 0;

    const totalTests = testRuns.length;
    const passedTests = testRuns.filter((t) => t.status === "passed").length;
    const testPassRate = totalTests ? (passedTests / totalTests) * 100 : 0;

    const summary =
      t === "api_diagnostics"
        ? `${apiRequests.length} API requests analyzed. Success rate based on responses.`
        : t === "testing_results"
        ? `${totalTests} test runs. Pass rate ${testPassRate.toFixed(1)}%.`
        : t === "webhook_history"
        ? `${webhookEvents.length} webhook events captured across ${new Set(webhookEvents.map((w) => w.eventType)).size} event types.`
        : t === "integration_health"
        ? `${totalChecks} health checks. Success rate ${successRate.toFixed(1)}%. Avg latency ${avgLatency}ms.`
        : `Full system summary: ${connections.length} connections, ${apiRequests.length} API calls, ${webhookEvents.length} webhooks, ${totalTests} test runs, ${totalChecks} health checks, ${snapshots.length} snapshots.`;

    let content = "";
    let metadata: Record<string, unknown> = {};

    if (format === "json") {
      const payload: Record<string, unknown> = {
        generatedAt: new Date().toISOString(),
        type: t,
        summary,
      };
      if (t === "api_diagnostics" || t === "full_summary") payload.apiRequests = apiRequests;
      if (t === "webhook_history" || t === "full_summary") payload.webhookEvents = webhookEvents;
      if (t === "testing_results" || t === "full_summary") payload.testRuns = testRuns;
      if (t === "integration_health" || t === "full_summary") {
        payload.metrics = { totalChecks, okChecks, successRate, avgLatency };
        payload.healthChecks = healthChecks.slice(0, 20);
      }
      content = JSON.stringify(payload, null, 2);
      metadata = { totalRecords: apiRequests.length + webhookEvents.length + testRuns.length };
    } else if (format === "csv") {
      const rows: string[][] = [["section", "metric", "value"]];
      rows.push(["summary", "type", t]);
      rows.push(["summary", "generatedAt", new Date().toISOString()]);
      rows.push(["connections", "count", String(connections.length)]);
      rows.push(["apiRequests", "count", String(apiRequests.length)]);
      rows.push(["webhooks", "count", String(webhookEvents.length)]);
      rows.push(["testRuns", "count", String(totalTests)]);
      rows.push(["testRuns", "passed", String(passedTests)]);
      rows.push(["testRuns", "passRate", testPassRate.toFixed(2)]);
      rows.push(["healthChecks", "count", String(totalChecks)]);
      rows.push(["healthChecks", "successRate", successRate.toFixed(2)]);
      rows.push(["healthChecks", "avgLatencyMs", String(avgLatency)]);
      rows.push(["snapshots", "count", String(snapshots.length)]);
      content = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      metadata = { rows: rows.length };
    } else {
      content = generateHtmlReport({
        type: t,
        summary,
        apiRequests,
        webhookEvents,
        testRuns,
        healthChecks,
        snapshots,
        connections,
        metrics: { totalChecks, okChecks, successRate, avgLatency, totalTests, passedTests, testPassRate },
      });
      metadata = { sections: t === "full_summary" ? 6 : 1 };
    }

    const report = await db.report.create({
      data: {
        title: title || `${t.replace(/_/g, " ")} report - ${new Date().toLocaleString()}`,
        type: t,
        format,
        content,
        summary,
        metadata: JSON.stringify(metadata),
      },
    });

    await audit({ action: "report.generate", resourceType: "report", resourceId: report.id, details: { type: t, format } });

    return ok({ ...report, metadata }, 201);
  } catch (e) {
    return fail("Failed to generate report", e instanceof Error ? e.message : String(e), 500);
  }
}

function generateHtmlReport(args: {
  type: ReportType;
  summary: string;
  apiRequests: Array<{ method: string; endpoint: string; statusCode: number | null; status: string; durationMs: number | null; createdAt: Date }>;
  webhookEvents: Array<{ eventType: string; endpoint: string; createdAt: Date }>;
  testRuns: Array<{ name: string; status: string; assertionsRun: number; assertionsPassed: number; durationMs: number | null; createdAt: Date }>;
  healthChecks: Array<{ endpoint: string; statusCode: number | null; responseTimeMs: number | null; ok: boolean; errorMessage: string | null; checkedAt: Date }>;
  snapshots: Array<{ fileName: string; status: string; importReady: boolean }>;
  connections: Array<{ id: string; name: string; status: string }>;
  metrics: { totalChecks: number; okChecks: number; successRate: number; avgLatency: number; totalTests: number; passedTests: number; testPassRate: number };
}): string {
  const { type, summary, apiRequests, webhookEvents, testRuns, healthChecks, snapshots, connections, metrics } = args;
  const esc = (s: unknown) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

  const sections: string[] = [];
  sections.push(`<h1>GHL DevOps Toolkit - Technical Report</h1>`);
  sections.push(`<p><strong>Type:</strong> ${esc(type.replace(/_/g, " "))}</p>`);
  sections.push(`<p><strong>Generated:</strong> ${new Date().toISOString()}</p>`);
  sections.push(`<p><strong>Summary:</strong> ${esc(summary)}</p>`);

  sections.push(`<h2>Connections (${connections.length})</h2><ul>${connections.map((c) => `<li>${esc(c.name)} - ${esc(c.status)}</li>`).join("")}</ul>`);

  if (type === "api_diagnostics" || type === "full_summary") {
    sections.push(`<h2>API Requests (${apiRequests.length})</h2><table border="1" cellpadding="4"><tr><th>Method</th><th>Endpoint</th><th>Status</th><th>Duration</th><th>At</th></tr>${apiRequests.map((r) => `<tr><td>${esc(r.method)}</td><td>${esc(r.endpoint)}</td><td>${esc(r.statusCode ?? "-")} (${esc(r.status)})</td><td>${esc(r.durationMs ?? "-")}ms</td><td>${esc(r.createdAt.toISOString())}</td></tr>`).join("")}</table>`);
  }
  if (type === "webhook_history" || type === "full_summary") {
    sections.push(`<h2>Webhook Events (${webhookEvents.length})</h2><table border="1" cellpadding="4"><tr><th>Event Type</th><th>Endpoint</th><th>At</th></tr>${webhookEvents.map((w) => `<tr><td>${esc(w.eventType)}</td><td>${esc(w.endpoint)}</td><td>${esc(w.createdAt.toISOString())}</td></tr>`).join("")}</table>`);
  }
  if (type === "testing_results" || type === "full_summary") {
    sections.push(`<h2>Test Runs (${metrics.totalTests})</h2><p>Pass rate: ${metrics.testPassRate.toFixed(1)}% (${metrics.passedTests}/${metrics.totalTests})</p><table border="1" cellpadding="4"><tr><th>Name</th><th>Status</th><th>Assertions</th><th>Duration</th><th>At</th></tr>${testRuns.map((t) => `<tr><td>${esc(t.name)}</td><td>${esc(t.status)}</td><td>${t.assertionsPassed}/${t.assertionsRun}</td><td>${esc(t.durationMs ?? "-")}ms</td><td>${esc(t.createdAt.toISOString())}</td></tr>`).join("")}</table>`);
  }
  if (type === "integration_health" || type === "full_summary") {
    sections.push(`<h2>Integration Health</h2><p>Success rate: ${metrics.successRate.toFixed(1)}% (${metrics.okChecks}/${metrics.totalChecks}). Avg latency: ${metrics.avgLatency}ms</p><table border="1" cellpadding="4"><tr><th>Endpoint</th><th>Status</th><th>Latency</th><th>OK</th><th>At</th></tr>${healthChecks.slice(0, 20).map((c) => `<tr><td>${esc(c.endpoint)}</td><td>${esc(c.statusCode ?? "-")}</td><td>${esc(c.responseTimeMs ?? "-")}ms</td><td>${c.ok ? "yes" : "no"}</td><td>${esc(c.checkedAt.toISOString())}</td></tr>`).join("")}</table>`);
  }
  if (type === "full_summary") {
    sections.push(`<h2>Snapshots (${snapshots.length})</h2><ul>${snapshots.map((s) => `<li>${esc(s.fileName)} - ${esc(s.status)} (import ready: ${s.importReady})</li>`).join("")}</ul>`);
  }

  sections.push(`<hr><p style="color:#888;font-size:12px">Generated by GHL DevOps Toolkit. This report may contain simulated/demo data when in demo mode.</p>`);
  return sections.join("\n");
}
