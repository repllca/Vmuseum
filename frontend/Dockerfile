FROM node:20-alpine

WORKDIR /usr/share/nginx/html
COPY . .

EXPOSE 8080
CMD ["npx", "http-server", "-p", "8080"]
