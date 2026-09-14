# Dev-only container for running/testing the frontend locally.
# NOT the production deploy image — see application-tracker/DECISIONS.md.

FROM node:22-slim

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install

COPY . .

EXPOSE 5173

CMD ["yarn", "dev"]
