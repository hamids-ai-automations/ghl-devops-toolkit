# Installation and Setup Guide

This guide covers installing and running the **GHL DevOps Toolkit** on local machines (Windows, macOS, Linux) and via Docker.

---

## Prerequisites

- **Node.js**: Version 20.x or 24.x LTS ([Download Node.js](https://nodejs.org/))
- **npm**: Version 10+ or 11+
- **Git**: Installed and configured
- **WhatsApp Support**: Need setup help? Contact [+923167417135](https://wa.me/923167417135)

---

## 1. Quick Start (Zero-Config Local Development)

### Step 1: Clone the Repository
```bash
git clone https://github.com/hamids-ai-automations/ghl-devops-toolkit.git
cd ghl-devops-toolkit
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

The default configuration runs in **Demo Mode** using a local SQLite database (`db/custom.db`) with zero external dependencies.

```ini
DATABASE_URL="file:./db/custom.db"
DEMO_MODE="true"
AUDIT_LOGGING="true"
```

### Step 3: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 4: Generate Database & Prisma Client
```bash
npm run db:push
npm run db:generate
```

### Step 5: Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser. The app will launch with pre-seeded demo data including sample connections, API history, webhook logs, workflow simulations, and test suites.

---

## 2. Docker Deployment

The toolkit includes a production-ready multi-stage `Dockerfile` and `docker-compose.yml`:

```bash
docker compose -f docker/docker-compose.yml up --build -d
```

The app will be accessible at [http://localhost:3000](http://localhost:3000), persisting database state in a named Docker volume.

---

## 3. Production Build & Verification

To verify the production build locally:

```bash
# Run tests
npm test

# Run TypeScript type-check
npm run type-check

# Run linter
npm run lint

# Compile Next.js production bundle
npm run build

# Start production server
npm start
```

---

## 4. Connecting to Live GoHighLevel

To transition from Demo Mode to live GoHighLevel API interactions:

1. In the Toolkit dashboard, navigate to **Connections**.
2. Click **Add Connection**.
3. Choose authentication type:
   - **Private Integration Token (PIT)**: Paste your Location PIT from HighLevel Settings -> Private Integrations.
   - **OAuth 2.0**: Enter your Client ID and Client Secret from your Marketplace App.
4. Set the Location ID and verify scopes.
5. In **Settings**, toggle `DEMO_MODE` to `false` (or set `DEMO_MODE="false"` in `.env`).

---

## Support & Direct Assistance

For enterprise deployment, custom GHL integrations, or troubleshooting:
- **WhatsApp**: [+923167417135](https://wa.me/923167417135)
- **Portfolio**: [https://marvis.web.app/](https://marvis.web.app/)
- **GitHub Issues**: [Report an Issue](https://github.com/hamids-ai-automations/ghl-devops-toolkit/issues)
