import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, safeParse } from "@/lib/api";

// GET /api/audit - list audit logs
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const where = action ? { action: { contains: action } } : {};
  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const data = logs.map((l) => ({
    ...l,
    details: safeParse(l.details) ?? null,
  }));
  return ok(data);
}
