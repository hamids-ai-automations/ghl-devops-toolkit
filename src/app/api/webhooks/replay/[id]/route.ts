import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit } from "@/lib/api";

// POST /api/webhooks/replay/[id] - replay a stored webhook event
// Records a new capture entry marked as a replay (does NOT call external systems)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.webhookEvent.findUnique({ where: { id } });
  if (!event) return fail("Webhook event not found", null, 404);

  const replayed = await db.webhookEvent.create({
    data: {
      endpoint: event.endpoint,
      eventType: event.eventType,
      headers: event.headers,
      body: event.body,
      parsedBody: event.parsedBody,
      signature: event.signature,
      signatureValid: event.signatureValid,
      sourceIp: "127.0.0.1",
      connectionId: event.connectionId,
    },
  });

  await db.webhookEvent.update({
    where: { id },
    data: { replayCount: { increment: 1 } },
  });

  await audit({
    action: "webhook.replay",
    resourceType: "webhook",
    resourceId: id,
    details: { replayId: replayed.id },
  });

  return ok({ replayed: true, newEventId: replayed.id });
}
