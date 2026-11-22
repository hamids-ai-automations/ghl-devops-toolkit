import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

// DELETE /api/snapshots/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.snapshotReport.findUnique({ where: { id } });
  if (!existing) return fail("Snapshot report not found", null, 404);
  await db.snapshotReport.delete({ where: { id } });
  return ok({ deleted: true });
}
