import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

// POST /api/monitor/alerts - create alert
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, threshold, enabled = true } = body || {};
  if (!name || !type || threshold === undefined) return fail("Missing fields: name, type, threshold");
  if (!["error_rate", "latency", "webhook_failure"].includes(type)) return fail("Invalid alert type");
  const alert = await db.alertConfig.create({
    data: { name, type, threshold: Number(threshold), enabled },
  });
  return ok(alert, 201);
}
