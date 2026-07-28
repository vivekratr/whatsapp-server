## Learned User Preferences

- Prefers very simple, mobile-friendly UI with minimal navigation (schedule + message history tabs only).
- Wants persistent login so users do not need to re-authenticate on every visit.
- Prefers ponytail-style minimal solutions: shortest working diff, reuse existing code, avoid over-engineering.
- Each user should self-link their own WhatsApp from mobile via pairing code, not QR on the same device.
- Deploy frontend on Vercel and backend on a VPS with `docker-compose.vps.yml` (OpenWA + Postgres + Redis).
- WhatsApp session should survive server restarts without re-pairing when saved credentials exist.

## Learned Workspace Facts

- `whatsapp-server` is a mobile-first PWA (Vite + React); backend and scheduling logic live in sibling project `D:\VK\Codes\Web2\OpenWA`.
- Public GitHub repos: `vivekratr/whatsapp-server` (PWA) and `vivekratr/OpenWA` (backend).
- Mobile auth uses WhatsApp pairing code (`pairWithPhoneNumber`); codes are alphanumeric (`XXXX-XXXX`), not digits-only.
- App auth uses JWT stored in `localStorage` (`wa_token`); mobile auth endpoints are under `/api/mobile/auth/*`.
- App JWT login and WhatsApp session status are separate; the disconnected banner reflects WhatsApp link state, not app auth.
- Scheduled messages require `QUEUE_ENABLED=true` and a running Redis instance in OpenWA.
- OpenWA must load `.env` before `AppModule` import (`src/load-env.ts`) so queue modules read `QUEUE_ENABLED` at load time.
- VPS deploy uses `OpenWA/docker-compose.vps.yml` (API + Postgres + Redis); minimal `.env` needs only `DATABASE_PASSWORD` and `CORS_ORIGINS` (no trailing slash).
- `docker-compose.vps.yml` forces postgres/redis/queue env vars so pasting `.env.example` sqlite/localhost settings does not break deploy.
- OpenWA API defaults to `http://localhost:2785`; the PWA proxies `/api` to it in development.
- A personal WhatsApp number maps to one OpenWA session; mobile JWT scopes scheduled-message access to that session.
- Saved contacts per session at `/api/sessions/:sessionId/saved-contacts`; mobile picker uses Contacts Picker API (Chrome Android, HTTPS).
