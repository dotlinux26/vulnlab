FROM php:7.4-apache

# Cài đặt thêm các công cụ cần thiết cho máy chủ
RUN apt-get update && apt-get install -y nano

# 💡 FIX LỖI CHÍ MẠNG CỦA DOCKER KHI LÀM LAB LOG POISONING:
# Mặc định Docker map access.log ra /dev/stdout. Ta phải gỡ bỏ symlink này
# và tạo file vật lý, đồng thời cấp quyền 644 để PHP (www-data) có thể include nó.
RUN rm -f /var/log/apache2/access.log && \
    rm -f /var/log/apache2/error.log && \
    touch /var/log/apache2/access.log && \
    touch /var/log/apache2/error.log && \
    chown www-data:www-data /var/log/apache2/access.log && \
    chown www-data:www-data /var/log/apache2/error.log && \
    chmod 644 /var/log/apache2/access.log && \
    chmod 644 /var/log/apache2/error.log

# Copy Source Code và Flag vào Lồng kính
COPY src/ /var/www/html/
COPY flag_notlikeuthink.txt /flag_notlikeuthink.txt

# ==========================================
# THIẾT LẬP QUYỀN HẠN (HARDENING CONTAINER)
# Chống học viên xóa file Lab và tuyệt đường leo quyền Root!
# ==========================================

# 1. Tịch thu quyền sở hữu code: Giao toàn bộ code cho user 'root'
RUN chown -R root:root /var/www/html/

# 2. Khóa quyền Sửa/Xóa code: 
# Thư mục 755 (Chỉ root được thêm/xóa file, www-data chỉ được vào xem)
# File 644 (Chỉ root được sửa file, www-data chỉ được đọc)
RUN find /var/www/html -type d -exec chmod 755 {} \;
RUN find /var/www/html -type f -exec chmod 644 {} \;

# 3. Mở rào có kiểm soát cho file Access Log:
# Để Reset_log.php và LFI hoạt động, www-data PHẢI ghi được vào file access.log
# Thư mục cha /var/log/apache2 vẫn của root (755) => www-data KHÔNG THỂ XÓA file log, chỉ có thể Ghi đè (664).
RUN chmod 755 /var/log/apache2 && \
    chmod 664 /var/log/apache2/access.log

# 4. Cắt đứt đường leo quyền (Privilege Escalation):
# Xóa thẳng tay các lệnh nguy hiểm
RUN rm -f /usr/bin/sudo /usr/bin/su /bin/su /usr/bin/passwd

EXPOSE 80
CMD ["apache2-foreground"]
