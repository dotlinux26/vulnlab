FROM node:18-alpine

# 1. Cài tini để quản lý tiến trình bền bỉ, không lo zombie process
RUN apk add --no-cache tini

WORKDIR /usr/src/app

# 2. Tạo 'giáp' cho file lab: Giao cho root nắm giữ
# Nhưng cho phép user 'node' (quyền thường) được thực thi
COPY lab.js .
RUN chown root:root lab.js && chmod 644 lab.js

# 3. Cài đặt thư viện trực tiếp
RUN npm install express jsonwebtoken cookie-parser

# 4. TƯỚC QUYỀN ROOT: Ép container chạy bằng user 'node' có sẵn
USER node

# 5. Dùng tini làm lớp đệm khởi động
ENTRYPOINT ["/sbin/tini", "--"]

EXPOSE 3000

CMD ["node", "lab.js"]
