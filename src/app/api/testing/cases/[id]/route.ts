import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

// DELETE /api/testing/cases/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.testCase.findUnique({ where: { id } });
  if (!existing) return fail("Test case not found", null, 404);
  await db.testCase.delete({ where: { id } });
  return ok({ deleted: true });
}
