# Dev-only container for running/testing the api locally.
# See api/Dockerfile.prod for the production deploy image.

FROM node:22-slim

WORKDIR /app

RUN corepack enable

RUN apt-get update -y && apt-get install -y openssl git && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "start:dev"]
