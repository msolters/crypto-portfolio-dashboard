FROM openresty/openresty:1.13.6.1-2-xenial

# Setup Auto-SSL
RUN luarocks install lua-resty-auto-ssl
RUN mkdir -p /etc/resty-auto-ssl

# Create nginx user with file system access to openresty dirs
RUN chown nobody -R /etc/resty-auto-ssl
RUN chown nobody -R /usr/local/openresty/nginx
# Ensure the nginx binary can bind to low ports even as a non-root user
RUN setcap CAP_NET_BIND_SERVICE=+eip /usr/local/openresty/nginx/sbin/nginx
COPY nginx.conf /usr/local/openresty/nginx/conf

# Generate a fallback self-signed certificate
# This is necessary just for nginx to start up!
RUN \
  openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
  -subj '/CN=sni-support-required-for-valid-ssl' \
  -keyout /etc/ssl/resty-auto-ssl-fallback.key \
  -out /etc/ssl/resty-auto-ssl-fallback.crt

EXPOSE 80
EXPOSE 443

CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
