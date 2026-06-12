FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY app.js /usr/share/nginx/html/app.js
COPY v2.css /usr/share/nginx/html/v2.css
COPY v2.js /usr/share/nginx/html/v2.js
COPY solutions.html /usr/share/nginx/html/solutions.html
COPY assets /usr/share/nginx/html/assets
COPY solutions /usr/share/nginx/html/solutions
COPY products /usr/share/nginx/html/products

EXPOSE 8080
