import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit } from "@/lib/api";
import { executeGhlRequest } from "@/lib/ghl-client";

// POST /api/api-explorer - execute a GHL API request
// (GET history lives at /api/api-explorer/history)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { connectionId, method, endpoint, headers, body: reqBody, queryParams, saveName } = body || {};
    if (!connectionId || !method || !endpoint) {
      return fail("Missing required fields: connectionId, method, endpoint");
    }
    const conn = await db.ghlConnection.findUnique({ where: { id: connectionId } });
    if (!conn) return fail("Connection not found", null, 404);

    const res = await executeGhlRequest({
      method,
      endpoint,
      accessToken: conn.accessToken,
      apiVersion: conn.apiVersion,
      headers: headers || {},
      body: reqBody,
      queryParams: queryParams || {},
      simulate: conn.status === "demo",
    });

    const isOk = res.statusCode >= 200 && res.statusCode < 300;
    const rec = await db.apiRequest.create({
      data: {
        connectionId,
        method,
        endpoint,
        headers: JSON.stringify(headers || {}),
        body: reqBody || null,
        queryParams: JSON.stringify(queryParams || {}),
        statusCode: res.statusCode,
        responseHeaders: JSON.stringify(res.headers),
        responseBody: res.body,
        durationMs: res.durationMs,
        status: isOk ? "success" : "error",
        errorMessage: isOk ? null : `HTTP ${res.statusCode}`,
        isSaved: Boolean(saveName),
        savedName: saveName || null,
      },
    });

    await audit({
      action: "api.execute",
      resourceType: "api_request",
      resourceId: rec.id,
      connectionId,
      details: { method, endpoint, statusCode: res.statusCode, simulated: res.simulated },
    });

    return ok({
      id: rec.id,
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body,
      durationMs: res.durationMs,
      simulated: res.simulated,
      status: rec.status,
    });
  } catch (e) {
    return fail("Failed to execute request", e instanceof Error ? e.message : String(e), 500);
  }
}
