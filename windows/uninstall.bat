@echo off

echo .. Deleting Chrome Registry
REG DELETE "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.add0n.node" /f

echo .. Deleting Firefox Registry
for %%f in ("%LocalAPPData%") do SET SHORT_PATH=%%~sf
REG DELETE "HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\com.add0n.node" /f

echo .. Deleting com.add0n.node
RMDIR /Q /S "%LocalAPPData%\com.add0n.node"

echo.
echo ^>^>^> Done! ^<^<^<
echo.
pause

