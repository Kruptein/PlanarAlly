################################
# Build stage for the frontend #
################################
FROM node:20-alpine as BUILDER

# Install additional dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/admin-client

# Copy first package.json so changes in code dont require to reinstall all npm modules
COPY admin-client/package.json admin-client/package-lock.json ./
RUN npm i && npm cache clean --force;

WORKDIR /usr/src/client

# Copy first package.json so changes in code dont require to reinstall all npm modules
COPY client/package.json client/package-lock.json ./
RUN npm i && npm cache clean --force;

ARG PA_BASEPATH="/"

COPY . /usr/src

WORKDIR /usr/src/admin-client

RUN npm run build

WORKDIR /usr/src/client

RUN npm run build

# Added here to avoid an extra layer in the final stage
COPY Dockerfiles/server_config_docker.cfg /usr/src/server/server_config.cfg

###############
# Final stage #
###############
FROM python:3.11-slim

ARG DOCKER_TAG
ARG SOURCE_COMMIT

LABEL maintainer="Kruptein <info@darragh.dev>"

EXPOSE 8000

WORKDIR /planarally

RUN mkdir -p /planarally/data /planarally/static/assets && chown -R 9000:9000 /planarally
VOLUME /planarally/data
VOLUME /planarally/static/assets

ENV PA_GIT_INFO docker:${DOCKER_TAG}-${SOURCE_COMMIT}

RUN apt-get update && apt-get install --no-install-recommends dumb-init curl libffi-dev libssl-dev gcc -y && \
    rm -rf /var/lib/apt/lists/*

# Copy first requirements.txt so changes in code dont require to reinstall python requirements
COPY --from=BUILDER --chown=9000:9000 /usr/src/server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the final server files
COPY --from=BUILDER --chown=9000:9000 /usr/src/server/ .

USER 9000

ARG PA_BASEPATH="/"
ENV PA_BASEPATH=$PA_BASEPATH

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD [ "python", "-u", "planarally.py"]
