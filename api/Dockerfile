# Dev-only container for running/testing the api locally.
# NOT the production deploy image — that's still an open decision
# (see application-tracker/DECISIONS.md, "Still open" > Deploy).

FROM node:22-slim

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "start:dev"]
