// GHL API Client - Mock/Simulated implementation for demo mode
// In production, this would make real HTTPS calls to services.leadconnectorhq.com

import { createHmac } from "node:crypto";
import type { HttpMethod } from "./types";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

export interface GhlRequestOptions {
  method: HttpMethod;
  endpoint: string; // e.g. /contacts
  headers?: Record<string, string>;
  body?: string;
  queryParams?: Record<string, string>;
  accessToken: string;
  apiVersion?: string;
  // When true (demo mode), returns simulated responses without making network calls
  simulate?: boolean;
}

export interface GhlResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
  simulated: boolean;
}

// ============================================================
// Demo response generator - returns realistic GHL-shaped payloads
// ============================================================
function generateDemoResponse(opts: GhlRequestOptions): GhlResponse {
  const start = Date.now();
  const { method, endpoint } = opts;
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Build a realistic GHL-style payload
  let statusCode = 200;
  let payload: unknown;

  if (path.includes("/contacts")) {
    if (method === "GET") {
      payload = {
        contacts: [
          {
            id: "contact_demo_001",
            locationId: "demo_location_001",
            firstName: "Jane",
            lastName: "Cooper",
            email: "jane.cooper@example.com",
            phone: "+15555550123",
            tags: ["interested", "demo"],
            customFields: [{ id: "cf_source", value: "Website Form" }],
            dateAdded: new Date(Date.now() - 86400000).toISOString(),
            dateUpdated: new Date().toISOString(),
          },
          {
            id: "contact_demo_002",
            locationId: "demo_location_001",
            firstName: "Cody",
            lastName: "Fisher",
            email: "cody.fisher@example.com",
            phone: "+15555550456",
            tags: ["follow-up"],
            dateAdded: new Date(Date.now() - 2 * 86400000).toISOString(),
            dateUpdated: new Date().toISOString(),
          },
        ],
        count: 2,
        total: 2,
      };
    } else if (method === "POST") {
      statusCode = 201;
      payload = {
        contact: {
          id: `contact_demo_${Math.random().toString(36).slice(2, 10)}`,
          locationId: "demo_location_001",
          firstName: "Demo",
          lastName: "Contact",
          dateAdded: new Date().toISOString(),
        },
      };
    }
  } else if (path.includes("/opportunities")) {
    payload = {
      opportunities: [
        {
          id: "opp_demo_001",
          name: "Enterprise Demo",
          pipelineId: "pipe_demo_001",
          pipelineStageId: "stage_demo_002",
          status: "open",
          monetaryValue: 45000,
          contactId: "contact_demo_001",
        },
      ],
    };
  } else if (path.includes("/calendars/events")) {
    payload = {
      events: [
        {
          id: "evt_demo_001",
          calendarId: "cal_demo_001",
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
          title: "Discovery Call",
          appointmentStatus: "confirmed",
        },
      ],
    };
  } else if (path.includes("/locations")) {
    payload = {
      location: {
        id: "demo_location_001",
        name: "Demo Agency Location",
        business: "Acme Marketing LLC",
        address: "123 Main St",
        city: "Austin",
        state: "TX",
        country: "US",
      },
    };
  } else if (path.includes("/users")) {
    payload = {
      users: [
        {
          id: "user_demo_001",
          name: "Demo Admin",
          email: "admin@demo.agency",
          type: "account",
          role: "admin",
        },
      ],
    };
  } else {
    payload = {
      message: "Demo response",
      method,
      endpoint: path,
      timestamp: new Date().toISOString(),
      note: "This is a simulated GHL response. Configure a real connection to make live requests.",
    };
  }

  const durationMs = Math.floor(Date.now() - start) + Math.floor(Math.random() * 200) + 80;

  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "x-ghl-demo": "true",
      "x-request-id": `req_demo_${Math.random().toString(36).slice(2, 12)}`,
    },
    body: JSON.stringify(payload, null, 2),
    durationMs,
    simulated: true,
  };
}

// ============================================================
// Public API
// ============================================================
export async function executeGhlRequest(opts: GhlRequestOptions): Promise<GhlResponse> {
  // Demo mode: always simulate in this sandboxed environment
  if (opts.simulate !== false) {
    // Small async delay to mimic network latency
    await new Promise((r) => setTimeout(r, 50));
    return generateDemoResponse(opts);
  }

  // Real request path (used when a connection is configured for live calls)
  try {
    const url = new URL(`${GHL_BASE_URL}${opts.endpoint.startsWith("/") ? opts.endpoint : `/${opts.endpoint}`}`);
    if (opts.queryParams) {
      for (const [k, v] of Object.entries(opts.queryParams)) {
        url.searchParams.set(k, v);
      }
    }
    const start = Date.now();
    const version = opts.apiVersion || "2021-07-07";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${opts.accessToken}`,
      Version: version,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(opts.headers || {}),
    };
    const res = await fetch(url.toString(), {
      method: opts.method,
      headers,
      body: opts.method === "GET" ? undefined : opts.body,
    });
    const durationMs = Date.now() - start;
    const respHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      respHeaders[k] = v;
    });
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: respHeaders,
      body,
      durationMs,
      simulated: false,
    };
  } catch (err) {
    return {
      statusCode: 0,
      headers: {},
      body: JSON.stringify({ error: err instanceof Error ? err.message : "Network error" }),
      durationMs: 0,
      simulated: false,
    };
  }
}

// ============================================================
// GHL Webhook signature verification (HMAC SHA-256)
// GHL webhooks send a header like: X-GHL-Signature: sha256=<hex>
// ============================================================
export function verifyWebhookSignature(
  body: string,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  try {
    const hmac = createHmac("sha256", secret).update(body).digest("hex");
    const expected = `sha256=${hmac}`;
    // Constant-time comparison
    if (expected.length !== signatureHeader.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export const GHL_DEMO_ENDPOINTS = [
  { method: "GET" as const, path: "/contacts", desc: "List contacts in a location" },
  { method: "POST" as const, path: "/contacts", desc: "Create a new contact" },
  { method: "GET" as const, path: "/opportunities", desc: "List pipeline opportunities" },
  { method: "GET" as const, path: "/calendars/events", desc: "List calendar events" },
  { method: "GET" as const, path: "/locations", desc: "Get location details" },
  { method: "GET" as const, path: "/users", desc: "List sub-account users" },
];
