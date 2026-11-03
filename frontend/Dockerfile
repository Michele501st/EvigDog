FROM nginx:alpine

# Copia la configurazione custom di Nginx con Reverse Proxy per /api/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia i file statici del Frontend
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

