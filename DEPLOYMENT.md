# Production Deployment Guide: GHL DevOps Toolkit

This document provides production architecture guidance, environment configurations, and deployment strategies for **GHL DevOps Toolkit**.

---

## Architecture Overview

```
                        [ Internet / GHL Webhooks ]
                                     │
                                     ▼
                    [ Reverse Proxy / TLS (Caddy/Nginx) ]
                                     │
                                     ▼
                    [ Next.js Standalone Server (Port 3000) ]
                      ├── App Router Frontend (React 19)
                      └── REST API Routes (/api/*)
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
        [ PostgreSQL / SQLite ]            [ AI Debugger Providers ]
        (Prisma Persistent DB)             (Gemini / OpenRouter)
```

---

## Deployment Options

### 1. Docker Compose (Recommended for VPS / Cloud VM)

The project includes an optimized multi-stage build in `docker/Dockerfile`.

1. Clone repository to server:
   ```bash
   git clone https://github.com/hamids-ai-automations/ghl-devops-toolkit.git
   cd ghl-devops-toolkit
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Set DEMO_MODE="false" and configure your DATABASE_URL / AI keys
   ```

3. Start container:
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

### 2. Vercel / Railway / Cloud Run

- **Vercel:** Supports direct Git deployment. Ensure `DATABASE_URL` points to a hosted PostgreSQL instance (e.g., Supabase, Neon).
- **Railway:** Automatically detects the Next.js app, provides a managed PostgreSQL database, and provisions HTTPS URLs.
- **Google Cloud Run:** Use the included `docker/Dockerfile` with Google Artifact Registry and Cloud Run.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | `file:./db/custom.db` | Prisma database connection string (SQLite or PostgreSQL) |
| `DEMO_MODE` | No | `true` | When `true`, simulates GHL responses; set to `false` for live API calls |
| `GEMINI_API_KEY` | Optional | `""` | Google Gemini API key for AI troubleshooting |
| `OPENROUTER_API_KEY` | Optional | `""` | OpenRouter API key for alternative LLM routing |
| `WEBHOOK_SECRET` | Optional | `""` | Shared secret for verifying GHL webhook HMAC signatures |
| `AUDIT_LOGGING` | No | `true` | Enables compliance tracking in `AuditLog` table |

---

## Production Checklist

- [x] Run `npm run type-check` with 0 errors
- [x] Run `npm run lint` with 0 warnings/errors
- [x] Run `npm test` with 100% assertions passing
- [x] Execute `npm run build` verifying standalone output
- [x] Set strong `WEBHOOK_SECRET` for signature verification
- [x] Ensure `.env` is omitted from version control
- [x] Configure HTTPS termination for webhook intake endpoints

---

## Direct Consulting & Engineering Assistance

For custom deployments, high-volume webhook architecture, or agency integrations:
- **WhatsApp:** [+923167417135](https://wa.me/923167417135)
- **Portfolio:** [https://marvis.web.app/](https://marvis.web.app/)
- **Lead Engineer:** Muhammad Hamid
