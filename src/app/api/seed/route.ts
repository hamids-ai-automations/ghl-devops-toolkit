import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api";
import { seedDemoData } from "@/lib/demo-data";

// POST /api/seed - seed demo data into an empty database
export async function POST(_req: NextRequest) {
  try {
    await seedDemoData();
    return ok({ seeded: true, message: "Demo data has been loaded. Explore the modules to see sample connections, webhooks, workflows, and test runs." });
  } catch (e) {
    return fail("Failed to seed demo data", e instanceof Error ? e.message : String(e), 500);
  }
}
