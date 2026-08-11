FROM php:8.2-apache

RUN rm -f /usr/bin/sudo /usr/bin/su /bin/su /usr/bin/passwd && \
    apt-get update && \
    apt-get install -y --no-install-recommends iputils-ping && \
    rm -rf /var/lib/apt/lists/*

RUN addgroup -S app && adduser -S app -G app && \
    chown -R app:app /var/www/html/ && \
    find /var/www/html -type d -exec chmod 755 {} \; && \
    find /var/www/html -type f -exec chmod 644 {} \; && \
    chmod 444 /flag.txt

USER app

COPY src/ /var/www/html/
COPY flag.txt /flag.txt

EXPOSE 80
CMD ["apache2-foreground"]
