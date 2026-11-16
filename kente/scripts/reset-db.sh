#!/usr/bin/env bash
# Drops and recreates a local database, then applies migrations.
# Usage: scripts/reset-db.sh [dbname]   (default: kente)
set -euo pipefail
DB=${1:-kente}
psql "postgres://postgres:postgres@localhost:5432/postgres" -q -c "drop database if exists $DB with (force)" -c "create database $DB"
DATABASE_URL="postgres://postgres:postgres@localhost:5432/$DB" npx tsx scripts/migrate.mts
