# Target Deployment

- Repository: `https://github.com/Frey210/SmartHR.git`
- Application container: legacy Docker CT101 at `192.168.10.68` / Tailscale `100.124.234.44`
- Database: active PostgreSQL/TimescaleDB CT165 at `192.168.10.65` / Tailscale `100.97.236.43`

Credentials remain in `D:\Aerasea\Mikrotik\credentials.txt` and must not be committed to this repository.

## Topology

- CT101 runs Docker Compose and stores the private photo volume.
- CT165 runs PostgreSQL; the application connects through its Tailscale address because CT102 was unreachable from CT101 during deployment.
- SQLite remains development-only.

## First staging deployment

1. On LXC 102, create database `smarthr` and a dedicated non-superuser role with ownership of that database.
2. On LXC 101, clone `https://github.com/Frey210/SmartHR.git`.
3. Copy `.env.production.example` to `.env.production`, then fill the database password and secrets from the credential store.
4. Generate `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` with `openssl rand -base64 32` and keep it stable between deployments.
5. Set `MTC_HTTP_PORT=3010` on CT101 because port 3000 is already allocated.
6. Build the image: `docker compose --env-file .env.production -f docker-compose.production.yml build`.
7. Initialize schema: `docker compose --env-file .env.production -f docker-compose.production.yml run --rm app node scripts/migrate-postgres.mjs`.
8. Create the first admin: `docker compose --env-file .env.production -f docker-compose.production.yml run --rm app node scripts/seed-admin-postgres.mjs`.
9. Remove `MTC_SEED_ADMIN_PASSWORD` from `.env.production`, then start: `docker compose --env-file .env.production -f docker-compose.production.yml up -d`.
10. Verify `http://100.124.234.44:3010/api/health` returns `{"status":"ok"}`.

Set `SESSION_COOKIE_SECURE=true` only when the public endpoint is served through HTTPS. Configure the reverse proxy to replace, not append untrusted, `X-Forwarded-For` values because login rate limiting uses that header.

## Update

```bash
git pull --ff-only
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml run --rm app node scripts/migrate-postgres.mjs
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

## Backup and restore

Run database backups on LXC 102 using a restricted `.pgpass` file:

```bash
mkdir -p /var/backups/smarthr
pg_dump --format=custom --file=/var/backups/smarthr/smarthr-$(date +%F-%H%M).dump smarthr
```

Back up the photo volume on LXC 101:

```bash
mkdir -p /var/backups/smarthr
docker run --rm -v absensi_attendance-storage:/data:ro -v /var/backups/smarthr:/backup alpine tar czf /backup/photos-$(date +%F-%H%M).tar.gz -C /data .
```

Test restore on a separate database and volume before relying on backups. A database restore uses `pg_restore`; restoring over production is destructive and must only be done during an approved maintenance window.

this sub domain for production mtc-absence.farlabs.my.id will use cloudflare tunnle
