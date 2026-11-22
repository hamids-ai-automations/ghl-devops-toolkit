# Roadmap

GHL DevOps Toolkit is built in phases. Each phase must be stable before the next begins.

## Status Legend
- [x] Complete
- [ ] Pending

---

## Phase 1 — Foundation  [x]

- [x] Repository setup, README, LICENSE, CONTRIBUTING
- [x] Next.js 16 + TypeScript 5 + Tailwind 4 + shadcn/ui
- [x] Prisma + SQLite datasource
- [x] Single-route dashboard shell with sidebar nav
- [x] Dark/light theme (next-themes)
- [x] Sticky header + footer
- [x] Audit logging infrastructure
- [x] Secret redaction in API responses
- [x] Demo data seeder

## Phase 2 — GHL Integration  [x]

- [x] GHL API client (simulated + live modes)
- [x] Connection management (CRUD + verify)
- [x] OAuth 2.0 and Private Integration Token support
- [x] Webhook signature verification helper
- [x] API Explorer MVP

## Phase 3 — Developer Tools  [x]

- [x] Webhook Inspector with public capture endpoint
- [x] Workflow Simulator with 7 scenario templates
- [x] Automation Testing Engine with assertions and suites
- [x] Test run history with failure details

## Phase 4 — Advanced Capabilities  [x]

- [x] Snapshot Validator (structure, references, duplicates, compatibility)
- [x] AI Debugger (z-ai-web-dev-sdk / Gemini + heuristic fallback)
- [x] Integration Monitor (health checks, metrics, alerts, trend chart)
- [x] Report Generator (HTML/JSON/CSV/PDF, 5 report types)

## Phase 5 — Product Completion  [x] Complete

- [x] Reports module
- [x] Dashboard refinement (Overview with metrics + quick start + recent activity)
- [x] Settings module
- [x] Documentation module (17 sections)
- [x] Security audit (input validation, redaction, SSRF, audit logging)
- [x] Automated browser verification
- [x] Production build verification (`npm run build` with Turbopack, standalone output)
- [x] CI/CD pipeline (GitHub Actions: lint, type-check, unit tests, build)
- [x] Automated unit & integration tests (`tests/test-suite.test.mjs`, 20/20 passed)
- [x] Docker & Docker Compose production deployment ready
- [x] Full SEO, OpenGraph, JSON-LD Schema.org integration
- [x] Direct WhatsApp support channel (+923167417135)
- [x] GitHub deployment to hamids-ai-automations/ghl-devops-toolkit
- [x] Release v0.1.0 ready

---

## Future phases (post-MVP)

### Phase 6 — Ecosystem Integration
- [ ] Connect with LeadFlow Sentinel
- [ ] Connect with Marvis portfolio site
- [ ] Reusable SDK packages (`packages/ghl-api-client`, `packages/webhook-inspector`, `packages/workflow-tester`, `packages/snapshot-validator`)
- [ ] Example integrations in `examples/`

### Phase 7 — Scale & Polish
- [ ] PostgreSQL + Redis migration guide
- [ ] Rate limiting middleware
- [ ] Role-based access control
- [ ] Multi-tenant support
- [ ] Webhook delivery retry queue
- [ ] Scheduled health checks (cron)
- [ ] Email/Slack alert delivery
- [ ] Snapshot diff comparison

### Phase 8 — Advanced AI
- [ ] OpenRouter multi-model routing
- [ ] AI-generated test cases from API specs
- [ ] AI-proposed workflow optimizations
- [ ] Natural language → API request builder
- [ ] Anomaly detection in integration metrics

---

## Decision log

- **Single route `/`**: chosen for sandbox simplicity. All 12 modules are client-side views switched via a Zustand store.
- **SQLite default**: chosen for zero-config local development. Swappable to PostgreSQL via schema change.
- **Demo mode default**: chosen so the toolkit is fully explorable without a real GHL account.
- **z-ai-web-dev-sdk**: chosen as the AI provider abstraction (Gemini-compatible) for the AI Debugger.
- **Heuristic AI fallback**: chosen so the AI Debugger remains useful even if the SDK is rate-limited.
