import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, audit, safeParse } from "@/lib/api";

const SYSTEM_PROMPT = `You are the AI Debugger inside the GHL DevOps Toolkit - an expert assistant for GoHighLevel developers and AI automation engineers.

Your capabilities:
- Explain GoHighLevel API errors (HTTP status codes, common pitfalls)
- Analyze webhook payloads and identify missing fields or mismatched event types
- Diagnose automation/workflow test failures and suggest fixes
- Generate corrected API request examples (curl, fetch, axios)
- Recommend OAuth scopes, rate-limit handling, retry strategies
- Explain snapshot validation issues

Rules:
- Be concise and technical. Use bullet points and short code blocks.
- Reference official GHL endpoints as services.leadconnectorhq.com when relevant.
- Never invent undocumented GHL endpoints. If something is experimental, label it.
- Never ask for or display private API keys/tokens. If the user pastes one, tell them to redact it.
- Suggest concrete corrective actions, not generic advice.
- When you propose code, ensure it uses Bearer <ACCESS_TOKEN> placeholder and Version header (e.g. 2021-07-07).

If you don't know something about GHL specifically, say so and give a best-practice generic answer.`;

// POST /api/ai-debugger/chat
// Body: { sessionId?: string, message: string, context?: Record<string, unknown>, model?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, message, context, model = "gemini-default" } = body || {};
    if (!message || typeof message !== "string") {
      return fail("Missing 'message' field");
    }

    // Load or create session
    let session = sessionId ? await db.aiSession.findUnique({ where: { id: sessionId } }) : null;
    if (!session) {
      session = await db.aiSession.create({
        data: {
          title: message.slice(0, 60),
          model,
          context: context ? JSON.stringify(context) : null,
          messages: JSON.stringify([]),
        },
      });
    }

    const history = safeParse<Array<{ role: "user" | "assistant"; content: string; timestamp: string }>>(session.messages) ?? [];

    // Build message list for the model
    const contextStr = context ? `\n\n[Debug Context]\n${JSON.stringify(context, null, 2)}` : "";
    const userContent = message + contextStr;

    const messagesForModel: Array<{ role: "assistant" | "user"; content: string }> = [
      { role: "assistant", content: SYSTEM_PROMPT },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userContent },
    ];

    // Call the LLM via z-ai-web-dev-sdk
    let aiResponse: string;
    let tokenUsage = 0;
    try {
      // Dynamically import so the SDK stays server-only
      const ZAIModule = (await import("z-ai-web-dev-sdk")).default;
      // The default export may be a class or a factory object
      const ZAI = (ZAIModule as unknown as { create?: () => Promise<unknown> }).create
        ? (await (ZAIModule as unknown as { create: () => Promise<ChatClient> }).create())
        : (ZAIModule as unknown as ChatClient);

      const completion = await ZAI.chat.completions.create({
        messages: messagesForModel,
        thinking: { type: "disabled" },
      } as Parameters<typeof ZAI.chat.completions.create>[0]);

      aiResponse = completion.choices[0]?.message?.content ?? "I couldn't generate a response. Please try rephrasing.";
      tokenUsage = typeof completion.usage?.total_tokens === "number" ? completion.usage.total_tokens : Math.ceil((userContent.length + aiResponse.length) / 4);
    } catch (err) {
      // Graceful fallback so the UI still works in sandboxed environments
      aiResponse = generateFallbackResponse(message, context);
      tokenUsage = Math.ceil(aiResponse.length / 4);
      console.error("[ai-debugger] LLM call failed, using fallback:", err instanceof Error ? err.message : String(err));
    }

    // Append both messages to history
    const now = new Date().toISOString();
    const updatedMessages = [
      ...history,
      { role: "user" as const, content: message, timestamp: now },
      { role: "assistant" as const, content: aiResponse, timestamp: new Date().toISOString() },
    ];

    await db.aiSession.update({
      where: { id: session.id },
      data: {
        messages: JSON.stringify(updatedMessages),
        tokenUsage: { increment: tokenUsage },
        title: history.length === 0 ? message.slice(0, 60) : session.title,
      },
    });

    await audit({
      action: "ai.chat",
      resourceType: "ai_session",
      resourceId: session.id,
      details: { model, tokenUsage, messageLength: message.length },
    });

    return ok({
      sessionId: session.id,
      message: aiResponse,
      role: "assistant",
      timestamp: now,
      tokenUsage,
      model,
    });
  } catch (e) {
    return fail("AI debugger failed", e instanceof Error ? e.message : String(e), 500);
  }
}

// Minimal expected shape of the z-ai-web-dev-sdk chat client
interface ChatClient {
  chat: {
    completions: {
      create: (args: {
        messages: Array<{ role: "assistant" | "user"; content: string }>;
        thinking?: { type: "disabled" | "enabled" };
      }) => Promise<{
        choices: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      }>;
    };
  };
}

// Fallback heuristic response when SDK is unavailable
function generateFallbackResponse(message: string, context?: Record<string, unknown>): string {
  const m = message.toLowerCase();
  const lines: string[] = [];

  if (m.includes("401") || m.includes("unauthorized")) {
    lines.push("**Likely cause:** Invalid or expired access token.");
    lines.push("");
    lines.push("Fixes:");
    lines.push("- For OAuth integrations: refresh the access token using the stored refresh token, then retry.");
    lines.push("- For Private Integration Tokens: regenerate the token in GHL Marketplace > Developer > Private Integrations.");
    lines.push("- Confirm the token has the scopes required for the endpoint (e.g. `contacts.write` for POST /contacts).");
  } else if (m.includes("403") || m.includes("forbidden")) {
    lines.push("**Likely cause:** The token is valid but lacks the required OAuth scope or location access.");
    lines.push("");
    lines.push("Fixes:");
    lines.push("- Verify the locationId in the request matches the location the token was issued for.");
    lines.push("- Re-authorize with the additional scopes via OAuth flow.");
  } else if (m.includes("404")) {
    lines.push("**Likely cause:** The endpoint path or resource ID is incorrect.");
    lines.push("");
    lines.push("Fixes:");
    lines.push("- Confirm the endpoint against the GHL API docs (https://marketplace.gohighlevel.com/docs/).");
    lines.push("- Check that the resource ID (contactId, calendarId, etc.) exists in the target location.");
    lines.push("- Verify the API Version header (`Version: 2021-07-07`).");
  } else if (m.includes("429") || m.includes("rate limit")) {
    lines.push("**Likely cause:** Rate limit exceeded. GHL enforces per-location and per-endpoint limits.");
    lines.push("");
    lines.push("Fixes:");
    lines.push("- Implement exponential backoff (e.g. 1s, 2s, 4s, 8s).");
    lines.push("- Cache list responses where possible.");
    lines.push("- Batch writes (POST /contacts/batch where supported).");
    lines.push("- Respect the `X-RateLimit-Reset` header if present.");
  } else if (m.includes("webhook")) {
    lines.push("**Webhook debugging checklist:**");
    lines.push("1. Confirm the capture URL is publicly reachable over HTTPS.");
    lines.push("2. In GHL Marketplace > OAuth > Webhooks, verify the event type is subscribed.");
    lines.push("3. Verify OAuth scopes include the write scope for the entity (e.g. `contacts.write` for LeadCreated).");
    lines.push("4. Use the Webhook Inspector to replay the event and inspect the payload.");
    lines.push("5. Verify signature with the HMAC secret configured in GHL.");
  } else if (context && typeof context === "object") {
    lines.push("Based on the provided context, here are likely issues to investigate:");
    lines.push("- Verify the request payload matches the GHL schema for this endpoint.");
    lines.push("- Check for missing required fields (locationId is required on most endpoints).");
    lines.push("- Ensure the Authorization header is `Bearer <ACCESS_TOKEN>` and Version header is set.");
    lines.push("");
    lines.push("Context summary: " + JSON.stringify(context).slice(0, 200));
  } else {
    lines.push("I can help debug that. Please share:");
    lines.push("- The exact HTTP status code and error message");
    lines.push("- The endpoint and HTTP method you called");
    lines.push("- The request payload (redact any tokens)");
    lines.push("");
    lines.push("Common GHL API issues to check first:");
    lines.push("- Missing or expired access token (401)");
    lines.push("- Insufficient OAuth scope (403)");
    lines.push("- Wrong locationId in the path or body (404)");
    lines.push("- Rate limit exceeded (429) - implement backoff");
  }

  return lines.join("\n");
}
