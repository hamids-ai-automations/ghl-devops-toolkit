import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit, safeParse } from "@/lib/api";

// POST /api/snapshots/validate - validate a GHL snapshot export (JSON payload)
// Performs structural inspection, reference validation, duplicate detection, and compatibility checks.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName = "snapshot.json", snapshot } = body || {};
    if (!snapshot || typeof snapshot !== "object") {
      return fail("Missing 'snapshot' JSON payload");
    }

    const issues: Array<{ level: "error" | "warning" | "info"; category: string; message: string; path?: string }> = [];
    const snapshotJson = JSON.stringify(snapshot, null, 2);

    // Collect entity arrays we know about
    const entities = ["workflows", "pipelines", "calendars", "forms", "customFields", "tags", "campaigns", "emailTemplates", "smsTemplates"];
    const counts: Record<string, number> = {};
    for (const key of entities) {
      const arr = (snapshot as Record<string, unknown>)[key];
      if (Array.isArray(arr)) {
        counts[key] = arr.length;
      } else if (arr !== undefined) {
        issues.push({ level: "warning", category: "structure", message: `Expected '${key}' to be an array but found ${typeof arr}.`, path: key });
      }
    }

    // Reference validation: workflows referencing pipelines/calendars
    const workflows = (snapshot as Record<string, unknown>).workflows;
    const pipelineIds = new Set<string>();
    const calendarIds = new Set<string>();
    if (Array.isArray((snapshot as Record<string, unknown>).pipelines)) {
      for (const p of (snapshot as Record<string, unknown>).pipelines as Array<Record<string, unknown>>) {
        if (typeof p.id === "string") pipelineIds.add(p.id);
      }
    }
    if (Array.isArray((snapshot as Record<string, unknown>).calendars)) {
      for (const c of (snapshot as Record<string, unknown>).calendars as Array<Record<string, unknown>>) {
        if (typeof c.id === "string") calendarIds.add(c.id);
      }
    }

    if (Array.isArray(workflows)) {
      workflows.forEach((wf, i) => {
        const w = wf as Record<string, unknown>;
        if (typeof w.calendarId === "string" && !calendarIds.has(w.calendarId)) {
          issues.push({ level: "warning", category: "references", message: `Workflow '${w.name ?? w.id}' references calendar '${w.calendarId}' which is not defined in this snapshot.`, path: `workflows[${i}].calendarId` });
        }
        if (typeof w.pipelineId === "string" && !pipelineIds.has(w.pipelineId)) {
          issues.push({ level: "error", category: "references", message: `Workflow '${w.name ?? w.id}' references pipeline '${w.pipelineId}' which is not defined.`, path: `workflows[${i}].pipelineId` });
        }
      });
    }

    // Duplicate detection - workflows with same name
    if (Array.isArray(workflows)) {
      const seen = new Map<string, number>();
      workflows.forEach((wf, i) => {
        const name = (wf as Record<string, unknown>).name as string | undefined;
        if (name) {
          if (seen.has(name)) {
            issues.push({ level: "warning", category: "duplicate", message: `Duplicate workflow name '${name}' found (also at index ${seen.get(name)}).`, path: `workflows[${i}].name` });
          } else {
            seen.set(name, i);
          }
        }
      });
    }

    // Missing critical configuration
    if (!counts.pipelines || counts.pipelines === 0) {
      issues.push({ level: "info", category: "missing", message: "No pipelines found. Workflows referencing pipelines will fail import." });
    }
    if (!snapshot.version) {
      issues.push({ level: "warning", category: "structure", message: "Snapshot is missing a 'version' field. Compatibility cannot be guaranteed." });
    }

    // Compatibility check
    const version = (snapshot as Record<string, unknown>).version as string | undefined;
    if (version && !version.startsWith("1.")) {
      issues.push({ level: "error", category: "compatibility", message: `Snapshot version '${version}' may not be supported by current GHL import tooling (expected 1.x).` });
    } else {
      issues.push({ level: "info", category: "compatibility", message: `Snapshot format ${version ? `v${version}` : "(unknown version)"} parsed successfully.` });
    }

    const hasErrors = issues.some((i) => i.level === "error");
    const hasWarnings = issues.some((i) => i.level === "warning");
    const status = hasErrors ? "invalid" : hasWarnings ? "warnings" : "valid";
    const importReady = !hasErrors;

    const report = await db.snapshotReport.create({
      data: {
        fileName,
        fileSize: Buffer.byteLength(snapshotJson, "utf8"),
        snapshotJson,
        summary: JSON.stringify({
          totalEntities: Object.values(counts).reduce((a, b) => a + b, 0),
          ...counts,
        }),
        issues: JSON.stringify(issues),
        status,
        importReady,
      },
    });

    await audit({
      action: "snapshot.validate",
      resourceType: "snapshot",
      resourceId: report.id,
      details: { status, issueCount: issues.length, fileName },
    });

    return ok({
      ...report,
      summary: safeParse(report.summary),
      issues,
    }, 201);
  } catch (e) {
    return fail("Failed to validate snapshot", e instanceof Error ? e.message : String(e), 500);
  }
}
