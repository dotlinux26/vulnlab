FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends bash curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY src/package.json src/package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY src/ .

# Master flag (traditional location)
COPY flag.txt /flag.txt

# Split flags by attack height — no central vault:
#  - /app/.state/<md5>.txt         : emission-only flags (hashed names, unguessable)
#  - /app/flags/c10.txt        : file-read exercise target (XXE/deser/SSTI/cmdi)
#  - /app/config/session-store.key : SSTI reward (pointer leaked in /.backup notes)
#  - /app/data/state-snapshot.dat  : deser reward (pointer in serializer spec)
#  - /opt/scripts/netdiag.secret   : cmdi reward (pointer on /debug panel)
#  - /flag.txt                     : master (RCE proof)
RUN mkdir -p /app/.state /app/config /app/data /opt/scripts \
    && cd /app/flags \
    && for f in *.txt; do h=$(printf '%s' "${f%.txt}" | md5sum | cut -d' ' -f1); cp "$f" "/app/.state/$h.txt"; done \
    && find /app/flags -name '*.txt' ! -name 'c10.txt' -delete \
    && cp "$(printf '%s' c11 | md5sum | cut -d' ' -f1 | sed 's|^|/app/.state/|;s|$|.txt|')" /opt/scripts/netdiag.secret \
    && cp "$(printf '%s' c12 | md5sum | cut -d' ' -f1 | sed 's|^|/app/.state/|;s|$|.txt|')" /app/config/session-store.key \
    && cp "$(printf '%s' c13 | md5sum | cut -d' ' -f1 | sed 's|^|/app/.state/|;s|$|.txt|')" /app/data/state-snapshot.dat \
    && chmod -R a+rX /app /opt/scripts/netdiag.secret \
    && chmod 444 /flag.txt \
    && chown -R node:node /app

# Non-root: RCE trong lab khong len duoc root
USER node

EXPOSE 3000

CMD ["node", "app.js"]
