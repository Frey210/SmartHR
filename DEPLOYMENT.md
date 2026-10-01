# Target Deployment

- Repository: `https://github.com/Frey210/SmartHR.git`
- Application container: LXC 101 Docker at `192.168.10.68`
- Database: LXC 102 PostgreSQL at `192.168.10.69`

Credentials remain in `D:\Aerasea\Mikrotik\credentials.txt` and must not be committed to this repository.

## Topology

- LXC 101 runs Docker Compose and stores the private photo volume.
- LXC 102 runs PostgreSQL and accepts port 5432 only from LXC 101 and the administration network.
- The application connects directly to PostgreSQL at `192.168.10.69`; SQLite remains development-only.

## First staging deployment

1. On LXC 102, create database `smarthr` and a dedicated non-superuser role with ownership of that database.
2. On LXC 101, clone `https://github.com/Frey210/SmartHR.git`.
3. Copy `.env.production.example` to `.env.production`, then fill the database password and secrets from the credential store.
4. Generate `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` with `openssl rand -base64 32` and keep it stable between deployments.
5. Build the image: `docker compose -f docker-compose.production.yml build`.
6. Initialize schema: `docker compose -f docker-compose.production.yml run --rm app node scripts/migrate-postgres.mjs`.
7. Create the first admin: `docker compose -f docker-compose.production.yml run --rm app node scripts/seed-admin-postgres.mjs`.
8. Remove `MTC_SEED_ADMIN_PASSWORD` from `.env.production`, then start: `docker compose -f docker-compose.production.yml up -d`.
9. Verify `http://192.168.10.68:3000/api/health` returns `{"status":"ok"}`.

Set `SESSION_COOKIE_SECURE=true` only when the public endpoint is served through HTTPS. Configure the reverse proxy to replace, not append untrusted, `X-Forwarded-For` values because login rate limiting uses that header.

## Update

```bash
git pull --ff-only
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml run --rm app node scripts/migrate-postgres.mjs
docker compose -f docker-compose.production.yml up -d
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
