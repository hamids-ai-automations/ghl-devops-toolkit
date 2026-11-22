import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit, safeParse } from "@/lib/api";

// GET /api/workflows - list simulations
export async function GET() {
  const sims = await db.workflowSim.findMany({ orderBy: { createdAt: "desc" } });
  const data = sims.map((s) => ({
    ...s,
    contactPayload: safeParse(s.contactPayload) ?? {},
    expectedSteps: safeParse(s.expectedSteps) ?? [],
    executedSteps: safeParse(s.executedSteps) ?? [],
  }));
  return ok(data);
}

// POST /api/workflows - create a new workflow simulation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, scenario, contactPayload, expectedSteps, notes } = body || {};
    if (!name || !scenario) return fail("Missing required fields: name, scenario");
    const sim = await db.workflowSim.create({
      data: {
        name,
        scenario,
        contactPayload: JSON.stringify(contactPayload || {}),
        expectedSteps: JSON.stringify(expectedSteps || []),
        executedSteps: null,
        status: "draft",
        notes: notes || null,
      },
    });
    await audit({ action: "workflow.create", resourceType: "workflow", resourceId: sim.id, details: { name, scenario } });
    return ok({ ...sim, contactPayload: safeParse(sim.contactPayload), expectedSteps: safeParse(sim.expectedSteps), executedSteps: null }, 201);
  } catch (e) {
    return fail("Failed to create workflow", e instanceof Error ? e.message : String(e), 500);
  }
}
