import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

// DELETE /api/testing/suites/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.testSuite.findUnique({ where: { id } });
  if (!existing) return fail("Suite not found", null, 404);
  // Unlink cases then delete suite
  await db.testCase.updateMany({ where: { suiteId: id }, data: { suiteId: null } });
  await db.testSuite.delete({ where: { id } });
  return ok({ deleted: true });
}
