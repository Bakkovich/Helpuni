$registryFile = "$PWD\registry.reg"
@(
    "Windows Registry Editor Version 5.00",
    "[HKEY_CURRENT_USER\SOFTWARE\Classes\WTHandler.URLHandler.1]",
    "[HKEY_CURRENT_USER\SOFTWARE\Classes\WTHandler.URLHandler.1\shell]",
    "[HKEY_CURRENT_USER\SOFTWARE\Classes\WTHandler.URLHandler.1\shell\open]",
    "[HKEY_CURRENT_USER\SOFTWARE\Classes\WTHandler.URLHandler.1\shell\open\command]",
    ('@="C:\\Users\\' + $env:USERNAME + '\\AppData\\Local\\Microsoft\\WindowsApps\\wt.exe ssh %1"' -replace "\r?\n", ""),
    "[HKEY_CURRENT_USER\SOFTWARE\WTHandler\Capabilities]",
    '"ApplicationDescription"="Windows Terminal SSH Protocol Handler"',
    '"ApplicationName"="Windows Terminal SSH Protocol Handler"',
    "[HKEY_CURRENT_USER\SOFTWARE\WTHandler\Capabilities\UrlAssociations]",
    '"ssh"="WTHandler.URLHandler.1"',
    '"ssh1"="WTHandler.URLHandler.1"',
    '"ssh2"="WTHandler.URLHandler.1"',
    "[HKEY_CURRENT_USER\SOFTWARE\RegisteredApplications]",
    '"Windows Terminal SSH Protocol Handler"="Software\\WTHandler\\Capabilities"',
    "[HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\ApplicationAssociationToasts]",
    '"WTHandler.URLHandler.1_ssh"=dword:00000000'
) | Set-Content -Path $registryFile