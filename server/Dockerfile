FROM node:22-bookworm-slim
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev
COPY server/src ./server/src
COPY index.html app.js styles.css ./public/
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node","server/src/index.js"]
