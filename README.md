# WA Scheduler (Mobile PWA)

Mobile-first PWA for scheduling WhatsApp messages. Talks to the [OpenWA](../OpenWA) backend over `/api`.

## Prerequisites

| What | Default |
|------|---------|
| OpenWA API | `http://localhost:2785` |
| Scheduled messages | `QUEUE_ENABLED=true` + Redis in OpenWA |

## Run locally (dev)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Vite proxies `/api` → OpenWA on port 2785.

Start OpenWA first. Different host/port? Edit `server.proxy` in `vite.config.ts`.

## Run locally (Docker)

Build and run the production image (same as VPS):

```bash
docker build -t wa-scheduler .
docker run -d --name wa-scheduler -p 8080:80 \
  -e API_UPSTREAM=http://host.docker.internal:2785 \
  --add-host=host.docker.internal:host-gateway \
  wa-scheduler
```

Open http://localhost:8080.

## Deploy on Hostinger VPS

Assumes OpenWA is already running on the VPS (or reachable over the network).

### 1. Install Docker

```bash
ssh root@YOUR_SERVER_IP
curl -fsSL https://get.docker.com | sh
```

### 2. Clone and build

```bash
git clone YOUR_REPO_URL wa-scheduler
cd wa-scheduler
docker build -t wa-scheduler .
```

### 3. Run

**OpenWA on the same VPS:**

```bash
docker run -d --name wa-scheduler --restart unless-stopped \
  -p 80:80 \
  -e API_UPSTREAM=http://host.docker.internal:2785 \
  --add-host=host.docker.internal:host-gateway \
  wa-scheduler
```

**OpenWA on another host:**

```bash
docker run -d --name wa-scheduler --restart unless-stopped \
  -p 80:80 \
  -e API_UPSTREAM=http://OPENWA_IP:2785 \
  wa-scheduler
```

### 4. Open firewall

In Hostinger hPanel → VPS → **Firewall**, allow inbound **TCP 80** (and **443** when you add HTTPS).

App: `http://YOUR_SERVER_IP`

### 5. HTTPS (recommended)

PWA install works best over HTTPS. Easiest path on a VPS — Caddy in front:

```bash
apt install -y caddy
```

`/etc/caddy/Caddyfile`:

```
your-domain.com {
  reverse_proxy localhost:80
}
```

```bash
systemctl reload caddy
```

Point your domain A-record to the VPS IP first. Caddy handles the certificate.

### Update

```bash
cd wa-scheduler
git pull
docker build -t wa-scheduler .
docker stop wa-scheduler && docker rm wa-scheduler
# re-run the docker run command from step 3
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_UPSTREAM` | `http://host.docker.internal:2785` | OpenWA base URL (no trailing slash) |

## User flow

1. Enter phone number with country code
2. Enter the 8-digit pairing code in WhatsApp → Linked devices → Link with phone number
3. Use **Schedule** / **Messages** tabs

## API endpoints used

- `POST /api/mobile/auth/start`
- `GET /api/mobile/auth/status/:sessionId`
- `POST /api/mobile/auth/complete/:sessionId`
- `GET /api/mobile/auth/me`
- `POST /api/sessions/:id/scheduled-messages`
- `GET /api/sessions/:id/scheduled-messages`

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank page / 502 on login | OpenWA not running or wrong `API_UPSTREAM` |
| Scheduled messages don't send | Set `QUEUE_ENABLED=true` and run Redis in OpenWA |
| Can't reach site from phone | Open port 80 in Hostinger firewall |
| `host.docker.internal` fails on Linux | Add `--add-host=host.docker.internal:host-gateway` |
