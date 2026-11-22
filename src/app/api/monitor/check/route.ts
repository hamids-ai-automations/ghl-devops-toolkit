import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit } from "@/lib/api";
import { executeGhlRequest } from "@/lib/ghl-client";

// POST /api/monitor/check - run a manual health check for a connection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { connectionId, endpoint = "/contacts", method = "GET" } = body || {};
    if (!connectionId) return fail("Missing connectionId");

    const conn = await db.ghlConnection.findUnique({ where: { id: connectionId } });
    if (!conn) return fail("Connection not found", null, 404);

    const res = await executeGhlRequest({
      method,
      endpoint,
      accessToken: conn.accessToken,
      apiVersion: conn.apiVersion,
      simulate: conn.status === "demo",
    });

    const okStatus = res.statusCode >= 200 && res.statusCode < 300;
    const check = await db.healthCheck.create({
      data: {
        connectionId,
        endpoint,
        method,
        statusCode: res.statusCode,
        responseTimeMs: res.durationMs,
        ok: okStatus,
        errorMessage: okStatus ? null : `HTTP ${res.statusCode}`,
      },
    });

    await audit({
      action: "monitor.check",
      resourceType: "health_check",
      resourceId: check.id,
      connectionId,
      details: { endpoint, statusCode: res.statusCode, ok: okStatus },
    });

    return ok(check, 201);
  } catch (e) {
    return fail("Health check failed", e instanceof Error ? e.message : String(e), 500);
  }
}
