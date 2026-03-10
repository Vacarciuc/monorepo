docker compose down
docker compose --project-name=dasi --file=./compose.prod.yml --progress=tty --parallel=-1 \
  --env-file=.env.production up --build

