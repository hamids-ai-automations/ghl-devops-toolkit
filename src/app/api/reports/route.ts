import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, safeParse, audit } from "@/lib/api";

// GET /api/reports - list reports
export async function GET() {
  const reports = await db.report.findMany({ orderBy: { createdAt: "desc" } });
  const data = reports.map((r) => ({
    ...r,
    metadata: safeParse(r.metadata) ?? null,
  }));
  return ok(data);
}
