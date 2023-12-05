FROM node:18-alpine as build
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add build-base gcc autoconf automake zlib-dev libpng-dev vips-dev && rm -rf /var/cache/apk/* > /dev/null 2>&1
WORKDIR /opt/
COPY ./package.json ./yarn.lock ./.yarnrc.yml ./
ENV PATH /opt/node_modules/.bin:$PATH
RUN yarn install --production
WORKDIR /opt/app
COPY ./ .
RUN yarn run build


FROM node:18-alpine
# Installing libvips-dev for sharp Compatibility
RUN apk add vips-dev
RUN rm -rf /var/cache/apk/*
WORKDIR /opt/app
COPY --from=build /opt/node_modules ./node_modules
ENV PATH /opt/node_modules/.bin:$PATH
COPY --from=build /opt/app ./
EXPOSE 1337
CMD ["yarn","start"]
