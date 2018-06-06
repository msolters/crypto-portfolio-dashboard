# Build + bundle the meteor app
FROM node:8.11.2-jessie

# Bundle Meteor app
RUN useradd -ms /bin/bash meteor
COPY ./app /home/meteor/app
RUN chown -R meteor:meteor /home/meteor
USER meteor
WORKDIR /home/meteor
RUN curl -s https://install.meteor.com/ | sh
RUN echo "PATH=\"\$PATH:\$HOME/.meteor\"" >> ~/.profile
ENV PATH="${PATH}:/home/meteor/.meteor"
WORKDIR /home/meteor/app
RUN ["/bin/bash", "-c", "meteor npm install"]
RUN ["/bin/bash", "-c", "meteor build --directory ~/build --architecture os.linux.x86_64 --server-only"]
RUN rm -rf /home/meteor/app

# npm install Meteor bundle
WORKDIR /home/meteor/build/bundle/programs/server
RUN ["/bin/bash", "-c", "meteor npm install --production"]

FROM node:8.11.2-jessie
COPY --from=0 /home/meteor/build /build

# configure environment
WORKDIR /build/bundle
ENV PORT=8080
ENV ROOT_URL=https://www.cryptometry.io
EXPOSE 8080

# Create Entrypoint
USER root
CMD ["/bin/bash", "-c", "node ./main.js"]
#CMD ["sleep", "infinity"]
