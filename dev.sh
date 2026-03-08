docker compose down
docker compose --project-name=dasi --file=./compose.dev.yml --progress=tty --parallel=-1 \
  --env-file=.env.development up --build

