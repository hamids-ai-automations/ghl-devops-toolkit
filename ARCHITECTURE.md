# Architecture

## Overview

GHL DevOps Toolkit is a single-page Next.js 16 application backed by Prisma + SQLite and a set of REST API routes. The AI Debugger uses the `z-ai-web-dev-sdk` (Gemini-compatible) for chat completions. A public webhook capture endpoint receives events from GoHighLevel.

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Browser (single route /)                  │
│  ┌──────────┐  ┌────────────────────────────────────────────┐   │
│  │ Sidebar  │  │  Header (sticky) + Module Content Area     │   │
│  │ Nav      │  │  12 modules, client-side view switching    │   │
│  │ (Zustand)│  │  via useNavStore                           │   │
│  └──────────┘  │  Footer (sticky bottom)                     │   │
│                └────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ fetch (relative paths)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes (/api/*)                   │
│  connections · api-explorer · webhooks · workflows · testing    │
│  snapshots · ai-debugger · monitor · reports · settings · audit │
└───────┬───────────────────────────┬─────────────────────────────┘
        │                           │
        ▼                           ▼
┌───────────────┐         ┌─────────────────────┐
│  Prisma +     │         │  z-ai-web-dev-sdk   │
│  SQLite       │         │  (Gemini chat)      │
│  (14 models)  │         │  server-side only   │
└───────────────┘         └─────────────────────┘
        ▲
        │ external POST (public)
┌───────────────────────────────────────────┐
│  GoHighLevel webhooks → /api/webhooks/    │
│  capture/[slug]   (receiver, no auth)     │
└───────────────────────────────────────────┘
```

## Directory structure

```
ghl-devops-toolkit/
├── prisma/
│   └── schema.prisma            # 14 Prisma models
├── db/
│   └── custom.db                # SQLite database file
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout + ThemeProvider
│   │   ├── page.tsx             # Single / route - shell + module router
│   │   ├── globals.css          # Tailwind 4 + custom scrollbar + JSON viewer
│   │   └── api/                 # All REST endpoints
│   │       ├── connections/
│   │       ├── api-explorer/
│   │       ├── webhooks/
│   │       ├── workflows/
│   │       ├── testing/
│   │       ├── snapshots/
│   │       ├── ai-debugger/
│   │       ├── monitor/
│   │       ├── reports/
│   │       ├── settings/
│   │       ├── audit/
│   │       └── seed/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui (full set)
│   │   ├── modules/             # 12 module view components
│   │   ├── sidebar.tsx          # Nav sidebar
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   └── module-common.tsx    # ModuleHeader, EmptyState, JsonView, StatusBadge
│   ├── hooks/
│   │   ├── use-nav.ts           # Zustand nav store
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   └── lib/
│       ├── db.ts                # Prisma client singleton
│       ├── types.ts             # Shared TypeScript types
│       ├── api.ts               # ok/fail/audit/safeParse/redactSecrets
│       ├── ghl-client.ts        # executeGhlRequest + webhook signature verify
│       ├── demo-data.ts         # Seed function
│       ├── navigation.ts        # NAV_ITEMS config
│       └── utils.ts             # cn() helper
├── Caddyfile                    # Reverse proxy gateway
├── package.json
├── prisma/schema.prisma
└── README.md
```

## Data model

14 Prisma models:

| Model | Purpose |
| --- | --- |
| `GhlConnection` | GHL API connections (OAuth or PIT) |
| `ApiRequest` | API Explorer request history |
| `WebhookEvent` | Captured webhook payloads |
| `WorkflowSim` | Workflow simulation definitions |
| `WorkflowRun` | Workflow simulation execution results |
| `TestCase` | Individual test case with assertions |
| `TestSuite` | Collection of test cases |
| `TestRun` | Test execution results |
| `SnapshotReport` | Snapshot validation reports |
| `AiSession` | AI Debugger conversations |
| `HealthCheck` | Integration health check records |
| `AlertConfig` | Monitoring alert thresholds |
| `Report` | Generated technical reports |
| `Setting` | Key/value toolkit settings |
| `AuditLog` | Security & action audit trail |

## Request flow

### API Explorer request

```
User clicks "Send Request"
  → POST /api/api-explorer
    → loads GhlConnection from DB
    → executeGhlRequest({ method, endpoint, accessToken, simulate })
      → if demo: generateDemoResponse() (no network)
      → if live: fetch(services.leadconnectorhq.com + endpoint)
    → persists ApiRequest record
    → audit("api.execute")
    → returns { statusCode, headers, body, durationMs, simulated }
  → UI renders color-coded status + JSON body
```

### Webhook capture

```
GoHighLevel POSTs event
  → POST /api/webhooks/capture/[slug]
    → reads raw body + headers
    → parses JSON, extracts eventType
    → matches locationId → connectionId
    → persists WebhookEvent
    → audit("webhook.received")
    → returns { success, eventId }
  → Webhook Inspector polls /api/webhooks and shows the event
```

### AI Debugger chat

```
User sends message
  → POST /api/ai-debugger/chat { message, sessionId?, context? }
    → loads or creates AiSession
    → builds messages array [system, history, user]
    → z-ai-web-dev-sdk chat.completions.create()
    → on failure: generateFallbackResponse() (GHL-specific heuristics)
    → appends user + assistant messages to session
    → increments tokenUsage
    → audit("ai.chat")
    → returns { sessionId, message, tokenUsage, model }
```

## Theme & UX

- **Dark/light** via `next-themes` (default dark). Toggle in header.
- **Responsive** mobile-first. Sidebar becomes a drawer on `< lg`.
- **Sticky footer** via `flex flex-col min-h-screen` + `mt-auto`.
- **Loading states** via shadcn `Skeleton`.
- **Toasts** via `@/hooks/use-toast` + shadcn `Toaster`.
- **Custom scrollbars** for long lists (`.custom-scroll`).

## AI integration

The AI Debugger is the only module that calls an external LLM. It uses `z-ai-web-dev-sdk` (server-side only — never imported in client components). The system prompt is hardcoded in `/api/ai-debugger/chat/route.ts` and instructs the model to be a GHL expert that explains errors, analyzes payloads, and generates corrected code. A heuristic fallback (`generateFallbackResponse`) handles 401/403/404/429/webhook scenarios if the SDK call fails.

## Extensibility

- **New modules**: add to `NAV_ITEMS` in `src/lib/navigation.ts`, add a case to `ModuleRouter` in `page.tsx`, create the component in `src/components/modules/`.
- **New API routes**: add under `src/app/api/<name>/route.ts`.
- **New DB models**: edit `prisma/schema.prisma`, run `bun run db:push`.
- **Live GHL mode**: set a connection's `status = "active"` with a real token. `executeGhlRequest` will make real HTTPS calls.
