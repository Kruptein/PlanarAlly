################################
# Build stage for the frontend #
################################
FROM node:24-alpine as BUILDER

# Install additional dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/client

# Copy first package.json so changes in code dont require to reinstall all npm modules
COPY client/package.json client/package-lock.json ./
RUN npm ci && npm cache clean --force;

ARG PA_BASEPATH="/"

COPY . /usr/src

RUN npm run build

###############
# Final stage #
###############
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

ARG DOCKER_TAG
ARG SOURCE_COMMIT

LABEL maintainer="Kruptein <info@darragh.dev>"

EXPOSE 8000

WORKDIR /planarally

RUN mkdir -p /planarally/data /planarally/static/assets /planarally/static/mods && chown -R 9000:9000 /planarally
VOLUME /planarally/data
VOLUME /planarally/static/assets
VOLUME /planarally/static/mods

ENV PA_GIT_INFO docker:${DOCKER_TAG}-${SOURCE_COMMIT}
ENV PYTHONUNBUFFERED=1
ENV UV_CACHE_DIR /planarally/.uv
# This is only done to ensure that the mail lib does not crash :4
ENV USERNAME=planarally 

RUN apt-get update && apt-get install --no-install-recommends dumb-init curl libffi-dev libssl-dev gcc -y && \
    rm -rf /var/lib/apt/lists/*

USER 9000

# Copy UV files so changes in code dont require to reinstall python requirements
COPY --from=BUILDER --chown=9000:9000 --chmod=755 /usr/src/server/pyproject.toml /usr/src/server/uv.lock .
RUN uv sync --frozen --no-cache

# Copy the final server files
COPY --from=BUILDER --chown=9000:9000 /usr/src/server/ .

ARG PA_BASEPATH="/"
ENV PA_BASEPATH=$PA_BASEPATH

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD [ "uv", "run", "planarally.py"]
