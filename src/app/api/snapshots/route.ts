import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, safeParse } from "@/lib/api";

// GET /api/snapshots - list snapshot reports
export async function GET() {
  const reports = await db.snapshotReport.findMany({ orderBy: { createdAt: "desc" } });
  const data = reports.map((r) => ({
    ...r,
    summary: safeParse(r.summary) ?? {},
    issues: safeParse(r.issues) ?? [],
  }));
  return ok(data);
}
