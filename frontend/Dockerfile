# Dev-only container for running/testing the frontend locally.
# NOT the production deploy image — see application-tracker/DECISIONS.md.

FROM node:22-slim

RUN corepack enable

WORKDIR /app
RUN chown node:node /app

USER node

COPY --chown=node:node package.json yarn.lock .yarnrc.yml ./
RUN yarn install

COPY --chown=node:node . .

EXPOSE 5173

CMD ["yarn", "dev"]
