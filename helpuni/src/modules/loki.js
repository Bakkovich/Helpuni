export default function logToLoki(message, level = 'info') {
    const logEntry = {
        streams: [
            {
                stream: {
                    app: 'chrome-extension',
                    level: level,
                },
                values: [
                    [
                        (Date.now() * 1e6).toString(), // Текущее время в наносекундах
                        JSON.stringify({ message: message }),
                    ],
                ],
            },
        ],
    };

    fetch('http://10.2.3.53:3100/loki/api/v1/push', 
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
    })
    .then(response => {
        if (!response.ok) {
            console.error('Не удалось отправить запрос в Loki:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Ошибка при отправке лога в Loki:', error);
    });
}

// Пример использования logToLoki('User clicked on button', 'info'); const logEntry = {