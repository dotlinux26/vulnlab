FROM php:8.2-apache

# Ẩn version server (bài học phòng thủ: dev nên làm vậy) — nhưng app vẫn để lộ X-Powered-By
RUN echo "ServerTokens Prod" >> /etc/apache2/apache2.conf

RUN rm -f /usr/bin/sudo /usr/bin/su /bin/su /usr/bin/passwd

COPY src/ /var/www/html/
COPY flag.txt /flag.txt

RUN chown -R root:root /var/www/html/ && \
    find /var/www/html -type d -exec chmod 755 {} \; && \
    find /var/www/html -type f -exec chmod 644 {} \; && \
    chmod 444 /flag.txt

EXPOSE 80
CMD ["apache2-foreground"]
