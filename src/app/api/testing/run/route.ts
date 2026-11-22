import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit, safeParse } from "@/lib/api";
import { executeGhlRequest } from "@/lib/ghl-client";
import type { Assertion, Failure } from "@/lib/types";

// GET /api/testing/run - list test runs
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const suiteId = url.searchParams.get("suiteId");
  const caseId = url.searchParams.get("caseId");
  const where: Record<string, unknown> = {};
  if (suiteId) where.suiteId = suiteId;
  if (caseId) where.caseId = caseId;
  const runs = await db.testRun.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const data = runs.map((r) => ({
    ...r,
    failures: safeParse(r.failures) ?? [],
  }));
  return ok(data);
}

// POST /api/testing/run - run a single test case or an entire suite
// Body: { caseId?: string, suiteId?: string, connectionId?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId, suiteId, connectionId } = body || {};
    if (!caseId && !suiteId) return fail("Provide caseId or suiteId");

    const cases = caseId
      ? [await db.testCase.findUnique({ where: { id: caseId } })]
      : await db.testCase.findMany({ where: { suiteId } });

    const validCases = cases.filter(Boolean);
    if (validCases.length === 0) return fail("No test cases found", null, 404);

    const runs: unknown[] = [];
    let allPassed = true;

    for (const tc of validCases) {
      if (!tc) continue;
      const result = await runCase(tc, connectionId);
      runs.push(result);
      if (result.status !== "passed") allPassed = false;
    }

    const suiteName =
      suiteId ? (await db.testSuite.findUnique({ where: { id: suiteId } }))?.name : validCases[0]?.name;

    const summaryRun = await db.testRun.create({
      data: {
        caseId: caseId || null,
        suiteId: suiteId || null,
        connectionId: connectionId || null,
        name: suiteName || "Test Run",
        status: allPassed ? "passed" : "failed",
        assertionsRun: (runs as Array<{ assertionsRun: number }>).reduce((a, r) => a + r.assertionsRun, 0),
        assertionsPassed: (runs as Array<{ assertionsPassed: number }>).reduce((a, r) => a + r.assertionsPassed, 0),
        failures: JSON.stringify((runs as Array<{ failures?: Failure[] }>).flatMap((r) => r.failures ?? [])),
        durationMs: (runs as Array<{ durationMs?: number }>).reduce((a, r) => a + (r.durationMs ?? 0), 0),
        output: `${(runs as Array<{ status: string }>).filter((r) => r.status === "passed").length}/${runs.length} cases passed`,
        simulated: true,
      },
    });

    await audit({
      action: "test.run",
      resourceType: suiteId ? "test_suite" : "test_case",
      resourceId: suiteId || caseId || null,
      details: { casesRun: runs.length, allPassed, runId: summaryRun.id },
    });

    return ok({
      runId: summaryRun.id,
      status: summaryRun.status,
      assertionsRun: summaryRun.assertionsRun,
      assertionsPassed: summaryRun.assertionsPassed,
      cases: runs,
      simulated: true,
    });
  } catch (e) {
    return fail("Failed to run tests", e instanceof Error ? e.message : String(e), 500);
  }
}

// ============================================================
// Run a single test case
// ============================================================
async function runCase(tc: NonNullable<Awaited<ReturnType<typeof db.testCase.findUnique>>>, connectionId?: string) {
  const input = safeParse<{ method?: string; endpoint?: string; body?: unknown }>(tc.inputPayload) ?? {};
  const assertions = (safeParse<Assertion[]>(tc.assertions) ?? []);
  const failures: Failure[] = [];
  let assertionsPassed = 0;
  const start = Date.now();

  // Execute GHL call (simulated unless connectionId provided & not demo)
  let statusCode = 200;
  let respBody: unknown = {};
  let simulated = true;

  if (connectionId) {
    const conn = await db.ghlConnection.findUnique({ where: { id: connectionId } });
    if (conn) {
      const res = await executeGhlRequest({
        method: (input.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE") || "GET",
        endpoint: input.endpoint || "/contacts",
        accessToken: conn.accessToken,
        apiVersion: conn.apiVersion,
        body: input.body ? JSON.stringify(input.body) : undefined,
        simulate: conn.status === "demo",
      });
      statusCode = res.statusCode;
      try {
        respBody = JSON.parse(res.body);
      } catch {
        respBody = { raw: res.body };
      }
      simulated = res.simulated;
    }
  }

  // Evaluate assertions
  for (const a of assertions) {
    const { value, exists } = resolveField({ statusCode, body: respBody }, a.field);
    let pass = false;
    switch (a.operator) {
      case "exists":
        pass = exists;
        break;
      case "not_null":
        pass = value !== null && value !== undefined;
        break;
      case "equals":
        pass = String(value) === String(a.expected);
        break;
      case "contains":
        pass = typeof value === "string" && value.includes(String(a.expected));
        break;
      case "greater_than":
        pass = typeof value === "number" && value > Number(a.expected);
        break;
      case "less_than":
        pass = typeof value === "number" && value < Number(a.expected);
        break;
    }
    if (pass) {
      assertionsPassed++;
    } else {
      failures.push({
        assertionId: a.id,
        field: a.field,
        expected: String(a.expected ?? "<exists>"),
        actual: String(value ?? "<missing>"),
        message: `Assertion failed: ${a.field} ${a.operator} ${a.expected ?? ""}`,
      });
    }
  }

  const durationMs = Date.now() - start;
  const status = assertionsPassed === assertions.length ? "passed" : failures.length === assertions.length ? "failed" : "failed";

  const run = await db.testRun.create({
    data: {
      caseId: tc.id,
      suiteId: tc.suiteId,
      connectionId: connectionId || null,
      name: tc.name,
      status,
      assertionsRun: assertions.length,
      assertionsPassed,
      failures: JSON.stringify(failures),
      durationMs,
      output: JSON.stringify({ statusCode, body: respBody }, null, 2),
      simulated,
    },
  });

  return {
    runId: run.id,
    caseId: tc.id,
    name: tc.name,
    status,
    assertionsRun: assertions.length,
    assertionsPassed,
    failures,
    durationMs,
    simulated,
  };
}

// Resolve a dotted field path against an object, e.g. "body.contacts"
function resolveField(root: { statusCode: number; body: unknown }, field: string): { value: unknown; exists: boolean } {
  const parts = field.split(".");
  let cur: unknown = root;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return { value: undefined, exists: false };
    }
  }
  return { value: cur, exists: true };
}
