import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

// GET /api/settings - all settings as key/value
export async function GET() {
  const settings = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return ok(map);
}

// PUT /api/settings - upsert a setting
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { key, value } = body || {};
  if (!key || value === undefined) return fail("Missing 'key' or 'value'");
  const existing = await db.setting.findUnique({ where: { key } });
  if (existing) {
    const updated = await db.setting.update({ where: { key }, data: { value: String(value) } });
    return ok(updated);
  }
  const created = await db.setting.create({ data: { id: `set_${key}`, key, value: String(value) } });
  return ok(created, 201);
}
