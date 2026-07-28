# ponytail: build static PWA, serve with nginx + runtime API proxy
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV API_UPSTREAM=http://host.docker.internal:2785
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
