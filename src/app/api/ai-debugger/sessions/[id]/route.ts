import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, safeParse } from "@/lib/api";

// DELETE /api/ai-debugger/sessions/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.aiSession.findUnique({ where: { id } });
  if (!existing) return fail("Session not found", null, 404);
  await db.aiSession.delete({ where: { id } });
  return ok({ deleted: true });
}
