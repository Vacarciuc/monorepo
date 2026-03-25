#!/bin/sh

PROJ=dasi

docker compose \
  --project-name $PROJ \
  --timeout 10 \
  down

docker compose \
  --project-name $PROJ \
  --file ./compose.dev.yml \
  --progress tty \
  --parallel -1 \
  --env-file ./.env.development \
  up \
  --build \
  --watch

