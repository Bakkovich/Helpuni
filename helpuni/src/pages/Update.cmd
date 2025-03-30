chcp 65001 > nul
setlocal enabledelayedexpansion
set SCRIPT_PATH=%~dp0

:: URL для скачивания обновления
set UPDATE_URL=http://10.2.3.53:8097/helpuni.zip


:: Путь к папке расширения
set EXTENSION_PATH=C:\helpuni
set EXTENSION_PATH2=C:\
:: Временная папка для загрузки обновления
set TEMP_DIR=%TEMP%\chrome_extension_update
set ZIP_FILE=%TEMP_DIR%\helpuni.zip

:: Создаем временную папку
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

:: Скачиваем новый ZIP файл
echo Скачивание новой версии расширения...
powershell -Command "(New-Object System.Net.WebClient).DownloadFile('%UPDATE_URL%', '%ZIP_FILE%')"

:: Удаляем старые файлы расширения
echo Удаление старых файлов...
rmdir /s /q "%EXTENSION_PATH%"

:: Распаковываем ZIP файл
echo Применение обновления...
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('%ZIP_FILE%', '%EXTENSION_PATH2%')"

:: Удаляем временные файлы
echo Очистка временных файлов...
del "%ZIP_FILE%"
rmdir /s /q "%TEMP_DIR%"

:: Готово!
echo Обновление успешно применено.
pause