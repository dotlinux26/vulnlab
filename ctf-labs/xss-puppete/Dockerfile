FROM node:18-slim

# 1. Cài trực tiếp Chromium và Tini (Siêu nhanh)
RUN apt-get update && apt-get install -y \
    chromium \
    procps tini \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN chown -R node:node /app

COPY --chown=node:node package*.json ./

USER node

# 2. Không cần biến môi trường SKIP_CHROMIUM nữa vì đã dùng puppeteer-core
RUN npm install --only=production --prefer-offline --no-audit

COPY --chown=node:node . .

EXPOSE 7004

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "node server.js & node bot.js"]
