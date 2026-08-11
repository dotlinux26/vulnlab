FROM php:8.2-apache

RUN rm -f /usr/bin/sudo /usr/bin/su /bin/su /usr/bin/passwd && \
    apt-get update && \
    apt-get install -y --no-install-recommends iputils-ping && \
    rm -rf /var/lib/apt/lists/*

# Setup www-data user permissions (like lfi-poison-lab)
RUN chown -R root:root /var/www/html/ && \
    find /var/www/html -type d -exec chmod 755 {} \; && \
    find /var/www/html -type f -exec chmod 644 {} \; && \
    chmod 444 /flag.txt

# Create writable directories for Apache
RUN mkdir -p /var/run/apache2 /var/log/apache2 /tmp && \
    chown -R www-data:www-data /var/run/apache2 /var/log/apache2 /tmp

COPY src/ /var/www/html/
COPY flag.txt /flag.txt

EXPOSE 80
CMD ["apache2-foreground"]
