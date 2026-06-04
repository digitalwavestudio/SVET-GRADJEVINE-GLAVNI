# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run stage
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/firebase-applet-config.json ./firebase-applet-config.json

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/server.cjs"]
