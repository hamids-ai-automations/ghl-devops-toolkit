# Contributing to GHL DevOps Toolkit

First of all, thank you for considering a contribution. This project aims to be a genuinely useful open-source developer toolkit for the GoHighLevel ecosystem, and every contribution helps.

## Code of Conduct

Be respectful, constructive, and inclusive. Harassment or discrimination of any kind is not tolerated.

## How to contribute

### Reporting bugs

1. Check existing [Issues](https://github.com/hamids-ai-automations/ghl-devops-toolkit/issues) to avoid duplicates.
2. Open a new issue with the `bug` label.
3. Include:
   - Toolkit version (see footer of any page).
   - Browser + OS.
   - Steps to reproduce.
   - Expected vs actual behavior.
   - Relevant screenshots or console output (redact any tokens).

### Suggesting features

1. Open an issue with the `enhancement` label.
2. Describe the use case — who benefits and how.
3. Sketch the proposed UX if possible.
4. Discuss before implementing large features.

### Submitting pull requests

1. Fork the repository.
2. Create a branch: `git checkout -b feat/your-feature` (or `fix/your-fix`).
3. Make your changes. Keep PRs focused — one feature per PR.
4. Run `npm test`, `npm run type-check`, and `npm run lint`. Ensure all tests pass.
5. Commit with a clear message: `feat: add X`, `fix: resolve Y`, `docs: update Z`.
6. Open a PR against `main` using the PR template.

## Development setup

```bash
npm install --legacy-peer-deps
npm run db:push
npm run db:generate
npm test
npm run dev
```

The dev server runs on port 3000. Access via `http://localhost:3000`.

## Contributor Support & Inquiries
- **WhatsApp**: [+923167417135](https://wa.me/923167417135)
- **Portfolio**: [https://marvis.web.app/](https://marvis.web.app/)

## Coding standards

### TypeScript
- Strict typing throughout. No `any` without justification.
- Shared types live in `src/lib/types.ts`.
- Prefer `interface` for object shapes, `type` for unions/aliases.

### React
- Client components (`"use client"`) for anything with state/hooks/events.
- Server components for static content and API routes.
- Use shadcn/ui components — do not reinvent primitives.
- Use `lucide-react` for icons.

### Styling
- Tailwind CSS 4 utility classes.
- Use shadcn semantic color classes (`bg-card`, `text-muted-foreground`, `border`).
- **No indigo or blue** as primary colors (per project style guide).
- Responsive: mobile-first with `sm:`, `md:`, `lg:` prefixes.

### API routes
- All routes return `{ success: true, data }` or `{ success: false, error }`.
- Use helpers from `src/lib/api.ts`: `ok()`, `fail()`, `audit()`, `safeParse()`, `redactSecrets()`.
- Validate input. Return `fail()` with a clear message on bad input.
- Log mutations via `audit()`.
- Never expose raw tokens in responses.

### Database
- Edit `prisma/schema.prisma` for model changes.
- Run `bun run db:push` after schema changes (development only).
- For production migrations, use `bun run db:migrate`.
- Primitive types only in schema (no lists — serialize JSON to `String`).

### Security
- Never commit credentials, tokens, or `.env`.
- Redact secrets in API responses.
- Validate webhook signatures where supported.
- Protect against SSRF (the GHL client only calls `services.leadconnectorhq.com`).

## Project structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full directory layout and data model.

Key directories:
- `src/app/api/` — REST API routes.
- `src/components/modules/` — the 12 module view components.
- `src/components/ui/` — shadcn/ui primitives.
- `src/lib/` — shared utilities, types, DB client, GHL client.
- `prisma/` — schema and migrations.

## Testing

The project currently relies on browser-based verification via `agent-browser`. Before submitting a PR:

1. Visit every module affected by your change.
2. Exercise the core interactions (click buttons, submit forms, switch tabs).
3. Check the browser console for errors.
4. Check `/home/z/my-project/dev.log` for 404s or runtime errors.

Future: Playwright E2E tests + vitest unit tests are on the roadmap.

## Commit message conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add webhook signature validation`
- `fix: handle 429 rate limit in API Explorer`
- `docs: update AI Debugger guide`
- `refactor: extract JSON parsing into safeParse`
- `chore: bump dependencies`

## Release process

Maintainers handle releases. See [CHANGELOG.md](CHANGELOG.md) for the release history and process.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).

## Questions?

Open a [Discussion](https://github.com/hamids-ai-automations/ghl-devops-toolkit/discussions) or an Issue. We respond within a few days.

---

*This project is maintained by [hamids-ai-automations](https://github.com/hamids-ai-automations).*
