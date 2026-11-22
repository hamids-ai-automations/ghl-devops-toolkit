import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

// DELETE /api/api-explorer/history/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.apiRequest.findUnique({ where: { id } });
  if (!existing) return fail("Request not found", null, 404);
  await db.apiRequest.delete({ where: { id } });
  return ok({ deleted: true });
}
