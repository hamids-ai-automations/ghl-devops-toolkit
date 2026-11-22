import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit } from "@/lib/api";

// DELETE /api/connections/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.ghlConnection.findUnique({ where: { id } });
  if (!existing) return fail("Connection not found", null, 404);
  await db.ghlConnection.delete({ where: { id } });
  await audit({ action: "connection.delete", resourceType: "connection", resourceId: id });
  return ok({ deleted: true });
}

// PATCH /api/connections/[id] - update
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const existing = await db.ghlConnection.findUnique({ where: { id } });
  if (!existing) return fail("Connection not found", null, 404);
  const updated = await db.ghlConnection.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      locationId: body.locationId ?? existing.locationId,
      authType: body.authType ?? existing.authType,
      accessToken: body.accessToken ?? existing.accessToken,
      apiVersion: body.apiVersion ?? existing.apiVersion,
      scopes: body.scopes ?? existing.scopes,
      status: body.status ?? existing.status,
    },
  });
  await audit({ action: "connection.update", resourceType: "connection", resourceId: id });
  return ok({ id: updated.id, name: updated.name, status: updated.status });
}
