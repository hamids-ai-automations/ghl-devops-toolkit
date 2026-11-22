import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { executeGhlRequest, verifyWebhookSignature, GHL_DEMO_ENDPOINTS } from "../src/lib/ghl-client.ts";

test("GHL API Client - Demo Mode Request Execution", async (t) => {
  await t.test("executes /contacts GET request with simulated response", async () => {
    const res = await executeGhlRequest({
      method: "GET",
      endpoint: "/contacts",
      accessToken: "demo-token",
      apiVersion: "2021-07-07",
      simulate: true,
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.simulated, true);
    assert.ok(res.durationMs >= 0);
    const body = JSON.parse(res.body);
    assert.ok(Array.isArray(body.contacts));
    assert.ok(body.contacts.length >= 1);
    assert.equal(body.contacts[0].firstName, "Jane");
  });

  await t.test("executes /contacts POST request with 201 Created", async () => {
    const res = await executeGhlRequest({
      method: "POST",
      endpoint: "/contacts",
      body: JSON.stringify({ firstName: "Test", email: "test@example.com" }),
      accessToken: "demo-token",
      apiVersion: "2021-07-07",
      simulate: true,
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.ok(body.contact);
    assert.ok(body.contact.id.startsWith("contact_demo_"));
  });

  await t.test("executes /opportunities GET request", async () => {
    const res = await executeGhlRequest({
      method: "GET",
      endpoint: "/opportunities",
      accessToken: "demo-token",
      simulate: true,
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(Array.isArray(body.opportunities));
    assert.equal(body.opportunities[0].pipelineId, "pipe_demo_001");
  });

  await t.test("executes /calendars/events GET request", async () => {
    const res = await executeGhlRequest({
      method: "GET",
      endpoint: "/calendars/events",
      accessToken: "demo-token",
      simulate: true,
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(Array.isArray(body.events));
    assert.equal(body.events[0].title, "Discovery Call");
  });

  await t.test("executes /locations and /users GET requests", async () => {
    const locRes = await executeGhlRequest({
      method: "GET",
      endpoint: "/locations",
      accessToken: "demo-token",
      simulate: true,
    });
    assert.equal(locRes.statusCode, 200);
    const locBody = JSON.parse(locRes.body);
    assert.equal(locBody.location.city, "Austin");

    const userRes = await executeGhlRequest({
      method: "GET",
      endpoint: "/users",
      accessToken: "demo-token",
      simulate: true,
    });
    assert.equal(userRes.statusCode, 200);
    const userBody = JSON.parse(userRes.body);
    assert.ok(Array.isArray(userBody.users));
  });

  await t.test("provides valid GHL demo endpoints list", () => {
    assert.ok(GHL_DEMO_ENDPOINTS.length >= 6);
    const endpoints = GHL_DEMO_ENDPOINTS.map((e) => e.path);
    assert.ok(endpoints.includes("/contacts"));
    assert.ok(endpoints.includes("/opportunities"));
    assert.ok(endpoints.includes("/calendars/events"));
  });
});

test("GHL Webhook Signature Verification", async (t) => {
  const secret = "whsec_test_secret_key_12345";
  const payload = JSON.stringify({
    type: "ContactCreate",
    locationId: "loc_123",
    contact: { id: "c_1", email: "test@lead.com" },
  });

  await t.test("verifies valid HMAC-SHA256 signature correctly", () => {
    const validHash = createHmac("sha256", secret).update(payload).digest("hex");
    const signatureHeader = `sha256=${validHash}`;

    const isValid = verifyWebhookSignature(payload, signatureHeader, secret);
    assert.equal(isValid, true);
  });

  await t.test("rejects tampered payload with invalid signature", () => {
    const validHash = createHmac("sha256", secret).update(payload).digest("hex");
    const signatureHeader = `sha256=${validHash}`;

    const tamperedPayload = payload + "tampered";
    const isValid = verifyWebhookSignature(tamperedPayload, signatureHeader, secret);
    assert.equal(isValid, false);
  });

  await t.test("rejects missing signature header", () => {
    assert.equal(verifyWebhookSignature(payload, undefined, secret), false);
    assert.equal(verifyWebhookSignature(payload, "", secret), false);
  });

  await t.test("rejects incorrect secret", () => {
    const validHash = createHmac("sha256", secret).update(payload).digest("hex");
    const signatureHeader = `sha256=${validHash}`;

    const isValid = verifyWebhookSignature(payload, signatureHeader, "wrong_secret");
    assert.equal(isValid, false);
  });
});

test("Automation Testing Assertion Engine Logic", async (t) => {
  function evaluateAssertion(assertion, data) {
    const fields = assertion.field.split(".");
    let val = data;
    for (const f of fields) {
      if (val && typeof val === "object" && f in val) {
        val = val[f];
      } else {
        val = undefined;
        break;
      }
    }
    const exists = val !== undefined;

    switch (assertion.operator) {
      case "exists":
        return exists;
      case "not_null":
        return val !== null && val !== undefined;
      case "equals":
        return String(val) === String(assertion.expected);
      case "contains":
        return typeof val === "string" && val.includes(String(assertion.expected));
      case "greater_than":
        return typeof val === "number" && val > Number(assertion.expected);
      case "less_than":
        return typeof val === "number" && val < Number(assertion.expected);
      default:
        return false;
    }
  }

  const sampleData = {
    statusCode: 200,
    body: {
      contact: {
        id: "c_123",
        email: "sarah.connor@cyberdyne.com",
        tags: "vip,automation",
        score: 95,
      },
      count: 1,
    },
  };

  await t.test("evaluates 'equals' assertion", () => {
    assert.equal(
      evaluateAssertion({ field: "statusCode", operator: "equals", expected: 200 }, sampleData),
      true
    );
    assert.equal(
      evaluateAssertion({ field: "statusCode", operator: "equals", expected: 404 }, sampleData),
      false
    );
  });

  await t.test("evaluates 'exists' and 'not_null' assertions", () => {
    assert.equal(
      evaluateAssertion({ field: "body.contact.id", operator: "exists" }, sampleData),
      true
    );
    assert.equal(
      evaluateAssertion({ field: "body.nonexistent", operator: "exists" }, sampleData),
      false
    );
    assert.equal(
      evaluateAssertion({ field: "body.contact.email", operator: "not_null" }, sampleData),
      true
    );
  });

  await t.test("evaluates 'contains' assertion", () => {
    assert.equal(
      evaluateAssertion({ field: "body.contact.email", operator: "contains", expected: "cyberdyne.com" }, sampleData),
      true
    );
    assert.equal(
      evaluateAssertion({ field: "body.contact.tags", operator: "contains", expected: "vip" }, sampleData),
      true
    );
    assert.equal(
      evaluateAssertion({ field: "body.contact.email", operator: "contains", expected: "gmail.com" }, sampleData),
      false
    );
  });

  await t.test("evaluates 'greater_than' and 'less_than' assertions", () => {
    assert.equal(
      evaluateAssertion({ field: "body.contact.score", operator: "greater_than", expected: 80 }, sampleData),
      true
    );
    assert.equal(
      evaluateAssertion({ field: "body.contact.score", operator: "less_than", expected: 100 }, sampleData),
      true
    );
    assert.equal(
      evaluateAssertion({ field: "body.contact.score", operator: "greater_than", expected: 100 }, sampleData),
      false
    );
  });
});

test("Snapshot Validator Logic", async (t) => {
  function validateSnapshot(snapshot) {
    const issues = [];
    const pipelines = Array.isArray(snapshot.pipelines) ? snapshot.pipelines : [];
    const calendars = Array.isArray(snapshot.calendars) ? snapshot.calendars : [];
    const workflows = Array.isArray(snapshot.workflows) ? snapshot.workflows : [];

    const pipelineIds = new Set(pipelines.map((p) => p.id));
    const calendarIds = new Set(calendars.map((c) => c.id));

    // Check duplicate workflow names
    const seenNames = new Set();
    for (const wf of workflows) {
      if (seenNames.has(wf.name)) {
        issues.push({ level: "warning", category: "duplicate", message: `Duplicate workflow name '${wf.name}'` });
      } else {
        seenNames.add(wf.name);
      }
      if (wf.pipelineId && !pipelineIds.has(wf.pipelineId)) {
        issues.push({ level: "error", category: "references", message: `Broken pipeline reference '${wf.pipelineId}'` });
      }
      if (wf.calendarId && !calendarIds.has(wf.calendarId)) {
        issues.push({ level: "warning", category: "references", message: `Broken calendar reference '${wf.calendarId}'` });
      }
    }

    if (pipelines.length === 0) {
      issues.push({ level: "info", category: "missing", message: "No pipelines found." });
    }

    const hasErrors = issues.some((i) => i.level === "error");
    const status = hasErrors ? "invalid" : issues.some((i) => i.level === "warning") ? "warnings" : "valid";
    return { status, importReady: !hasErrors, issues };
  }

  await t.test("marks clean snapshot as valid and importReady", () => {
    const cleanSnapshot = {
      version: "1.0.0",
      pipelines: [{ id: "pipe_1", name: "Sales Pipeline" }],
      calendars: [{ id: "cal_1", name: "Consultation Call" }],
      workflows: [
        { id: "wf_1", name: "Lead Nurture", pipelineId: "pipe_1", calendarId: "cal_1" },
        { id: "wf_2", name: "Follow Up", pipelineId: "pipe_1" },
      ],
    };

    const res = validateSnapshot(cleanSnapshot);
    assert.equal(res.status, "valid");
    assert.equal(res.importReady, true);
    assert.equal(res.issues.length, 0);
  });

  await t.test("detects duplicate workflows and broken pipeline references", () => {
    const brokenSnapshot = {
      version: "1.0.0",
      pipelines: [{ id: "pipe_1", name: "Sales Pipeline" }],
      workflows: [
        { id: "wf_1", name: "Lead Nurture", pipelineId: "pipe_missing" },
        { id: "wf_2", name: "Lead Nurture", pipelineId: "pipe_1" },
      ],
    };

    const res = validateSnapshot(brokenSnapshot);
    assert.equal(res.status, "invalid");
    assert.equal(res.importReady, false);
    assert.ok(res.issues.some((i) => i.category === "duplicate"));
    assert.ok(res.issues.some((i) => i.category === "references" && i.level === "error"));
  });
});
