FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

RUN addgroup -S app && adduser --system -G app app

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && \
    rm -rf /root/.npm

COPY src/ /app/
COPY flag.txt /flag.txt

RUN chown -R app:app /app && \
    chmod 444 /flag.txt

USER app
EXPOSE 3000
CMD ["node", "index.js"]