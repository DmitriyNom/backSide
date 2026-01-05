# Используем официальный образ Node.js версии 22
FROM node:22

# Устанавливаем ffmpeg для обработки видео (генерация превью)
RUN apt-get update && apt-get install -y \
   ffmpeg \
   python3 \
   make \
   g++ \
   && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости (включая devDependencies для разработки)
RUN npm install

# Копируем весь код проекта в контейнер
COPY . .

# Открываем порт 5000
EXPOSE 5000

# Команда запуска
CMD ["npm", "start"]