get_env () {
  gcloud secrets versions access latest --secret "$1"
}

GITHUB_SHA=$1
DOCKER_IMAGE_NAME=europe-west10-docker.pkg.dev/market-place-489716/monorepo/auth-service

NODE_ENV=$(get_env NODE_ENV)
DB_HOST=$(get_env DB_HOST)
DB_NAME=$(get_env DB_NAME)
DB_PASSWORD=$(get_env DB_PASSWORD)
DB_USER=$(get_env DB_USER)
HOST=$(get_env HOST)
PORT=$(get_env PORT)
CORS_ORIGIN=$(get_env CORS_ORIGIN)
CORS_HEADERS=$(get_env CORS_HEADERS)
CORS_METHODS=$(get_env CORS_METHODS)
JWT_TTL=$(get_env JWT_TTL)
JWT_SECRET=$(get_env JWT_SECRET)
JWT_AUD=$(get_env JWT_AUD)

gcloud compute ssh auth-service \
  --zone europe-west10-c \
  --project market-place-489716 \
  --command "
    gcloud auth configure-docker europe-west10-docker.pkg.dev --quiet

    docker pull $DOCKER_IMAGE_NAME:$GITHUB_SHA

    docker stop auth-service || true
    docker rm auth-service || true
    docker run -d --name auth-service -p 3000:3000 --network host \
      -e NODE_ENV=$NODE_ENV \
      -e DB_HOST=$DB_HOST \
      -e DB_NAME=$DB_NAME \
      -e DB_USER=$DB_USER \
      -e DB_PASSWORD=$DB_PASSWORD \
      -e HOST=$HOST \
      -e PORT=$PORT \
      -e CORS_ORIGIN=$CORS_ORIGIN \
      -e CORS_HEADERS=$CORS_HEADERS \
      -e CORS_METHODS=$CORS_METHODS \
      -e JWT_TTL=$JWT_TTL \
      -e JWT_SECRET=$JWT_SECRET \
      -e JWT_AUD=$JWT_AUD \
      $DOCKER_IMAGE_NAME:$GITHUB_SHA
  "
