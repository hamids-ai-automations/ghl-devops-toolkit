import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, safeParse } from "@/lib/api";

// DELETE /api/workflows/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.workflowSim.findUnique({ where: { id } });
  if (!existing) return fail("Workflow not found", null, 404);
  await db.workflowSim.delete({ where: { id } });
  return ok({ deleted: true });
}
