#!/usr/bin/env bash

if ! command -v pg_isready >/dev/null 2>&1; then
  echo "PostgreSQL client tools not installed, skipping local cluster startup."
  exit 0
fi

if ! pg_isready -h localhost -p 5432 -q 2>/dev/null; then
  echo "Starting local PostgreSQL server..."
  su - postgres -c "pg_ctlcluster 15 main start" 2>/dev/null || pg_ctlcluster 15 main start 2>/dev/null || true
  sleep 1
fi

if pg_isready -h localhost -p 5432 -q 2>/dev/null; then
  echo "PostgreSQL is ready."
else
  echo "PostgreSQL service not ready, will rely on in-memory store cache."
fi

exit 0
