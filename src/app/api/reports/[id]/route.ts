import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

// DELETE /api/reports/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.report.findUnique({ where: { id } });
  if (!existing) return fail("Report not found", null, 404);
  await db.report.delete({ where: { id } });
  return ok({ deleted: true });
}
