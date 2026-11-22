import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit, safeParse } from "@/lib/api";

// GET /api/webhooks - list captured webhook events
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const eventType = url.searchParams.get("eventType");
  const endpoint = url.searchParams.get("endpoint");
  const where: Record<string, unknown> = {};
  if (eventType) where.eventType = { contains: eventType };
  if (endpoint) where.endpoint = { contains: endpoint };

  const events = await db.webhookEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const data = events.map((e) => ({
    ...e,
    headers: safeParse(e.headers) ?? {},
  }));
  return ok(data);
}

// POST /api/webhooks - create a synthetic test event (used by "Send test" button)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType = "TestEvent", payload = {}, endpoint = "capture/test", connectionId } = body || {};
    const bodyStr = JSON.stringify(payload);
    const event = await db.webhookEvent.create({
      data: {
        endpoint,
        eventType,
        headers: JSON.stringify({ "content-type": "application/json", "x-test": "true" }),
        body: bodyStr,
        parsedBody: JSON.stringify(payload, null, 2),
        sourceIp: "127.0.0.1",
        connectionId: connectionId || null,
      },
    });
    await audit({ action: "webhook.inject", resourceType: "webhook", resourceId: event.id, details: { eventType } });
    return ok({ ...event, headers: safeParse(event.headers) ?? {} }, 201);
  } catch (e) {
    return fail("Failed to create test webhook", e instanceof Error ? e.message : String(e), 500);
  }
}
