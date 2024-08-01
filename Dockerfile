FROM node:18-alpine

WORKDIR /app

RUN corepack enable pnpm

COPY package.json .

RUN pnpm install

COPY . .

RUN pnpm run build

EXPOSE 3000
EXPOSE 5173


CMD [ "pnpm", "run", "serve" ]
