FROM node:18-alpine
WORKDIR /usr/src/app
# Tận dụng user node có sẵn
COPY --chown=node:node lab-otp.js .
RUN npm install express body-parser
USER node 
EXPOSE 3000
CMD ["node", "lab-otp.js"]
