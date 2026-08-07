#!/bin/sh
set -eu

echo "→ Applying database migrations…"
npx prisma migrate deploy

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "→ Seeding database…"
  npx tsx prisma/seed.ts
fi

echo "→ Starting application…"
exec "$@"
