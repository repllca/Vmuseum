FROM node:20-alpine

WORKDIR /usr/share/nginx/html
COPY index.html .
COPY *.js ./
COPY exhibits ./exhibits
COPY ui ./ui

EXPOSE 8080
CMD ["npx", "http-server", "-p", "8080"]
