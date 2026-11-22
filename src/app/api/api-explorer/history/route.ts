import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, safeParse } from "@/lib/api";

// GET /api/api-explorer/history - list request history (optionally filtered by connectionId)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const connectionId = url.searchParams.get("connectionId");
  const where = connectionId ? { connectionId } : {};
  const requests = await db.apiRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const data = requests.map((r) => ({
    ...r,
    headers: safeParse(r.headers) ?? {},
    queryParams: safeParse(r.queryParams) ?? null,
    responseHeaders: safeParse(r.responseHeaders) ?? null,
  }));
  return ok(data);
}
