@echo off

call :isAdmin

if %errorlevel% == 0 (
    goto :run
) else (
    echo .
    echo .
    echo ************ERROR*****************
    echo *******Run as administrator*******
    echo **********************************
    echo .
    echo .
    pause
)

exit /b

:isAdmin
fsutil dirty query %systemdrive% >nul
exit /b

:run

copy
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%ProgramFiles%\com.add0n.node\manifest-chrome.json" /f

for %%f in ("%PROGRAMFILES%") do SET SHORT_PATH=%%~sf
REG ADD "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%SHORT_PATH%\com.add0n.node\manifest-firefox.json" /f

pushd "%~dp0"
cd app
..\node.exe install.js "%ProgramFiles%"

pause
