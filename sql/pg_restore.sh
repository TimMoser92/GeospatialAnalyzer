#!/bin/bash
set -e

# use docker image env vars, c.f. https://hub.docker.com/_/postgres#initialization-scripts
pg_restore --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --no-owner < '/docker-entrypoint-initdb.d/data';