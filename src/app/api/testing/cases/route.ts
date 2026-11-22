import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, safeParse, audit } from "@/lib/api";

// GET /api/testing/cases - list test cases (optionally by suiteId)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const suiteId = url.searchParams.get("suiteId");
  const where = suiteId ? { suiteId } : {};
  const cases = await db.testCase.findMany({ where, orderBy: { createdAt: "desc" } });
  const data = cases.map((c) => ({
    ...c,
    inputPayload: safeParse(c.inputPayload) ?? {},
    expectedOutput: safeParse(c.expectedOutput) ?? null,
    assertions: safeParse(c.assertions) ?? [],
  }));
  return ok(data);
}

// POST /api/testing/cases - create a test case
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, suiteId, inputPayload, expectedOutput, assertions, tags } = body || {};
    if (!name) return fail("Missing required field: name");
    if (!Array.isArray(assertions) || assertions.length === 0) return fail("At least one assertion is required");
    const tc = await db.testCase.create({
      data: {
        name,
        description: description || null,
        suiteId: suiteId || null,
        inputPayload: JSON.stringify(inputPayload || {}),
        expectedOutput: expectedOutput ? JSON.stringify(expectedOutput) : null,
        assertions: JSON.stringify(assertions),
        tags: tags || null,
      },
    });
    await audit({ action: "testcase.create", resourceType: "test_case", resourceId: tc.id, details: { name } });
    return ok({
      ...tc,
      inputPayload: safeParse(tc.inputPayload),
      expectedOutput: safeParse(tc.expectedOutput),
      assertions: safeParse(tc.assertions),
    }, 201);
  } catch (e) {
    return fail("Failed to create test case", e instanceof Error ? e.message : String(e), 500);
  }
}
