import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit, safeParse } from "@/lib/api";
import { executeGhlRequest } from "@/lib/ghl-client";

// POST /api/workflows/run/[id] - simulate executing a workflow scenario
// Steps through expectedSteps and marks each as success/failed/skipped based on
// simulated GHL actions. Clearly labeled as simulated - never writes to a real GHL account.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const connectionId: string | undefined = body?.connectionId;

  const sim = await db.workflowSim.findUnique({ where: { id } });
  if (!sim) return fail("Workflow simulation not found", null, 404);

  const expectedSteps = (safeParse<{ id: string; name: string; type: string; description?: string }[]>(sim.expectedSteps) ?? []);
  const contactPayload = safeParse<Record<string, unknown>>(sim.contactPayload) ?? {};

  // Simulate each step. Failures are deterministic-ish based on step name hints.
  const executed: Array<{ id: string; name: string; type: string; description?: string; status: string; result: string }> = [];
  let hadFailure = false;
  const start = Date.now();

  for (const step of expectedSteps) {
    // Heuristic: if a previous step failed and this is not a trigger/wait, mark skipped
    if (hadFailure && step.type !== "trigger") {
      executed.push({ ...step, status: "skipped", result: "Skipped due to upstream failure" });
      continue;
    }

    // Simulated failures based on the simulation's notes / scenario (deterministic for demos)
    const shouldFail =
      (sim.notes?.toLowerCase().includes("timeout") && step.name.toLowerCase().includes("sms")) ||
      (sim.scenario === "appointment_cancelled" && step.name.toLowerCase().includes("sms"));

    if (shouldFail) {
      executed.push({ ...step, status: "failed", result: "Simulated provider error (504 Gateway Timeout)" });
      hadFailure = true;
      continue;
    }

    // For action steps, optionally make a real (simulated) GHL API call if a connection is provided
    let resultMsg = "Simulated execution";
    if (connectionId && step.type === "action") {
      const conn = await db.ghlConnection.findUnique({ where: { id: connectionId } });
      if (conn) {
        const r = await executeGhlRequest({
          method: "GET",
          endpoint: "/contacts",
          accessToken: conn.accessToken,
          apiVersion: conn.apiVersion,
          simulate: conn.status === "demo",
        });
        resultMsg = `GHL call ${r.statusCode} in ${r.durationMs}ms (simulated=${r.simulated})`;
      }
    } else if (step.type === "trigger") {
      resultMsg = "Trigger received (simulated webhook)";
    } else if (step.type === "wait") {
      resultMsg = "Simulated wait";
    } else if (step.type === "notification") {
      resultMsg = "Notification dispatched (simulated)";
    }

    executed.push({ ...step, status: "success", result: resultMsg });
  }

  const durationMs = Date.now() - start;
  const status = hadFailure
    ? (executed.some((s) => s.status === "success") ? "partial" : "failed")
    : "passed";

  const updated = await db.workflowSim.update({
    where: { id },
    data: {
      executedSteps: JSON.stringify(executed),
      status,
    },
  });

  // Record a run
  const run = await db.workflowRun.create({
    data: {
      simulationId: id,
      connectionId: connectionId || null,
      scenario: sim.scenario,
      contactPayload: sim.contactPayload,
      executedSteps: JSON.stringify(executed),
      result: status,
      durationMs,
      simulated: true,
    },
  });

  await audit({
    action: "workflow.run",
    resourceType: "workflow",
    resourceId: id,
    details: { result: status, stepsRun: executed.length, simulated: true, runId: run.id },
  });

  return ok({
    simulationId: id,
    runId: run.id,
    result: status,
    durationMs,
    simulated: true,
    executedSteps: executed,
    contactPayload,
    status: updated.status,
  });
}
