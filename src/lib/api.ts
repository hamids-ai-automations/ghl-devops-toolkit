import { NextResponse } from "next/server";
import { db } from "./db";

// ============================================================
// Standard JSON response helpers
// ============================================================
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true as const, data }, { status });
}

export function fail(error: string, details?: unknown, status = 400) {
  return NextResponse.json({ success: false as const, error, details }, { status });
}

// ============================================================
// Audit logging
// ============================================================
export async function audit(args: {
  action: string;
  actor?: string;
  resourceType?: string;
  resourceId?: string;
  connectionId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        action: args.action,
        actor: args.actor ?? "system",
        resourceType: args.resourceType ?? null,
        resourceId: args.resourceId ?? null,
        connectionId: args.connectionId ?? null,
        details: args.details ? JSON.stringify(args.details) : null,
        ipAddress: args.ipAddress ?? null,
      },
    });
  } catch {
    // ignore audit failures
  }
}

// ============================================================
// Safe JSON parse
// ============================================================
export function safeParse<T = unknown>(s: string | null | undefined): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

// ============================================================
// Secret redaction
// ============================================================
export function redactSecrets(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitive = /token|secret|password|key|authorization/i;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (sensitive.test(k)) {
      out[k] = typeof v === "string" && v.length > 8 ? `${v.slice(0, 4)}••••${v.slice(-2)}` : "••••";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = redactSecrets(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}
