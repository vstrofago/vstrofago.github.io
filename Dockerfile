# Local playground for the landing. Two targets:
#   dev   → astro dev with hot reload (the source is mounted from the host by compose.yaml)
#   serve → the static build, served by nginx exactly as GitHub Pages would
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS dev
COPY . .
EXPOSE 4321
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4321"]

FROM deps AS build
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS serve
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
