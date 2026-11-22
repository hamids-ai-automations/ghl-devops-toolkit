# Changelog

All notable changes to GHL DevOps Toolkit are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-11-22 - MVP

### Added — Foundation
- Next.js 16 App Router project with TypeScript 5, Tailwind CSS 4, shadcn/ui (New York).
- Prisma ORM + SQLite datasource with 14 models (GhlConnection, ApiRequest, WebhookEvent, WorkflowSim, WorkflowRun, TestCase, TestSuite, TestRun, SnapshotReport, AiSession, HealthCheck, AlertConfig, Report, Setting, AuditLog).
- Theme provider (next-themes) with dark/light/system support.
- Single-route (`/`) dashboard shell with client-side view switching via Zustand nav store.
- Sidebar navigation grouped into Core / Developer Tools / Advanced / System.
- Sticky header + sticky footer (flex column layout).
- Custom scrollbar styling and JSON viewer CSS.

### Added — GHL Integration
- GHL API client (`src/lib/ghl-client.ts`) supporting both simulated (demo) and live HTTPS requests to `services.leadconnectorhq.com`.
- Webhook signature verification helper (HMAC-SHA256, constant-time comparison).
- Connection management: create, list, update, delete, verify (test /contacts call).
- Secret redaction in all API responses (`xxxx••••xx`).
- Demo data seeder (`src/lib/demo-data.ts`) — populates a working dataset on first load.

### Added — Developer Tools
- **GHL API Explorer**: request builder (method, endpoint, headers, body, query params), execute against any connection, response viewer (status, headers, JSON body), save-as, history list with reload.
- **Webhook Inspector**: auto-generated capture URLs, public POST receiver at `/api/webhooks/capture/[slug]`, event list with filter/search, view dialog (headers + parsed body + signature), replay.
- **Workflow Simulator**: 7 scenario templates (new_lead, contact_updated, pipeline_stage_changed, appointment_booked, appointment_cancelled, form_submitted, follow_up_triggered), step editor, run with timeline visualization, simulated flag.
- **Automation Testing Engine**: test cases with assertions (equals, exists, not_null, contains, greater_than, less_than), test suites, run single case or suite, assertion evaluation against simulated/live responses, run history with failure details.

### Added — Advanced Capabilities
- **Snapshot Validator**: structural inspection, reference validation (workflow → pipeline/calendar), duplicate detection, missing config detection, version compatibility, import-readiness flag, issue categorization (error/warning/info).
- **AI Debugger**: chat interface backed by `z-ai-web-dev-sdk` (Gemini), session management, context attachment, quick prompts, token usage tracking, heuristic fallback for 401/403/404/429/webhook scenarios, markdown rendering of responses.
- **Integration Monitor**: health check execution, metrics (success rate, avg/max latency, counts), trend chart (recharts), alerts (error_rate, latency, webhook_failure) with enable/disable and threshold editing, recent checks table.
- **Report Generator**: 5 report types (api_diagnostics, testing_results, webhook_history, integration_health, full_summary), 4 formats (HTML, JSON, CSV, PDF), inline view + download.

### Added — System
- Settings module: demo mode, redact secrets, AI model/provider, API keys (Gemini, OpenRouter), webhook secret, audit log viewer.
- Documentation module: in-app docs with 17 sections (overview, architecture, installation, configuration, authentication, all module guides, security, deployment, troubleshooting, contribution, roadmap).
- Audit logging across all mutating actions (connection.create, api.execute, webhook.received, webhook.replay, workflow.run, test.run, snapshot.validate, ai.chat, report.generate, monitor.check).

### Security
- Input validation on all API routes.
- Secret redaction in API responses.
- Webhook HMAC-SHA256 signature verification.
- SSRF protection (GHL client only calls `services.leadconnectorhq.com`).
- Structured error handling (no stack trace leakage).
- Audit trail for all sensitive actions.

### Documentation
- Comprehensive README with architecture diagram, quick start, configuration, authentication, module guides, demo mode, security, deployment, troubleshooting, roadmap.
- ARCHITECTURE.md with directory structure, data model, request flow diagrams.
- CONTRIBUTING.md, LICENSE (MIT), .env.example, docker-compose.yml, Dockerfile.
- ROADMAP.md with phased plan.
- DEVELOPMENT_LOG.md, TASK_TRACKER.md.

### Known Limitations
- SQLite is the default database (single-writer). For production concurrency, switch to PostgreSQL.
- Access tokens are stored plaintext in dev. Production should add AES-256-GCM encryption.
- No user authentication on the toolkit itself (NextAuth.js is available but not wired up).
- Live GHL mode requires a real access token; demo mode is the default.
- PDF report format reuses the HTML generator (browser print-to-PDF recommended for true PDF).

---

## Release process

1. Update `CHANGELOG.md` under a new `[x.y.z]` heading.
2. Update version in `package.json`.
3. Tag the release: `git tag -a vx.y.z -m "Release vx.y.z"`.
4. Push tags: `git push origin vx.y.z`.
5. Create a GitHub Release with release notes from this changelog.
