@echo off
setlocal

REM URL для скачивания новой версии расширения
set DOWNLOAD_URL=http://10.2.3.53:8097/helpuni.zip
REM Путь к текущей директории расширения
set EXTENSION_DIR=C:\
set INSTALL_DIR=C:\helpuni\
REM Временный файл для скачивания
set TEMP_ZIP=helpuni.zip

echo Удаление старых файлов...
rmdir /S /Q %EXTENSION_DIR%


echo Скачивание новой версии расширения...
curl -o %TEMP_ZIP% %DOWNLOAD_URL%

echo Распаковка новой версии...
tar -xf %TEMP_ZIP% -C %EXTENSION_DIR%

echo Обновление завершено. Перезапустите браузер для применения изменений.
del %TEMP_ZIP%

endlocal