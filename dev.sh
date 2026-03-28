#!/bin/sh

PROJ=dasi

docker compose \
  --project-name $PROJ \
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

