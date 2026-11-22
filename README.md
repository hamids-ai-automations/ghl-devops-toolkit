<div align="center">

# GHL DevOps Toolkit
### The Open-Source Developer Platform for GoHighLevel Automations

[![CI](https://github.com/hamids-ai-automations/ghl-devops-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/hamids-ai-automations/ghl-devops-toolkit/actions/workflows/ci.yml)
[![Tests Passing](https://img.shields.io/badge/Tests-20%2F20%20Passing-emerald.svg?style=flat-square)](QA_REPORT.md)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black.svg?style=flat-square)](https://nextjs.org/)
[![Prisma 6](https://img.shields.io/badge/Prisma-6.x-2D3748.svg?style=flat-square)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![WhatsApp Support](https://img.shields.io/badge/WhatsApp-Contact%20Engineer-25D366?style=flat-square&logo=whatsapp&logoColor=white)](https://wa.me/923167417135)

<p align="center">
  <b>Inspect APIs · Debug Webhooks · Simulate Workflows · Execute Automated Regression Tests · Validate Snapshots · Diagnose Integrations with AI</b>
</p>

[Quick Start](#-quick-start) •
[Core Modules](#-core-modules) •
[Architecture](#-system-architecture) •
[Automated QA](#-automated-testing--qa) •
[Security](#-security--compliance) •
[Direct WhatsApp Support](#-contact--engineering-inquiries)

---

</div>

## 📌 Overview

**GHL DevOps Toolkit** is an open-source engineering platform built specifically for **GoHighLevel (GHL) developers, AI automation engineers, and CRM technical architects**. 

Building and deploying mission-critical GoHighLevel workflows often requires complex webhook debugging, rate-limit management, snapshot migration testing, and manual scenario execution. **GHL DevOps Toolkit** bridges this gap by providing an integrated, production-grade developer environment that replaces guesswork with deterministic testing, deep observability, and AI-assisted troubleshooting.

Whether you are building high-volume marketplace apps, setting up multi-location SaaS snapshots, or orchestrating AI voice and messaging agents, this toolkit equips you with the tooling you need.

---

## 🚀 Key Features

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           GHL DEVOPS TOOLKIT SUITE                              │
├──────────────────────┬──────────────────────┬───────────────────────────────────┤
│ 🔌 API Explorer      │ 🪝 Webhook Inspector │ ⚡ Workflow Simulator             │
│ Test live & demo     │ Ingest & replay      │ Simulate lead journeys            │
│ GHL v2 endpoints     │ events with HMAC     │ without firing live triggers      │
├──────────────────────┼──────────────────────┼───────────────────────────────────┤
│ 🧪 Test Engine       │ 📦 Snapshot Checker  │ 🤖 AI Debugger                    │
│ Automated regression │ Validate structure,  │ Explain API errors &              │
│ & assertion suites   │ duplicates & schemas │ diagnose payload failures with AI │
├──────────────────────┴──────────────────────┴───────────────────────────────────┤
│ 📊 Integration Monitor · Health checks, latency percentiles & alerts            │
│ 📑 Report Generator · Export audits in HTML, PDF, CSV, and JSON                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

- **GHL API Explorer**: Execute and manage requests against HighLevel API endpoints (`/contacts`, `/opportunities`, `/calendars`, `/locations`, `/users`). View formatted JSON, response headers, status codes, latency, and saved request history.
- **Webhook Inspector**: Generate unique webhook capture slugs, inspect raw and parsed payloads in real-time, filter by event type, and safely replay events with HMAC-SHA256 signature verification.
- **Workflow Simulator**: Step-by-step lead journey simulator (new lead, stage change, appointment booked/cancelled, form submission). Test logic branches with zero risk of accidentally triggering real automations inside customer sub-accounts.
- **Automation Testing Engine**: Define test cases with declarative assertions (`equals`, `contains`, `exists`, `not_null`, `greater_than`, `less_than`). Group tests into suites and run automated regression passes with structured failure reporting.
- **Snapshot Validator**: Upload and analyze GoHighLevel snapshot JSON exports. Detects missing configurations, broken pipeline/calendar references, duplicate workflows, and version incompatibilities before importing into live locations.
- **AI Debugger**: Context-aware AI diagnostic engine powered by Google Gemini and OpenRouter models. Translates cryptic GHL 400/401/403/429 errors into actionable fixes and generates corrected API payloads.
- **Integration Monitor**: Proactive health-checking engine that pings GHL connections, monitors response time percentiles, tracks failure rates, and fires threshold alerts.
- **Multi-Format Technical Reports**: Export comprehensive audit reports in HTML, JSON, and CSV covering API diagnostics, webhook receipts, test matrices, and system health.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & Components** | [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) (New York style), Lucide Icons |
| **Database & ORM** | [Prisma 6](https://www.prisma.io/) with SQLite (zero-config local) & PostgreSQL (production ready) |
| **API & Backend** | Next.js Edge & Node.js Serverless API Routes (`src/app/api/*`) |
| **AI Integration** | Google Gemini API & OpenRouter provider abstraction via `z-ai-web-dev-sdk` |
| **Testing Framework** | Native Node.js Test Runner (`node:test`, `node:assert/strict`) — 20/20 passed |
| **Containerization** | Multi-stage production [Dockerfile](docker/Dockerfile) & [Docker Compose](docker/docker-compose.yml) |
| **Reverse Proxy** | Caddy Gateway configuration included |

---

## 🏗️ System Architecture

```
                                  [ User Browser ]
                                         │
                                         ▼ (HTTP / JSON)
               ┌─────────────────────────────────────────────────────────┐
               │              Next.js 16 Unified Platform                │
               │                                                         │
               │  ┌───────────────────────┐   ┌───────────────────────┐  │
               │  │   Frontend Dashboard  │   │     REST API Layer    │  │
               │  │  12 Interactive Views │──▶│   /api/connections    │  │
               │  │  Dark / Light Themes  │   │   /api/webhooks       │  │
               │  │  Realtime Status      │   │   /api/testing        │  │
               │  │  Report Previews      │   │   /api/snapshots      │  │
               │  └───────────────────────┘   │   /api/ai-debugger    │  │
               │                              └───────────┬───────────┘  │
               └──────────────────────────────────────────┼──────────────┘
                                                          │
                                     ┌────────────────────┴────────────────────┐
                                     ▼                                         ▼
                     ┌───────────────────────────────┐         ┌───────────────────────────────┐
                     │          Prisma ORM           │         │         GHL API Client        │
                     │  SQLite (Dev) / Postgres (Prod│         │   services.leadconnectorhq    │
                     │  14 Data Models & Audit Log   │         │   (SSRF-Protected / HMAC SHA) │
                     └───────────────────────────────┘         └───────────────────────────────┘
                                                                               ▲
                                                                               │
                                                                   [ GoHighLevel Platform ]
```

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/hamids-ai-automations/ghl-devops-toolkit.git
cd ghl-devops-toolkit

# Install dependencies
npm install --legacy-peer-deps
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*By default, `DEMO_MODE="true"` is enabled, allowing you to test all 8 modules immediately without needing live GoHighLevel API keys.*

### 3. Initialize Database
```bash
npm run db:push
npm run db:generate
```

### 4. Launch the Toolkit
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. The application will automatically seed with sample connections, webhook captures, workflow simulations, and test suites.

---

## 🐳 Docker Deployment

To launch with Docker Compose:

```bash
docker compose -f docker/docker-compose.yml up --build -d
```
The application will be running on port `3000` with persistent SQLite storage mounted in a dedicated volume.

---

## 🧪 Automated Testing & QA

The project includes an automated test suite verifying request simulation, signature verification, assertion engine operators, and snapshot validation logic:

```bash
# Run unit & integration tests
npm test

# Run TypeScript type check
npm run type-check

# Run linter
npm run lint

# Compile production build
npm run build
```

### Test Verification Matrix
```
▶ GHL API Client - Demo Mode Request Execution
  ✔ executes /contacts GET request with simulated response
  ✔ executes /contacts POST request with 201 Created
  ✔ executes /opportunities GET request
  ✔ executes /calendars/events GET request
  ✔ executes /locations and /users GET requests
  ✔ provides valid GHL demo endpoints list
✔ GHL API Client - Demo Mode Request Execution
▶ GHL Webhook Signature Verification
  ✔ verifies valid HMAC-SHA256 signature correctly
  ✔ rejects tampered payload with invalid signature
  ✔ rejects missing signature header
  ✔ rejects incorrect secret
✔ GHL Webhook Signature Verification
▶ Automation Testing Assertion Engine Logic
  ✔ evaluates 'equals' assertion
  ✔ evaluates 'exists' and 'not_null' assertions
  ✔ evaluates 'contains' assertion
  ✔ evaluates 'greater_than' and 'less_than' assertions
✔ Automation Testing Assertion Engine Logic
▶ Snapshot Validator Logic
  ✔ marks clean snapshot as valid and importReady
  ✔ detects duplicate workflows and broken pipeline references
✔ Snapshot Validator Logic

20 passed, 0 failed, 0 skipped
```
*Full QA verification details are documented in [QA_REPORT.md](QA_REPORT.md).*

---

## 🔒 Security & Compliance

- **SSRF Protection:** Outbound calls from the GHL client are strictly pinned to `services.leadconnectorhq.com`. Arbitrary URLs are rejected.
- **Timing-Safe Webhook Verification:** Webhook signatures use constant-time XOR comparison to protect against timing attacks.
- **Zero Secret Leakage:** `.gitignore` enforces exclusion of `.env*` files, private keys, and SQLite database binaries.
- **Comprehensive Audit Trail:** All credential changes, webhook replays, and test runs are logged to the `AuditLog` table with actor and IP tracking.

---

## 🔍 SEO & Keyword Directory

This repository is optimized for open-source search and developer discovery across the following domains:

| Category | Primary Keywords |
| :--- | :--- |
| **GoHighLevel Development** | `GoHighLevel API`, `GHL DevOps`, `LeadConnector API v2`, `GoHighLevel Webhooks`, `GHL Marketplace Developer` |
| **CRM Test Automation** | `CRM Automation Testing`, `Workflow Simulator`, `Snapshot Validator`, `GHL Snapshot Export Inspection` |
| **Webhook Engineering** | `Webhook Inspector`, `HMAC-SHA256 Webhook Verification`, `Webhook Replay Tool`, `CRM Webhook Debugger` |
| **AI & Observability** | `AI Debugger for CRM`, `Gemini API Diagnostics`, `CRM Integration Health Monitor`, `GHL Rate Limit Handling` |

---

## 💬 Contact & Engineering Inquiries

Need assistance with high-volume GoHighLevel automations, custom API integrations, or enterprise deployment?

<div align="center">

[![WhatsApp](https://img.shields.io/badge/WhatsApp-%2B923167417135-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/923167417135)
[![Portfolio](https://img.shields.io/badge/Portfolio-marvis.web.app-6366F1?style=for-the-badge&logo=google-chrome&logoColor=white)](https://marvis.web.app/)
[![GitHub](https://img.shields.io/badge/GitHub-hamids--ai--automations-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/hamids-ai-automations)

**Maintainer:** Muhammad Hamid  
**Direct WhatsApp:** `+923167417135` (Instant Developer Support & Consulting)  
**Portfolio:** [https://marvis.web.app/](https://marvis.web.app/)  
**GitHub Organization:** [https://github.com/hamids-ai-automations](https://github.com/hamids-ai-automations)  

</div>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*Disclaimer: GHL DevOps Toolkit is an independent open-source developer project and is not affiliated with, endorsed by, or sponsored by GoHighLevel Inc.*
