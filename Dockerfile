FROM node:22-alpine AS builder
WORKDIR /app
COPY apps/dashboard ./apps/dashboard
WORKDIR /app/apps/dashboard
RUN npm set progress=false
RUN npm install
RUN npm run build

FROM node:22-alpine
WORKDIR /app/apps/api
COPY apps/api/package*.json ./
RUN npm install
COPY apps/api ./
COPY --from=builder /app/apps/dashboard/dist /app/apps/dashboard/dist
EXPOSE 3000
CMD ["npm", "start"]