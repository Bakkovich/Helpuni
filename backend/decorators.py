import os
from functools import wraps
import asyncio

def save_to_html(func):
    @wraps(func)
    async def wrapper(*args):
        if not os.path.exists("./response"):
            os.makedirs("./response")
        
        # Определяем путь к файлу
        file_path = os.path.join(f"./response/{func.__name__}_{args[0]}.html")
        
        # Проверяем, существует ли файл
        if os.path.exists(file_path):
            print(f"Файл {file_path} уже существует.")
            with open(file_path, "r") as result_file:
                content = result_file.read()
                # Извлекаем данные func_result из содержимого файла
                func_result = extract_func_result(content)
            return {"link": f"http://10.2.3.53:8097/response/{os.path.basename(file_path)}", "func_result": func_result}
        
        # Вызов оригинальной асинхронной функции и получение её результата
        func_result = await func(*args)
        
        # Проверка результата функции
        if not func_result:
            func_result = "Функция не вернула данных"

        # Открытие файла для записи HTML
        with open(file_path, "w") as result_file:
            html_template = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Calllog Response</title>
              <script src="libs/ansi_up.js"></script>
              <style>
                body {{color: #CCCCCC; background-color: #0C0C0C;}}
                pre {{ white-space: pre-wrap; font-size:12px; font-family: 'Cascadia Mono', 'Cascadia Code', Consolas, monospace;}}
                .loader {{
                border: 15px solid #f3f3f3;
                border-top: 15px solid #9370DB;
                border-radius: 50%;
                width: 140px;
                height: 140px;
                animation: spin 1s linear infinite;
                margin: 20% auto;
                }}
                @keyframes spin {{
                0% {{ transform: rotate(0deg); }}
                100% {{ transform: rotate(360deg); }}
                }}
              </style>
            </head>
            <body>
              <h1>Response </h1>
              <pre id="response">{func_result}</pre>
              <script src="./script.js"></script>
            </body>
            </html>
            """
            result_file.write(html_template)
        
        # Возвращаем путь к файлу и данные func_result
        return {"link": f"http://10.2.3.53:8097/response/{os.path.basename(file_path)}", "func_result": func_result}
    return wrapper

def extract_func_result(content):
    # Пример функции для извлечения данных func_result из содержимого файла
    # Предполагается, что func_result находится между тегами <pre id="response"> и </pre>
    start_tag = '<pre id="response">'
    end_tag = '</pre>'
    start_index = content.find(start_tag) + len(start_tag)
    end_index = content.find(end_tag, start_index)
    return content[start_index:end_index].strip()