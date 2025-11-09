FROM docker.io/library/nginx:stable-alpine

# Copy certs
COPY server/certs/server.crt /etc/nginx/ssl/server.crt
COPY server/certs/server.key /etc/nginx/ssl/server.key

# Copy custom config
COPY server/config/nginx.conf /etc/nginx/conf.d/default.conf

# Copy web content
COPY server/www /usr/share/nginx/html

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]

