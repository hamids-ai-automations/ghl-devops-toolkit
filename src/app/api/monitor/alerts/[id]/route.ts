import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

// PATCH /api/monitor/alerts/[id] - toggle / update alert
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const existing = await db.alertConfig.findUnique({ where: { id } });
  if (!existing) return fail("Alert not found", null, 404);
  const updated = await db.alertConfig.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      threshold: body.threshold ?? existing.threshold,
      enabled: body.enabled ?? existing.enabled,
    },
  });
  return ok(updated);
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.alertConfig.findUnique({ where: { id } });
  if (!existing) return fail("Alert not found", null, 404);
  await db.alertConfig.delete({ where: { id } });
  return ok({ deleted: true });
}
