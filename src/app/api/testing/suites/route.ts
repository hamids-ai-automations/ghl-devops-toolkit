import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, safeParse } from "@/lib/api";

// GET /api/testing/suites
export async function GET() {
  const suites = await db.testSuite.findMany({ orderBy: { createdAt: "desc" } });
  // attach case counts
  const withCounts = await Promise.all(
    suites.map(async (s) => ({
      ...s,
      caseCount: await db.testCase.count({ where: { suiteId: s.id } }),
    }))
  );
  return ok(withCounts);
}

// POST /api/testing/suites
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description } = body || {};
  if (!name) return fail("Missing required field: name");
  const suite = await db.testSuite.create({ data: { name, description: description || null } });
  return ok({ ...suite, caseCount: 0 }, 201);
}
