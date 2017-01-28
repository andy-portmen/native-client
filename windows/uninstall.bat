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

echo .. Deleting Chrome Registry
REG DELETE "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.add0n.node" /f

echo .. Deleting Firefox Registry
for %%f in ("%PROGRAMFILES%") do SET SHORT_PATH=%%~sf
REG DELETE "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\com.add0n.node" /f

echo .. Deleting com.add0n.node
RMDIR /Q /S "%ProgramFiles%\com.add0n.node"

echo.
echo ^>^>^> Done! ^<^<^<
echo.
pause

