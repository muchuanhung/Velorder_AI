#!/bin/sh
set -e

# RUN_MIGRATIONS=false 可略過（例如多副本部署時改由獨立 job 執行）
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  alembic upgrade head
fi

exec "$@"
