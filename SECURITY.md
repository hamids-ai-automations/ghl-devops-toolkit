# Security Policy: GHL DevOps Toolkit

The maintainers of **GHL DevOps Toolkit** take security seriously. This document outlines our security policies, vulnerability reporting procedure, and best practices.

---

## Supported Versions

| Version | Supported |
| :--- | :--- |
| `v0.1.x` | :white_check_mark: Active Support |
| `< v0.1.0` | :x: End of Life |

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **please do not disclose it publicly via GitHub issues.**

Instead, please report it directly through one of the following secure channels:

- **WhatsApp (Immediate Response):** [+923167417135](https://wa.me/923167417135)
- **Portfolio Contact:** [https://marvis.web.app/](https://marvis.web.app/)
- **Security Advisor:** Muhammad Hamid

Please include:
1. Detailed description of the vulnerability.
2. Steps to reproduce or proof-of-concept payload.
3. Potential impact assessment.
4. Suggested remediation if known.

We will acknowledge receipt within 24 hours and provide an estimated resolution timeline.

---

## Security Architecture & Defenses

1. **Token Protection & Credential Isolation**
   - API tokens and private integration keys are never exposed in client bundles.
   - `.gitignore` strictly prohibits committing `.env` files or database binaries.

2. **Server-Side Request Forgery (SSRF) Defense**
   - All external HTTP calls made by the GHL Client are restricted to official HighLevel domains (`services.leadconnectorhq.com`).
   - Arbitrary outbound URLs provided by user input are rejected.

3. **HMAC-SHA256 Constant-Time Signature Verification**
   - Inbound webhook payloads are verified using constant-time string comparison (`verifyWebhookSignature`) to prevent timing side-channel attacks.

4. **Input Sanitization & Injection Prevention**
   - All database queries are executed via Prisma ORM with parameterized queries, eliminating SQL injection.
   - User payloads are validated using TypeScript interfaces and Zod schemas.

5. **Audit Logging**
   - Security-sensitive actions (token updates, test executions, webhook replays) are logged in the `AuditLog` table with timestamp and IP attribution.
