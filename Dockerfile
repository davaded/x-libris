FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set dummy DATABASE_URL for prisma generate
ENV DATABASE_URL="postgresql://dummy:5432/mydb"
RUN npx prisma generate

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
