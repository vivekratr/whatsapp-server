## Learned User Preferences

- Prefers very simple, mobile-friendly UI with minimal navigation (schedule + message history tabs only).
- Wants persistent login so users do not need to re-authenticate on every visit.
- Prefers ponytail-style minimal solutions: shortest working diff, reuse existing code, avoid over-engineering.
- Each user should self-link their own WhatsApp from mobile via pairing code, not QR on the same device.

## Learned Workspace Facts

- `whatsapp-server` is a mobile-first PWA (Vite + React); backend and scheduling logic live in sibling project `D:\VK\Codes\Web2\OpenWA`.
- Mobile auth uses WhatsApp pairing code (`pairWithPhoneNumber`), not QR scanning on the same phone.
- App auth uses JWT stored in `localStorage` (`wa_token`); mobile auth endpoints are under `/api/mobile/auth/*`.
- Scheduled messages require `QUEUE_ENABLED=true` and a running Redis instance in OpenWA.
- OpenWA must load `.env` before `AppModule` import (`src/load-env.ts`) so queue modules read `QUEUE_ENABLED` at load time.
- OpenWA API defaults to `http://localhost:2785`; the PWA proxies `/api` to it in development.
- A personal WhatsApp number maps to one OpenWA session; mobile JWT scopes scheduled-message access to that session.
- Scheduled sends use BullMQ delayed jobs and `BulkMessageService`; media DTO fields need `@IsOptional()` + `@IsObject()` for validation.
