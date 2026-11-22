import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit } from "@/lib/api";
import { executeGhlRequest } from "@/lib/ghl-client";

// POST /api/connections/[id]/verify - test a connection by calling /contacts
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conn = await db.ghlConnection.findUnique({ where: { id } });
  if (!conn) return fail("Connection not found", null, 404);

  const res = await executeGhlRequest({
    method: "GET",
    endpoint: "/contacts",
    accessToken: conn.accessToken,
    apiVersion: conn.apiVersion,
    simulate: conn.status === "demo",
  });

  const okStatus = res.statusCode >= 200 && res.statusCode < 300;
  const updated = await db.ghlConnection.update({
    where: { id },
    data: {
      status: okStatus ? "active" : "error",
      lastVerifiedAt: new Date(),
    },
  });

  await audit({
    action: "connection.verify",
    resourceType: "connection",
    resourceId: id,
    details: { statusCode: res.statusCode, simulated: res.simulated, ok: okStatus },
  });

  return ok({
    connectionId: id,
    status: updated.status,
    statusCode: res.statusCode,
    responseTimeMs: res.durationMs,
    simulated: res.simulated,
  });
}
