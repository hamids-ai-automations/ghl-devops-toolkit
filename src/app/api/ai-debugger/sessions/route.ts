import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, safeParse } from "@/lib/api";

// GET /api/ai-debugger/sessions - list AI sessions
export async function GET() {
  const sessions = await db.aiSession.findMany({ orderBy: { updatedAt: "desc" }, take: 50 });
  const data = sessions.map((s) => ({
    ...s,
    messages: safeParse(s.messages) ?? [],
  }));
  return ok(data);
}

// POST /api/ai-debugger/sessions - create a new session
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title = "New Debug Session", model = "gemini-default", context } = body || {};
  const session = await db.aiSession.create({
    data: {
      title,
      model,
      context: context ? JSON.stringify(context) : null,
      messages: JSON.stringify([]),
    },
  });
  return ok({ ...session, messages: [] }, 201);
}
