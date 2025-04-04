@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
set SCRIPT_PATH=%~dp0

:: Проверка, запущен ли скрипт с правами администратора
NET SESSION >nul 2>&1
if %errorlevel% neq 0 (
    echo Запустите этот скрипт от имени администратора.
    pause
    exit /b
)

:: Установка Windows Terminal, если он не установлен
powershell -Command "if (-not (Get-Command wt -ErrorAction SilentlyContinue)) { winget install --id Microsoft.WindowsTerminal -e }"

:: Проверка, установлен ли OpenSSH, и если нет, установка
powershell -Command "if (-not (Get-WindowsCapability -Online | Where-Object { $_.Name -like 'OpenSSH*' -and $_.State -eq 'Installed' })) { Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0 }"

:: Проверка наличия ssh-add
where ssh-add >nul 2>&1
if errorlevel 1 (
    echo ssh-add не установлен. Установка OpenSSH Client...
    powershell -Command "Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"
)

:: Создание директории .ssh, если она не существует
if not exist "%USERPROFILE%\.ssh" (
    mkdir "%USERPROFILE%\.ssh"
    echo Директория .ssh создана.
)

:: Проверка, запущена ли служба ssh-agent
sc query ssh-agent | find /i "RUNNING" > nul
if errorlevel 1 (
    :: Служба ssh-agent не запущена, запуск
    powershell -Command "Get-Service -Name ssh-agent | Set-Service -StartupType Automatic"
    powershell -Command "Start-Service ssh-agent"
) else (
    :: Служба ssh-agent запущена, изменение типа запуска на автоматический
    powershell -Command "Set-Service -Name ssh-agent -StartupType Automatic"
)

:: Установка пользователя
set /p setuser=Введите логин из termius:

:: Создание файла конфигурации
(
    echo Host *
    echo     User %setuser%
    echo     PubkeyAcceptedKeyTypes=+ssh-rsa
    echo     HostKeyAlgorithms=+ssh-rsa
    echo     ForwardAgent yes
    echo     StrictHostKeyChecking no
    echo.
    echo Host 10.81.0.*
    echo     ProxyJump voip.uz.sipuni.com
) > "%USERPROFILE%\.ssh\config"

:: Проверка существования файла id_rsa
if not exist "%USERPROFILE%\id_rsa" (
    echo Файл id_rsa не найден. Создание нового файла...
    echo. > "%USERPROFILE%\.ssh\id_rsa"
)
:: Открытие Notepad для ввода ключа
set "keyfile=%USERPROFILE%\.ssh\id_rsa"
notepad "%keyfile%"

set "conf=%USERPROFILE%\.ssh\config"

:: Установка разрешений на файл conf
echo Установка прав доступа для файла conf...
icacls "%conf%" /inheritance:r >nul 2>&1
icacls "%conf%" /grant "%username%:F" >nul 2>&1
icacls "%conf%" /remove "Users" >nul 2>&1
icacls "%conf%" /remove "Authenticated Users" >nul 2>&1
icacls "%conf%" /remove "Administrators" >nul 2>&1

:: Установка разрешений на файл ключа
echo Установка прав доступа для файла ключа...
icacls "%keyfile%" /inheritance:r >nul 2>&1
icacls "%keyfile%" /grant "%username%:F" >nul 2>&1
icacls "%keyfile%" /remove "Users" >nul 2>&1
icacls "%keyfile%" /remove "Authenticated Users" >nul 2>&1
icacls "%keyfile%" /remove "Administrators" >nul 2>&1

:: Добавление ключа в ssh-agent
ssh-add "%keyfile%"
powershell -Command "Set-ExecutionPolicy unrestricted"

:: Устанавливаем временную политику выполнения
powershell -Command "Set-ExecutionPolicy Unrestricted -Scope Process -Force"

:: Выполняем genreg.ps1
powershell -File "%SCRIPT_PATH%genreg.ps1"

:: Проверяем статус выполнения скрипта
if %errorlevel% neq 0 (
    echo Ошибка при выполнении genreg.ps1
    exit /b %errorlevel%
)

echo Все операции успешно выполнены!


pause