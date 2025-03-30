#!/bin/bash

# Проверка доступности сокета SSH-агента
if [ -z "$SSH_AUTH_SOCK" ]; then
    echo "SSH_AUTH_SOCK не установлен!"
    exit 1
fi
# Запуск основной команды
exec "$@"