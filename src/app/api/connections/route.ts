import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit, redactSecrets } from "@/lib/api";

// GET /api/connections - list all GHL connections
export async function GET() {
  const conns = await db.ghlConnection.findMany({ orderBy: { createdAt: "desc" } });
  const data = conns.map((c) => ({
    ...c,
    accessToken: redactSecrets({ accessToken: c.accessToken }).accessToken as string,
  }));
  return ok(data);
}

// POST /api/connections - create a new connection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, locationId, authType, accessToken, apiVersion, scopes } = body || {};
    if (!name || !locationId || !authType || !accessToken) {
      return fail("Missing required fields: name, locationId, authType, accessToken");
    }
    if (authType !== "oauth" && authType !== "private_token") {
      return fail("authType must be 'oauth' or 'private_token'");
    }
    const conn = await db.ghlConnection.create({
      data: {
        name,
        locationId,
        authType,
        accessToken,
        apiVersion: apiVersion || "2021-07-07",
        scopes: scopes || null,
        status: "active",
        lastVerifiedAt: new Date(),
      },
    });
    await audit({ action: "connection.create", resourceType: "connection", resourceId: conn.id, details: { name } });
    return ok({
      ...conn,
      accessToken: redactSecrets({ accessToken: conn.accessToken }).accessToken as string,
    }, 201);
  } catch (e) {
    return fail("Failed to create connection", e instanceof Error ? e.message : String(e), 500);
  }
}
