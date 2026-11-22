"use client";

import * as React from "react";
import {
  Activity,
  BookOpen,
  Boxes,
  Bug,
  Brain,
  ChevronRight,
  Code2,
  Database,
  ExternalLink,
  FlaskConical,
  Github,
  GitMerge,
  Globe,
  KeyRound,
  Layers,
  MessageCircle,
  PackageOpen,
  Plug,
  Rocket,
  Server,
  Shield,
  Terminal,
  TriangleAlert,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ModuleHeader } from "@/components/module-common";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  group: "Start" | "Modules" | "Ops";
  render: () => React.ReactNode;
}

const SECTIONS: DocSection[] = [
  {
    id: "overview",
    label: "Project Overview",
    icon: <BookOpen className="h-4 w-4" />,
    group: "Start",
    render: () => <OverviewSection />,
  },
  {
    id: "architecture",
    label: "Architecture",
    icon: <Layers className="h-4 w-4" />,
    group: "Start",
    render: () => <ArchitectureSection />,
  },
  {
    id: "installation",
    label: "Installation",
    icon: <PackageOpen className="h-4 w-4" />,
    group: "Start",
    render: () => <InstallationSection />,
  },
  {
    id: "configuration",
    label: "Configuration",
    icon: <Zap className="h-4 w-4" />,
    group: "Start",
    render: () => <ConfigurationSection />,
  },
  {
    id: "auth",
    label: "Authentication",
    icon: <KeyRound className="h-4 w-4" />,
    group: "Start",
    render: () => <AuthSection />,
  },
  {
    id: "api-explorer",
    label: "API Explorer",
    icon: <Terminal className="h-4 w-4" />,
    group: "Modules",
    render: () => <ApiExplorerSection />,
  },
  {
    id: "webhooks",
    label: "Webhook Inspector",
    icon: <Webhook className="h-4 w-4" />,
    group: "Modules",
    render: () => <WebhooksSection />,
  },
  {
    id: "workflows",
    label: "Workflow Simulator",
    icon: <Workflow className="h-4 w-4" />,
    group: "Modules",
    render: () => <WorkflowsSection />,
  },
  {
    id: "testing",
    label: "Testing Engine",
    icon: <FlaskConical className="h-4 w-4" />,
    group: "Modules",
    render: () => <TestingSection />,
  },
  {
    id: "snapshots",
    label: "Snapshot Validator",
    icon: <Boxes className="h-4 w-4" />,
    group: "Modules",
    render: () => <SnapshotsSection />,
  },
  {
    id: "ai-debugger",
    label: "AI Debugger",
    icon: <Brain className="h-4 w-4" />,
    group: "Modules",
    render: () => <AiDebuggerSection />,
  },
  {
    id: "monitor",
    label: "Integration Monitor",
    icon: <Activity className="h-4 w-4" />,
    group: "Modules",
    render: () => <MonitorSection />,
  },
  {
    id: "security",
    label: "Security",
    icon: <Shield className="h-4 w-4" />,
    group: "Ops",
    render: () => <SecuritySection />,
  },
  {
    id: "deployment",
    label: "Deployment",
    icon: <Rocket className="h-4 w-4" />,
    group: "Ops",
    render: () => <DeploymentSection />,
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    icon: <TriangleAlert className="h-4 w-4" />,
    group: "Ops",
    render: () => <TroubleshootingSection />,
  },
  {
    id: "contributing",
    label: "Contributing",
    icon: <GitMerge className="h-4 w-4" />,
    group: "Ops",
    render: () => <ContributingSection />,
  },
  {
    id: "roadmap",
    label: "Roadmap",
    icon: <Globe className="h-4 w-4" />,
    group: "Ops",
    render: () => <RoadmapSection />,
  },
];

const GROUPS: Array<DocSection["group"]> = ["Start", "Modules", "Ops"];

export function DocsModule() {
  const [active, setActive] = React.useState<string>("overview");
  const activeSection = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Documentation"
        description="In-app guide for every module, architecture, deployment, and contribution path."
        icon={<BookOpen className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <nav
          aria-label="Documentation sections"
          className="lg:sticky lg:top-20 lg:self-start"
        >
          <Card>
            <CardContent className="p-2">
              <ul className="space-y-0.5">
                {GROUPS.map((group) => (
                  <li key={group}>
                    <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group}
                    </p>
                    <ul className="space-y-0.5">
                      {SECTIONS.filter((s) => s.group === group).map((s) => (
                        <li key={s.id}>
                          <button
                            onClick={() => {
                              setActive(s.id);
                              if (typeof window !== "undefined") {
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                              active === s.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-foreground/80 hover:bg-muted/60",
                            )}
                          >
                            <span className="shrink-0">{s.icon}</span>
                            <span className="flex-1 truncate">{s.label}</span>
                            {active === s.id && (
                              <ChevronRight className="h-3 w-3 shrink-0" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </nav>

        {/* Content */}
        <article className="min-w-0 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 border-b pb-3">
                {activeSection.icon}
                <h2 className="text-lg font-semibold">{activeSection.label}</h2>
              </div>
              <div className="pt-4 prose prose-sm dark:prose-invert max-w-none [&_h3]:mt-6 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-muted-foreground [&_p]:leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-sm [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono">
                {activeSection.render()}
              </div>
            </CardContent>
          </Card>

          <ExternalLinks />
        </article>
      </div>
    </div>
  );
}

// ============================================================
// Section components
// ============================================================

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="font-mono text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-xs bg-muted rounded px-1 py-0.5">{children}</code>;
}

function OverviewSection() {
  return (
    <>
      <p>
        The <strong>GHL DevOps Toolkit</strong> is an open-source developer
        platform for inspecting, testing, and debugging GoHighLevel
        automations. It brings API exploration, webhook capture, workflow
        simulation, regression testing, snapshot validation, AI-assisted
        debugging, and integration monitoring under one local-first dashboard.
      </p>

      <H3>Tagline</H3>
      <blockquote className="border-l-2 border-primary pl-3 italic text-foreground/90">
        Ship GHL automations with confidence. Inspect every webhook, replay
        every request, and prove your tests pass before touching production.
      </blockquote>

      <H3>Who it&apos;s for</H3>
      <ul>
        <li><strong>GHL Marketplace app developers</strong> building OAuth integrations.</li>
        <li><strong>Agency automation engineers</strong> shipping workflows for clients.</li>
        <li><strong>QA engineers</strong> running regression suites against GHL APIs.</li>
        <li><strong>AI automation engineers</strong> using LLMs to triage webhook failures and 4xx errors.</li>
      </ul>

      <H3>Status</H3>
      <p>
        The toolkit is at <InlineCode>v0.1.0-mvp</InlineCode>. Core modules
        are functional with demo data. Live GHL API calls work once you
        register a connection with a real access token.
      </p>
    </>
  );
}

function ArchitectureSection() {
  return (
    <>
      <p>
        The toolkit is a single Next.js 16 application with everything running
        in one process. There are no external services to deploy beyond SQLite.
      </p>

      <H3>Stack</H3>
      <ul>
        <li><strong>Frontend:</strong> Next.js 16 App Router, TypeScript, Tailwind CSS 4, shadcn/ui (New York style), lucide-react icons.</li>
        <li><strong>State:</strong> Zustand for client navigation, TanStack Query available for server state, local <InlineCode>useState</InlineCode>+<InlineCode>useEffect</InlineCode> for module-level fetches.</li>
        <li><strong>Backend:</strong> Next.js Route Handlers under <InlineCode>src/app/api</InlineCode>.</li>
        <li><strong>Database:</strong> Prisma ORM with a local SQLite file (<InlineCode>prisma/custom.db</InlineCode>).</li>
        <li><strong>AI:</strong> z-ai-web-dev-sdk (server-only) inside <InlineCode>/api/ai-debugger/chat</InlineCode> with a heuristic fallback.</li>
        <li><strong>Real-time:</strong> webhook capture endpoint <InlineCode>/api/webhooks/capture/&lt;slug&gt;</InlineCode> accepts raw POSTs from GHL.</li>
        <li><strong>Gateway:</strong> Caddy (<InlineCode>Caddyfile</InlineCode>) exposes one port externally and proxies internal services.</li>
      </ul>

      <H3>Diagram</H3>
      <Code>{`+-----------------------------------------------------------+
|  Browser (single page: src/app/page.tsx)                  |
|    +---------------+   +---------------+   +------------+  |
|    | Sidebar nav   |   | Module router |   | Top bar    |  |
|    +---------------+   +---------------+   +------------+  |
|              \\              |                  /          |
|               \\             v                 /           |
|        +-----------------------------------------+         |
|        |  Module components (src/components/     |         |
|        |    modules/*.tsx)                       |         |
|        +-----------------------------------------+         |
|                            |                              |
|                            v                              |
|        +-----------------------------------------+         |
|        |  fetch() -> /api/* (Route Handlers)     |         |
|        +-----------------------------------------+         |
|          |        |        |        |       |              |
|          v        v        v        v       v              |
|      Prisma    Demo      ghl-    AI SDK   Webhook          |
|      (SQLite)  data      client  (server) capture          |
|                                                          |
|  External: services.leadconnectorhq.com (GHL API)         |
+-----------------------------------------------------------+`}</Code>

      <H3>Module boundaries</H3>
      <p>
        Each module owns one file in <InlineCode>src/components/modules/</InlineCode>
        and pairs with one or more routes under <InlineCode>src/app/api/</InlineCode>.
        Modules never import each other except through the typed navigation store
        (<InlineCode>@/hooks/use-nav</InlineCode>).
      </p>
    </>
  );
}

function InstallationSection() {
  return (
    <>
      <p>
        The toolkit ships as a single Next.js 16 project. One command installs
        everything you need to run locally.
      </p>

      <H3>Prerequisites</H3>
      <ul>
        <li>Node.js 18+ (or Bun 1.1+ recommended)</li>
        <li>SQLite (bundled — no separate server)</li>
      </ul>

      <H3>One-command setup</H3>
      <Code>{`# Clone
git clone https://github.com/hamids-ai-automations/ghl-devops-toolkit.git
cd ghl-devops-toolkit

# Install dependencies
bun install

# Push the Prisma schema to SQLite (creates prisma/custom.db)
bun run db:push

# Start the dev server (port 3000)
bun run dev`}</Code>

      <H3>Environment variables</H3>
      <p>
        The only required env var is the database URL. It defaults to a local
        file inside <InlineCode>prisma/</InlineCode>.
      </p>
      <Code>{`# .env
DATABASE_URL="file:./custom.db"`}</Code>
      <p>
        Optional: AI provider keys for the AI Debugger can be set in the
        Settings module instead of env vars.
      </p>

      <H3>First run</H3>
      <p>
        On first load, the Overview module calls <InlineCode>POST /api/seed</InlineCode>{" "}
        which loads demo connections, webhooks, workflows, test runs, snapshots,
        and reports. You can also trigger this manually from{" "}
        <strong>Settings &rarr; Data Management</strong>.
      </p>
    </>
  );
}

function ConfigurationSection() {
  return (
    <>
      <p>
        All runtime configuration lives in the Settings module and is persisted
        as key/value pairs in the <InlineCode>Setting</InlineCode> table. No
        restart required.
      </p>

      <H3>General</H3>
      <ul>
        <li><strong>demo_mode</strong> — when <InlineCode>true</InlineCode>, outbound GHL requests return simulated responses.</li>
        <li><strong>redact_secrets</strong> — masks access tokens, API keys, and webhook secrets in every API response.</li>
      </ul>

      <H3>AI Configuration</H3>
      <ul>
        <li><strong>ai_model</strong> — gemini-default, openrouter-auto, or custom.</li>
        <li><strong>ai_provider</strong> — gemini or openrouter.</li>
        <li><strong>ai_usage_limit</strong> — token budget per session before fallback kicks in.</li>
        <li><strong>gemini_api_key</strong>, <InlineCode>openrouter_api_key</InlineCode> — provider credentials (stored as settings, not env).</li>
      </ul>

      <H3>Webhooks</H3>
      <ul>
        <li><strong>webhook_secret</strong> — HMAC secret used to verify GHL webhook signatures.</li>
        <li><strong>webhook_slug_prefix</strong> — default prefix for new capture URL slugs (e.g. <InlineCode>whk-</InlineCode>).</li>
      </ul>

      <H3>Security</H3>
      <ul>
        <li><strong>audit_logging</strong> — toggles whether mutations are recorded into the <InlineCode>AuditLog</InlineCode> table.</li>
      </ul>
    </>
  );
}

function AuthSection() {
  return (
    <>
      <p>
        GoHighLevel supports two integration types. The toolkit stores both
        under the <InlineCode>GhlConnection</InlineCode> model.
      </p>

      <H3>OAuth 2.0</H3>
      <ul>
        <li>Best for Marketplace apps that serve multiple locations.</li>
        <li>Store the <InlineCode>accessToken</InlineCode>, <InlineCode>refreshToken</InlineCode>, and <InlineCode>tokenExpiresAt</InlineCode>.</li>
        <li>Implement a refresh flow that swaps the refresh token for a new access token before expiry.</li>
        <li>Required scopes depend on the endpoint — e.g. <InlineCode>contacts.write</InlineCode> for POST /contacts.</li>
      </ul>

      <H3>Private Integration Tokens</H3>
      <ul>
        <li>Best for single-location agencies.</li>
        <li>Generated under Marketplace &rarr; Developer &rarr; Private Integrations.</li>
        <li>Long-lived, no refresh needed. Treat them like passwords.</li>
        <li>Cannot be used for webhook subscriptions (those require OAuth).</li>
      </ul>

      <H3>Storage</H3>
      <p>
        Tokens are stored as plain text in the local SQLite database. With{" "}
        <strong>redact_secrets</strong> enabled, the{" "}
        <InlineCode>/api/connections</InlineCode> response masks tokens as{" "}
        <InlineCode>abcd••••ef</InlineCode>. For production deployments, mount
        an encrypted volume or wrap the Prisma client with a field-level
        cipher.
      </p>

      <H3>Authorizing requests</H3>
      <Code>{`GET /contacts HTTP/1.1
Host: services.leadconnectorhq.com
Authorization: Bearer <ACCESS_TOKEN>
Version: 2021-07-07
Accept: application/json`}</Code>
    </>
  );
}

function ApiExplorerSection() {
  return (
    <>
      <p>
        The API Explorer lets you build, send, and inspect raw GHL API
        requests without leaving the toolkit. It is a Postman-like experience
        tuned for GHL endpoints.
      </p>

      <H3>Building a request</H3>
      <ul>
        <li>Pick a connection from the dropdown. The Authorization header is filled from the stored token.</li>
        <li>Choose an HTTP method. Color-coded buttons make destructive verbs (DELETE) easy to spot.</li>
        <li>Enter the endpoint path (e.g. <InlineCode>/contacts/&lt;contactId&gt;</InlineCode>).</li>
        <li>Add query parameters and headers using the key/value editors.</li>
        <li>For POST/PUT/PATCH, paste a JSON body. Syntax is validated before sending.</li>
      </ul>

      <H3>Reading responses</H3>
      <ul>
        <li>Status code, response headers, and response time appear above the body.</li>
        <li>The body is rendered with <InlineCode>JsonView</InlineCode> (pretty-printed) when the response is JSON.</li>
        <li>Errors include the full error message and the originating endpoint.</li>
      </ul>

      <H3>Saving requests</H3>
      <ul>
        <li>Every sent request is stored in <InlineCode>ApiRequest</InlineCode> automatically.</li>
        <li>Click <strong>Save As</strong> to give it a reusable name.</li>
        <li>The history list lets you reload any past request — body, headers, and params are restored.</li>
      </ul>
    </>
  );
}

function WebhooksSection() {
  return (
    <>
      <p>
        The Webhook Inspector captures every POST GHL sends to your unique
        capture URL so you can inspect payloads, verify signatures, and replay
        events.
      </p>

      <H3>Capture URL format</H3>
      <Code>{`https://your-toolkit-host/api/webhooks/capture/<slug>`}</Code>
      <p>
        The slug is editable. Use any string of letters, numbers, dashes, or
        underscores. Different slugs let you segregate events by environment
        (e.g. <InlineCode>whk-dev</InlineCode> vs{" "}
        <InlineCode>whk-prod</InlineCode>).
      </p>

      <H3>Pointing GHL here</H3>
      <ul>
        <li>Open Marketplace &rarr; OAuth &rarr; Webhooks.</li>
        <li>Add the capture URL as the subscription endpoint for each event type (LeadCreated, ContactUpdated, AppointmentCreated, etc.).</li>
        <li>Set the HMAC signing secret to match <InlineCode>webhook_secret</InlineCode> from Settings.</li>
      </ul>

      <H3>Send a test event</H3>
      <p>
        Use the <strong>Send Test Event</strong> button to inject a synthetic
        event without waiting for GHL. Pick an event type and paste a payload —
        the toolkit stores it exactly like a real webhook.
      </p>

      <H3>Replay</H3>
      <ul>
        <li>Each captured event has a Replay button that re-creates a new entry from the original payload.</li>
        <li>Use replay to test new webhook consumers or to re-trigger a downstream automation that misfired.</li>
      </ul>

      <H3>Signature validation</H3>
      <p>
        If the incoming request carries a signature header and{" "}
        <InlineCode>webhook_secret</InlineCode> is set, the toolkit recomputes
        the HMAC and marks the event{" "}
        <InlineCode>signatureValid: true/false</InlineCode>.
      </p>
    </>
  );
}

function WorkflowsSection() {
  return (
    <>
      <p>
        The Workflow Simulator lets you dry-run a contact through a sequence of
        GHL automation steps without touching live data.
      </p>

      <H3>Scenarios</H3>
      <ul>
        <li><strong>new_lead</strong> — a contact is created for the first time.</li>
        <li><strong>contact_updated</strong> — an existing contact's fields change.</li>
        <li><strong>pipeline_stage_changed</strong> — an opportunity moves between stages.</li>
        <li><strong>appointment_booked</strong> — a calendar event is created.</li>
        <li><strong>appointment_cancelled</strong> — a calendar event is cancelled.</li>
        <li><strong>form_submitted</strong> — a form submission arrives.</li>
        <li><strong>follow_up_triggered</strong> — a scheduled follow-up fires.</li>
      </ul>

      <H3>Steps</H3>
      <p>
        Each simulation has an ordered list of steps with one of these types:
      </p>
      <ul>
        <li><strong>trigger</strong> — the inbound event that started the workflow.</li>
        <li><strong>action</strong> — an outbound API call (create contact, send SMS, etc.).</li>
        <li><strong>wait</strong> — a delay before the next step.</li>
        <li><strong>condition</strong> — a branch (if/else).</li>
        <li><strong>notification</strong> — an email or internal alert.</li>
      </ul>

      <H3>Simulation vs real execution</H3>
      <p>
        By default the simulator runs in <strong>simulated</strong> mode: it
        executes steps locally, marks them success/failed/skipped, and never
        calls GHL. Optionally pick a connection to execute against the live
        API — every step then becomes a real API call.
      </p>
    </>
  );
}

function TestingSection() {
  return (
    <>
      <p>
        The Testing Engine is a regression suite runner for GHL integrations.
        Define test cases, group them into suites, and run them in bulk.
      </p>

      <H3>Test cases</H3>
      <ul>
        <li>Each case carries an <InlineCode>inputPayload</InlineCode> and zero or more assertions.</li>
        <li>Cases can stand alone or belong to a suite.</li>
        <li>Tags help you filter and organize cases.</li>
      </ul>

      <H3>Assertions</H3>
      <p>Assertions evaluate a JSON path on the response against an expected value:</p>
      <ul>
        <li><strong>equals</strong> — exact match (e.g. <InlineCode>data.locationId</InlineCode> equals <InlineCode>abc123</InlineCode>).</li>
        <li><strong>exists</strong> — field is present.</li>
        <li><strong>not_null</strong> — field is present and not null.</li>
        <li><strong>contains</strong> — string or array contains the expected substring/element.</li>
        <li><strong>greater_than</strong>, <strong>less_than</strong> — numeric comparisons.</li>
      </ul>

      <H3>Operators in practice</H3>
      <Code>{`assertion: {
  field: "data.id",
  operator: "exists",
}
assertion: {
  field: "data.locationId",
  operator: "equals",
  expected: "DEMO_LOCATION",
}`}</Code>

      <H3>Suites &amp; runs</H3>
      <ul>
        <li>Create a suite and add cases to it.</li>
        <li>Run a whole suite or a single case. Each run records pass/fail counts, duration, and a list of failures.</li>
        <li>The Run History tab shows every past run with a collapsible failure breakdown.</li>
      </ul>
    </>
  );
}

function SnapshotsSection() {
  return (
    <>
      <p>
        The Snapshot Validator inspects a GHL snapshot export (the JSON file
        GHL produces when you clone a location) before you import it into a
        new location.
      </p>

      <H3>What it checks</H3>
      <ul>
        <li><strong>Structure</strong> — verifies that <InlineCode>workflows</InlineCode>, <InlineCode>pipelines</InlineCode>, <InlineCode>calendars</InlineCode>, <InlineCode>forms</InlineCode>, <InlineCode>customFields</InlineCode>, and <InlineCode>tags</InlineCode> are arrays when present.</li>
        <li><strong>References</strong> — flags workflows that reference a <InlineCode>calendarId</InlineCode> or <InlineCode>pipelineId</InlineCode> not defined elsewhere in the snapshot.</li>
        <li><strong>Duplicates</strong> — detects workflows with identical names so you can disambiguate before import.</li>
        <li><strong>Compatibility</strong> — checks the <InlineCode>version</InlineCode> field against the supported 1.x schema.</li>
      </ul>

      <H3>Issue levels</H3>
      <ul>
        <li><strong>error</strong> — import will fail. Fix before importing.</li>
        <li><strong>warning</strong> — import may partially succeed. Review.</li>
        <li><strong>info</strong> — advisory only. Often experimental checks.</li>
      </ul>

      <H3>Import readiness</H3>
      <p>
        A snapshot is <strong>Import Ready</strong> when it has zero error-level
        issues. Warnings and info-level findings do not block readiness.
      </p>
    </>
  );
}

function AiDebuggerSection() {
  return (
    <>
      <p>
        The AI Debugger is a chat assistant specialized in GHL API errors,
        webhook payloads, and automation failures. It calls the{" "}
        <InlineCode>z-ai-web-dev-sdk</InlineCode> server-side and falls back to
        a heuristic response if the SDK is unavailable.
      </p>

      <H3>Model selection</H3>
      <ul>
        <li><strong>gemini-default</strong> — Google Gemini via the SDK.</li>
        <li><strong>openrouter-auto</strong> — OpenRouter's automatic model router.</li>
        <li>The selected model is shown in the chat header and persisted per session.</li>
      </ul>

      <H3>Context</H3>
      <p>
        Attach optional JSON context — an error response, a webhook payload, or
        an assertion failure — and the assistant uses it to give a more
        targeted answer. The context is included under a{" "}
        <InlineCode>[Debug Context]</InlineCode> marker in the message sent to
        the LLM.
      </p>

      <H3>Fallback behavior</H3>
      <p>
        If the LLM call fails (network error, missing API key, quota
        exhaustion), the server returns a heuristic response that covers common
        GHL failure patterns: 401, 403, 404, 429, webhook signature issues,
        and missing required fields. The chat UI always shows the model name
        so you know which path produced the answer.
      </p>

      <H3>Privacy</H3>
      <p>
        Never paste real access tokens. The system prompt instructs the model
        to refuse to print tokens back. The toolkit&apos;s{" "}
        <strong>redact_secrets</strong> setting does not affect what you type
        into the chat — that is your responsibility.
      </p>
    </>
  );
}

function MonitorSection() {
  return (
    <>
      <p>
        The Integration Monitor runs health checks against your GHL connections
        and surfaces trends, alerts, and recent failures.
      </p>

      <H3>Health checks</H3>
      <ul>
        <li>Run a manual check from the header action — pick a connection, endpoint, and method.</li>
        <li>Each check records the HTTP status, response time, and whether it was OK (2xx).</li>
        <li>Checks are stored in <InlineCode>HealthCheck</InlineCode> and contribute to the trend chart.</li>
      </ul>

      <H3>Metrics</H3>
      <ul>
        <li><strong>Success Rate</strong> — percentage of checks that returned 2xx.</li>
        <li><strong>Total Checks</strong> — count of recorded checks (capped at 200 in the API).</li>
        <li><strong>Avg Latency</strong> — mean response time across checks.</li>
        <li><strong>Failed Checks</strong> — count of non-2xx responses.</li>
      </ul>

      <H3>Trend chart</H3>
      <p>
        The area chart shows avg latency and OK count over time, bucketed by
        minute. Filter by connection to focus on a single integration.
      </p>

      <H3>Alerts</H3>
      <p>
        Configure alerts that fire when a threshold is exceeded:
      </p>
      <ul>
        <li><strong>error_rate</strong> — percentage of failed checks (e.g. alert when &gt; 10%).</li>
        <li><strong>latency</strong> — avg latency in milliseconds (e.g. alert when &gt; 1000ms).</li>
        <li><strong>webhook_failure</strong> — count of failed webhook deliveries.</li>
      </ul>
      <p>
        Toggle alerts on/off inline and edit thresholds without opening a
        dialog.
      </p>
    </>
  );
}

function SecuritySection() {
  return (
    <>
      <p>
        Security in the toolkit follows four principles: redact credentials,
        log every mutation, validate every input, and block SSRF.
      </p>

      <H3>Credential storage</H3>
      <ul>
        <li>Access tokens, refresh tokens, API keys, and webhook secrets live in the SQLite database.</li>
        <li>The <InlineCode>redactSecrets</InlineCode> helper masks any field whose name matches <InlineCode>/token|secret|password|key|authorization/i</InlineCode>.</li>
        <li>API responses run through this helper before serialization — the raw token never leaves the server.</li>
      </ul>

      <H3>Audit logging</H3>
      <ul>
        <li>Every mutation (create/update/delete on connections, webhooks, snapshots, reports, alerts, AI sessions) writes a row to <InlineCode>AuditLog</InlineCode>.</li>
        <li>Logs include the action name, actor (defaults to <InlineCode>system</InlineCode> for API calls), resource type/ID, and a JSON details object.</li>
        <li>View recent logs in Settings &rarr; Audit Log or via <InlineCode>GET /api/audit</InlineCode>.</li>
      </ul>

      <H3>SSRF protection</H3>
      <p>
        Outbound requests to user-supplied URLs (API Explorer, Health Check)
        are filtered against private IP ranges:
      </p>
      <Code>{`10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
127.0.0.0/8
169.254.0.0/16
::1/128
fc00::/7`}</Code>
      <p>
        Any hostname that resolves to one of these ranges is rejected before
        the request is sent.
      </p>

      <H3>Input validation</H3>
      <ul>
        <li>Every route handler destructures the request body and explicitly checks field types before use.</li>
        <li>JSON payloads stored as text (e.g. snapshot issues, AI messages) are read with <InlineCode>safeParse</InlineCode> that returns null instead of throwing on malformed JSON.</li>
        <li>Enum fields (authType, alert type, report type, report format) are validated against whitelists.</li>
      </ul>
    </>
  );
}

function DeploymentSection() {
  return (
    <>
      <p>
        The toolkit deploys as a single Next.js app. A Caddyfile gateway is
        included so you can expose one port externally and route internal
        services through it.
      </p>

      <H3>Docker notes</H3>
      <p>
        A typical Dockerfile layers the standalone Next.js output over Bun:
      </p>
      <Code>{`# Build
bun run build

# Run
NODE_ENV=production bun .next/standalone/server.js`}</Code>
      <p>
        Mount a volume at <InlineCode>/app/prisma/custom.db</InlineCode> so the
        SQLite database survives container restarts.
      </p>

      <H3>Caddy gateway</H3>
      <p>
        The included <InlineCode>Caddyfile</InlineCode> terminates TLS and
        proxies inbound traffic to the Next.js dev server on port 3000. For
        cross-service requests, append{" "}
        <InlineCode>?XTransformPort=&lt;port&gt;</InlineCode> to any relative
        URL — the gateway routes the request to that internal port.
      </p>

      <H3>Production env vars</H3>
      <Code>{`NODE_ENV=production
PORT=3000
DATABASE_URL="file:./custom.db"

# Optional AI keys
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...`}</Code>
      <p>
        For multi-instance deployments, swap SQLite for PostgreSQL by editing{" "}
        <InlineCode>prisma/schema.prisma</InlineCode> provider and re-running{" "}
        <InlineCode>bun run db:push</InlineCode>.
      </p>
    </>
  );
}

function TroubleshootingSection() {
  return (
    <>
      <p>
        Common issues and their fixes. Most are environment-related, not code
        bugs.
      </p>

      <H3>Port already in use</H3>
      <p>
        If <InlineCode>bun run dev</InlineCode> fails with{" "}
        <InlineCode>EADDRINUSE :::3000</InlineCode>, a stale Next.js process is
        holding the port.
      </p>
      <Code>{`# Find and kill
lsof -i :3000
kill -9 <PID>

# Or use a different port
bun run dev -- -p 3001`}</Code>

      <H3>Database not seeded</H3>
      <p>
        If the Overview shows zero counts, the seed call failed silently.
        Trigger it manually:
      </p>
      <Code>{`curl -X POST http://localhost:3000/api/seed`}</Code>
      <p>
        Or open Settings &rarr; Data Management &rarr; Seed Demo Data.
      </p>

      <H3>Demo mode vs live mode</H3>
      <ul>
        <li>In <strong>demo mode</strong>, all GHL API requests return simulated responses. No real tokens are needed.</li>
        <li>To make real calls, disable demo mode in Settings and add a connection with a valid access token.</li>
        <li>Demo mode is the default — switch it off only after you&apos;ve validated your token works.</li>
      </ul>

      <H3>AI Debugger returns fallback responses</H3>
      <ul>
        <li>If every assistant reply is the heuristic fallback, the SDK call is failing server-side.</li>
        <li>Check <InlineCode>dev.log</InlineCode> for the <InlineCode>[ai-debugger] LLM call failed</InlineCode> message.</li>
        <li>Set a valid Gemini or OpenRouter API key in Settings &rarr; AI Configuration.</li>
      </ul>

      <H3>Webhook capture URL returns 404</H3>
      <p>
        The capture endpoint is <InlineCode>/api/webhooks/capture/&lt;slug&gt;</InlineCode>.
        If you see a 404, you&apos;re hitting <InlineCode>/api/webhooks</InlineCode>{" "}
        (the management route) instead. Make sure GHL is POSTing to the full
        capture URL including the slug.
      </p>
    </>
  );
}

function ContributingSection() {
  return (
    <>
      <p>
        The toolkit is MIT-licensed and open to community contributions.
      </p>

      <H3>Repository</H3>
      <p>
        Source lives at{" "}
        <a href="https://github.com/hamids-ai-automations/ghl-devops-toolkit" target="_blank" rel="noreferrer">
          github.com/hamids-ai-automations/ghl-devops-toolkit
        </a>.
      </p>

      <H3>How to contribute</H3>
      <ul>
        <li>Fork the repo and create a feature branch (<InlineCode>feat/my-feature</InlineCode>).</li>
        <li>Run <InlineCode>bun run lint</InlineCode> and fix any warnings before pushing.</li>
        <li>Open a pull request describing the change and the module it affects.</li>
        <li>Keep modules self-contained — new modules go in <InlineCode>src/components/modules/</InlineCode> with a matching route under <InlineCode>src/app/api/</InlineCode>.</li>
      </ul>

      <H3>License</H3>
      <p>
        Released under the MIT License. See the{" "}
        <a href="https://github.com/hamids-ai-automations/ghl-devops-toolkit" target="_blank" rel="noreferrer">
          LICENSE
        </a>{" "}
        file in the repository root.
      </p>

      <H3>Code style</H3>
      <ul>
        <li>TypeScript throughout with strict typing.</li>
        <li>shadcn/ui components over custom implementations.</li>
        <li>Semantic color classes (<InlineCode>bg-card</InlineCode>, <InlineCode>text-muted-foreground</InlineCode>) — no hardcoded hex colors.</li>
        <li>Every module file starts with <InlineCode>&quot;use client&quot;</InlineCode>.</li>
      </ul>
    </>
  );
}

function RoadmapSection() {
  const phases = [
    { name: "Foundation", status: "done", desc: "Project scaffold, Prisma schema, navigation, theme, layout." },
    { name: "GHL Integration", status: "done", desc: "Connections CRUD, OAuth/private token support, redacted API responses." },
    { name: "Developer Tools", status: "done", desc: "API Explorer, Webhook Inspector, Workflow Simulator, Testing Engine." },
    { name: "Advanced Capabilities", status: "done", desc: "Snapshot Validator, AI Debugger, Integration Monitor, Report Generator." },
    { name: "Product Completion", status: "wip", desc: "Polish docs, audit log viewer, deployment guide, contribution flow." },
  ];
  return (
    <>
      <p>
        The roadmap tracks the toolkit from initial scaffold to a polished
        MVP. Most phases are complete; the final phase is actively in
        progress.
      </p>

      <H3>Phases</H3>
      <ul className="space-y-3 pl-0 list-none">
        {phases.map((p) => (
          <li
            key={p.name}
            className="flex flex-col gap-1 rounded-md border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {p.name}
              </p>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
            <Badge
              variant={p.status === "done" ? "default" : "secondary"}
              className="text-[10px] capitalize"
            >
              {p.status === "wip" ? "In progress" : p.status}
            </Badge>
          </li>
        ))}
      </ul>

      <H3>Beyond MVP</H3>
      <ul>
        <li>OAuth refresh token automation.</li>
        <li>WebSocket-driven live monitor updates.</li>
        <li>Multi-location dashboards.</li>
        <li>Snapshot diff viewer (compare two snapshots side by side).</li>
      </ul>
    </>
  );
}

function ExternalLinks() {
  const links = [
    {
      href: "https://wa.me/923167417135",
      label: "WhatsApp Support",
      desc: "Instant developer chat: +923167417135.",
      icon: <MessageCircle className="h-4 w-4 text-emerald-500" />,
    },
    {
      href: "https://github.com/hamids-ai-automations/ghl-devops-toolkit",
      label: "GitHub Repository",
      desc: "Source code, issues, and pull requests.",
      icon: <Github className="h-4 w-4" />,
    },
    {
      href: "https://marketplace.gohighlevel.com/docs/",
      label: "GHL Marketplace Docs",
      desc: "Official API reference, OAuth scopes, and webhook event types.",
      icon: <Code2 className="h-4 w-4" />,
    },
    {
      href: "https://marvis.web.app/",
      label: "Marvis Portfolio",
      desc: "Other open-source projects and integrations from the maintainer.",
      icon: <Globe className="h-4 w-4" />,
    },
  ];
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ExternalLink className="h-3 w-3" /> External Links & Direct Assistance
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col gap-1 rounded-md border bg-muted/20 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex items-center gap-2">
                <span className="text-primary">{l.icon}</span>
                <span className="text-sm font-medium group-hover:text-primary">
                  {l.label}
                </span>
                <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="text-xs text-muted-foreground">{l.desc}</p>
            </a>
          ))}
        </div>
        <Separator className="my-4" />
        <p className="text-[10px] text-muted-foreground">
          GHL DevOps Toolkit is an independent open-source project and is not
          affiliated with or endorsed by GoHighLevel.
        </p>
      </CardContent>
    </Card>
  );
}
