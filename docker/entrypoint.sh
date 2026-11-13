#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  node dist/database/cli/run-migrations.js
fi

exec node dist/main.js
