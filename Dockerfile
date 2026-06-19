# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
RUN npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 30000 && npm install
COPY . .
RUN npm run build

# Run stage
FROM node:20
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/firebase-applet-config.json ./firebase-applet-config.json

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/server.cjs"]
