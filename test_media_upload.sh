#!/bin/bash
set -e

echo "=== ТЕСТ ЗАГРУЗКИ МЕДИА ==="

# 1. Создаем тестовый файл
echo "1. Создаю тестовый файл..."
echo "This is a test file for media upload" > test-upload.txt

# 2. Регистрируем пользователя (если нужно)
echo "2. Регистрация пользователя..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mediatest_'$(date +%s)'@test.com",
    "password": "password123",
    "username": "mediatester"
  }')

echo "Регистрация: $REGISTER_RESPONSE"

# 3. Логинимся
echo "3. Логин..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mediatest_'$(date +%s -1)'@test.com",
    "password": "password123"
  }' \
  -c cookies.txt)

echo "Логин: $LOGIN_RESPONSE"

# 4. Получаем upload URL
echo "4. Получаем upload URL..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:5000/api/media/upload-request \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "filename": "test-upload.txt",
    "fileType": "photo",
    "mimeType": "text/plain",
    "size": 37,
    "isPublic": true
  }')

echo "Upload response: $UPLOAD_RESPONSE"

# 5. Извлекаем URL и mediaId
UPLOAD_URL=$(echo $UPLOAD_RESPONSE | grep -o '"uploadUrl":"[^"]*"' | cut -d'"' -f4)
MEDIA_ID=$(echo $UPLOAD_RESPONSE | grep -o '"mediaId":"[^"]*"' | cut -d'"' -f4)

echo "Upload URL: $UPLOAD_URL"
echo "Media ID: $MEDIA_ID"

# 6. Загружаем файл напрямую в MinIO
echo "6. Загружаем файл в MinIO..."
curl -v -X PUT "$UPLOAD_URL" \
  -H "Content-Type: text/plain" \
  --data-binary "@test-upload.txt"

# 7. Подтверждаем загрузку
echo "7. Подтверждаем загрузку..."
CONFIRM_RESPONSE=$(curl -s -X POST http://localhost:5000/api/media/confirm \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{\"mediaId\":\"$MEDIA_ID\"}")

echo "Confirm: $CONFIRM_RESPONSE"

# 8. Проверяем список медиа
echo "8. Проверяем список медиа..."
MEDIA_LIST=$(curl -s -X GET http://localhost:5000/api/media/my \
  -b cookies.txt)

echo "Media list: $MEDIA_LIST"

echo "=== ТЕСТ ЗАВЕРШЕН ==="
