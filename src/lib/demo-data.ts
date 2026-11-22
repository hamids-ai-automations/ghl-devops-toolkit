// Demo data seed for GHL DevOps Toolkit - provides a working demo without a real GHL account

import { db } from "./db";

export async function seedDemoData(): Promise<void> {
  // Only seed if no connections exist
  const count = await db.ghlConnection.count();
  if (count > 0) return;

  // 1. Demo connection
  const conn = await db.ghlConnection.create({
    data: {
      id: "conn_demo_primary",
      name: "Demo Agency - Primary Location",
      locationId: "demo_location_001",
      authType: "private_token",
      accessToken: "demo-token-pit-xxxxxxxxxxxxxxxx",
      apiVersion: "2021-07-07",
      scopes: "contacts.read,contacts.write,opportunities.read",
      status: "demo",
      lastVerifiedAt: new Date(),
    },
  });

  // 2. Sample API request history
  await db.apiRequest.createMany({
    data: [
      {
        connectionId: conn.id,
        method: "GET",
        endpoint: "/contacts",
        headers: JSON.stringify({ Authorization: "Bearer ***", Version: "2021-07-07" }),
        queryParams: JSON.stringify({ limit: "10" }),
        statusCode: 200,
        responseHeaders: JSON.stringify({ "content-type": "application/json" }),
        responseBody: JSON.stringify({ contacts: [], count: 0 }, null, 2),
        durationMs: 142,
        status: "success",
        isSaved: true,
        savedName: "List Contacts",
      },
      {
        connectionId: conn.id,
        method: "POST",
        endpoint: "/contacts",
        headers: JSON.stringify({ Authorization: "Bearer ***", Version: "2021-07-07" }),
        body: JSON.stringify({ firstName: "Jane", lastName: "Cooper", email: "jane@example.com" }),
        statusCode: 201,
        responseHeaders: JSON.stringify({ "content-type": "application/json" }),
        responseBody: JSON.stringify({ contact: { id: "contact_demo_001" } }, null, 2),
        durationMs: 218,
        status: "success",
      },
      {
        connectionId: conn.id,
        method: "GET",
        endpoint: "/opportunities",
        headers: JSON.stringify({ Authorization: "Bearer ***", Version: "2021-07-07" }),
        statusCode: 200,
        responseHeaders: JSON.stringify({ "content-type": "application/json" }),
        responseBody: JSON.stringify({ opportunities: [] }, null, 2),
        durationMs: 96,
        status: "success",
      },
    ],
  });

  // 3. Sample webhook events
  await db.webhookEvent.createMany({
    data: [
      {
        endpoint: "capture/demo-incoming",
        eventType: "LeadCreated",
        headers: JSON.stringify({
          "content-type": "application/json",
          "x-ghl-signature": "sha256=demo",
          "user-agent": "GoHighLevel-Webhook/1.0",
        }),
        body: JSON.stringify({
          type: "LeadCreated",
          locationId: "demo_location_001",
          contactId: "contact_demo_001",
          firstName: "Jane",
          lastName: "Cooper",
          email: "jane.cooper@example.com",
          phone: "+15555550123",
          source: "Website Form",
        }),
        parsedBody: JSON.stringify(
          {
            type: "LeadCreated",
            locationId: "demo_location_001",
            contactId: "contact_demo_001",
            firstName: "Jane",
            lastName: "Cooper",
            email: "jane.cooper@example.com",
            phone: "+15555550123",
            source: "Website Form",
          },
          null,
          2
        ),
        signature: "sha256=demo",
        signatureValid: false,
        sourceIp: "52.84.0.10",
        connectionId: conn.id,
      },
      {
        endpoint: "capture/demo-incoming",
        eventType: "ContactUpdated",
        headers: JSON.stringify({ "content-type": "application/json" }),
        body: JSON.stringify({
          type: "ContactUpdated",
          locationId: "demo_location_001",
          contactId: "contact_demo_001",
          changes: { tags: ["follow-up"] },
        }),
        parsedBody: JSON.stringify(
          {
            type: "ContactUpdated",
            locationId: "demo_location_001",
            contactId: "contact_demo_001",
            changes: { tags: ["follow-up"] },
          },
          null,
          2
        ),
        sourceIp: "52.84.0.11",
        connectionId: conn.id,
      },
      {
        endpoint: "capture/demo-incoming",
        eventType: "AppointmentCreated",
        headers: JSON.stringify({ "content-type": "application/json" }),
        body: JSON.stringify({
          type: "AppointmentCreated",
          locationId: "demo_location_001",
          contactId: "contact_demo_001",
          calendarId: "cal_demo_001",
          startTime: new Date(Date.now() + 86400000).toISOString(),
        }),
        parsedBody: JSON.stringify(
          {
            type: "AppointmentCreated",
            locationId: "demo_location_001",
            contactId: "contact_demo_001",
            calendarId: "cal_demo_001",
            startTime: new Date(Date.now() + 86400000).toISOString(),
          },
          null,
          2
        ),
        sourceIp: "52.84.0.12",
        connectionId: conn.id,
      },
    ],
  });

  // 4. Sample workflow simulations
  await db.workflowSim.createMany({
    data: [
      {
        name: "New Lead Auto-Responder",
        scenario: "new_lead",
        contactPayload: JSON.stringify({
          firstName: "Jane",
          lastName: "Cooper",
          email: "jane.cooper@example.com",
          source: "Website Form",
        }),
        expectedSteps: JSON.stringify([
          { id: "s1", name: "Trigger: Lead Created", type: "trigger", description: "Webhook received from GHL", status: "success" },
          { id: "s2", name: "Add Tag 'new-lead'", type: "action", description: "Tag contact with 'new-lead'", status: "success" },
          { id: "s3", name: "Send Welcome SMS", type: "action", description: "Send welcome SMS via GHL", status: "success" },
          { id: "s4", name: "Create Opportunity", type: "action", description: "Create pipeline opportunity", status: "success" },
          { id: "s5", name: "Wait 1 day", type: "wait", description: "Delay next step 24h", status: "success" },
          { id: "s6", name: "Send Follow-up Email", type: "action", description: "Send templated email", status: "success" },
        ]),
        executedSteps: JSON.stringify([
          { id: "s1", name: "Trigger: Lead Created", type: "trigger", description: "Webhook received from GHL", status: "success", result: "Webhook delivered in 142ms" },
          { id: "s2", name: "Add Tag 'new-lead'", type: "action", description: "Tag contact with 'new-lead'", status: "success", result: "Tag applied" },
          { id: "s3", name: "Send Welcome SMS", type: "action", description: "Send welcome SMS via GHL", status: "success", result: "SMS queued" },
          { id: "s4", name: "Create Opportunity", type: "action", description: "Create pipeline opportunity", status: "success", result: "opp_demo_001 created" },
          { id: "s5", name: "Wait 1 day", type: "wait", description: "Delay next step 24h", status: "success", result: "Simulated wait" },
          { id: "s6", name: "Send Follow-up Email", type: "action", description: "Send templated email", status: "success", result: "Email sent" },
        ]),
        status: "passed",
        notes: "End-to-end lead onboarding flow executed successfully in simulation.",
      },
      {
        name: "Appointment Cancellation Follow-up",
        scenario: "appointment_cancelled",
        contactPayload: JSON.stringify({
          firstName: "Cody",
          lastName: "Fisher",
          appointmentId: "evt_demo_002",
          reason: "schedule_conflict",
        }),
        expectedSteps: JSON.stringify([
          { id: "s1", name: "Trigger: Appointment Cancelled", type: "trigger", description: "Webhook received", status: "success" },
          { id: "s2", name: "Notify Account Owner", type: "notification", description: "Internal Slack/email alert", status: "success" },
          { id: "s3", name: "Send Reschedule SMS", type: "action", description: "Send reschedule link via SMS", status: "failed", result: "SMS provider timeout" },
          { id: "s4", name: "Add Tag 'reschedule-needed'", type: "action", description: "Tag for follow-up", status: "skipped" },
        ]),
        executedSteps: JSON.stringify([
          { id: "s1", name: "Trigger: Appointment Cancelled", type: "trigger", description: "Webhook received", status: "success", result: "Webhook delivered" },
          { id: "s2", name: "Notify Account Owner", type: "notification", description: "Internal Slack/email alert", status: "success", result: "Owner notified" },
          { id: "s3", name: "Send Reschedule SMS", type: "action", description: "Send reschedule link via SMS", status: "failed", result: "SMS provider timeout (504)" },
          { id: "s4", name: "Add Tag 'reschedule-needed'", type: "action", description: "Tag for follow-up", status: "skipped", result: "Skipped due to upstream failure" },
        ]),
        status: "partial",
        notes: "SMS provider returned 504. Recommend retry policy and fallback email.",
      },
    ],
  });

  // 5. Test suite & cases
  const suite = await db.testSuite.create({
    data: {
      id: "suite_smoke",
      name: "Smoke Tests - Contact API",
      description: "Basic CRUD validation against the contacts endpoint.",
    },
  });

  await db.testCase.createMany({
    data: [
      {
        suiteId: suite.id,
        name: "List contacts returns 200",
        description: "GET /contacts should return 200 with contacts array.",
        inputPayload: JSON.stringify({ method: "GET", endpoint: "/contacts" }),
        expectedOutput: JSON.stringify({ statusCode: 200, hasContacts: true }),
        assertions: JSON.stringify([
          { id: "a1", field: "statusCode", operator: "equals", expected: "200" },
          { id: "a2", field: "body.contacts", operator: "exists" },
        ]),
        tags: "smoke,contacts",
      },
      {
        suiteId: suite.id,
        name: "Create contact returns 201",
        description: "POST /contacts should return 201 with contact id.",
        inputPayload: JSON.stringify({ method: "POST", endpoint: "/contacts", body: { firstName: "Test" } }),
        expectedOutput: JSON.stringify({ statusCode: 201, hasContactId: true }),
        assertions: JSON.stringify([
          { id: "a1", field: "statusCode", operator: "equals", expected: "201" },
          { id: "a2", field: "body.contact.id", operator: "exists" },
        ]),
        tags: "smoke,contacts,create",
      },
    ],
  });

  // Sample test run (passed)
  await db.testRun.create({
    data: {
      caseId: null,
      suiteId: suite.id,
      connectionId: conn.id,
      name: "Smoke Tests - Contact API (suite run)",
      status: "passed",
      assertionsRun: 4,
      assertionsPassed: 4,
      failures: JSON.stringify([]),
      durationMs: 320,
      output: "All 4 assertions passed.",
      simulated: true,
    },
  });

  // 6. Snapshot report
  await db.snapshotReport.create({
    data: {
      fileName: "agency-snapshot-2024-Q4.json",
      fileSize: 48213,
      snapshotJson: JSON.stringify(
        {
          version: "1.0",
          workflows: [
            { id: "wf_1", name: "New Lead Auto-Responder", triggers: 1, actions: 5 },
            { id: "wf_2", name: "Appointment Reminder", triggers: 1, actions: 3 },
          ],
          pipelines: [{ id: "pipe_1", name: "Sales Pipeline", stages: 5 }],
          calendars: [{ id: "cal_1", name: "Discovery Calls" }],
          forms: [{ id: "form_1", name: "Contact Us" }],
          customFields: [{ id: "cf_1", name: "Lead Source" }],
          tags: [{ id: "tag_1", name: "new-lead" }],
        },
        null,
        2
      ),
      summary: JSON.stringify({
        totalEntities: 8,
        workflows: 2,
        pipelines: 1,
        calendars: 1,
        forms: 1,
        customFields: 1,
        tags: 1,
      }),
      issues: JSON.stringify([
        { level: "warning", category: "references", message: "Workflow wf_2 references calendar cal_2 which does not exist in this snapshot.", path: "workflows[1].calendarId" },
        { level: "info", category: "compatibility", message: "Snapshot format v1.0 is supported by current GHL import tooling." },
      ]),
      status: "warnings",
      importReady: true,
    },
  });

  // 7. Health checks
  const now = Date.now();
  await db.healthCheck.createMany({
    data: Array.from({ length: 12 }).map((_, i) => ({
      connectionId: conn.id,
      endpoint: "/contacts",
      method: "GET",
      statusCode: i === 5 ? 503 : 200,
      responseTimeMs: 80 + Math.floor(Math.random() * 220),
      ok: i !== 5,
      errorMessage: i === 5 ? "Service Unavailable" : null,
      checkedAt: new Date(now - i * 5 * 60 * 1000),
    })),
  });

  // 8. Alert config
  await db.alertConfig.create({
    data: {
      name: "API Error Rate > 5%",
      type: "error_rate",
      threshold: 5,
      enabled: true,
    },
  });
  await db.alertConfig.create({
    data: {
      name: "Avg Latency > 500ms",
      type: "latency",
      threshold: 500,
      enabled: true,
    },
  });

  // 9. AI session with sample
  await db.aiSession.create({
    data: {
      title: "Webhook 404 - Lead Created not arriving",
      model: "gemini-default",
      messages: JSON.stringify([
        {
          role: "user",
          content: "My LeadCreated webhook is not arriving in GHL even though I configured it. Help me debug.",
          timestamp: new Date(now - 3600000).toISOString(),
        },
        {
          role: "assistant",
          content:
            "Let's debug the LeadCreated webhook step-by-step:\n\n1. **Verify the webhook URL** is reachable from the public internet. GHL requires an HTTPS endpoint. Use the Webhook Inspector to confirm you can receive events at all.\n2. **Check the event subscription** in GHL Marketplace > OAuth > Webhooks. Ensure `LeadCreated` is subscribed for your location.\n3. **Confirm OAuth scopes** include `contacts.write` (read is not enough for webhook delivery).\n4. **Inspect the locationId** - the webhook will only fire for events in the location you subscribed to.\n5. **Look at webhook delivery logs** in GHL if available, or replay a test event from the Webhook Inspector.\n\nLikely cause: missing `contacts.write` scope or webhook URL not whitelisted.",
          timestamp: new Date(now - 3500000).toISOString(),
        },
      ]),
      tokenUsage: 412,
    },
  });

  // 10. Sample report
  await db.report.create({
    data: {
      title: "Weekly Integration Health Summary",
      type: "integration_health",
      format: "html",
      summary: "12 health checks performed, 11 successful (91.6%). One 503 error recorded.",
      content:
        "<h2>Weekly Integration Health Summary</h2><p><strong>Period:</strong> Last 7 days</p><p><strong>Health checks:</strong> 12</p><p><strong>Success rate:</strong> 91.6%</p><p><strong>Errors:</strong> 1 (HTTP 503 on /contacts)</p><p><strong>Recommendation:</strong> Investigate the 503 at 2024-01-05 14:00 UTC. Add retry policy for transient 5xx responses.</p>",
      metadata: JSON.stringify({ checks: 12, successRate: 91.6, errors: 1 }),
    },
  });

  // 11. Sample audit logs
  await db.auditLog.createMany({
    data: [
      { action: "connection.create", actor: "system", resourceType: "connection", resourceId: conn.id, details: JSON.stringify({ name: conn.name }) },
      { action: "webhook.received", actor: "ghl", resourceType: "webhook", details: JSON.stringify({ eventType: "LeadCreated" }) },
      { action: "test.run", actor: "system", resourceType: "suite", resourceId: "suite_smoke", details: JSON.stringify({ status: "passed" }) },
    ],
  });

  // 12. Default settings
  await db.setting.createMany({
    data: [
      { id: "set_demo_mode", key: "demo_mode", value: "true" },
      { id: "set_ai_model", key: "ai_model", value: "gemini-default" },
      { id: "set_ai_provider", key: "ai_provider", value: "gemini" },
      { id: "set_webhook_secret", key: "webhook_secret", value: "demo-webhook-secret" },
      { id: "set_redact_secrets", key: "redact_secrets", value: "true" },
    ],
  });
}
