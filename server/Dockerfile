FROM public.ecr.aws/docker/library/node:22-bookworm-slim AS react-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
ARG BITGOLD_BUILD_SHA=unknown
ENV BITGOLD_BUILD_SHA=${BITGOLD_BUILD_SHA}
ENV VITE_BASE_PATH=/
RUN npm run build

FROM public.ecr.aws/docker/library/node:22-bookworm-slim
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server/src ./src
COPY server/public ./public
COPY --from=react-build /frontend/dist ./react-app
ENV NODE_ENV=production
ENV FRONTEND_MODE=react
EXPOSE 3000
CMD ["node","src/index.js"]
