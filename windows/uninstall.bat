@echo off

echo .. Deleting Chrome Registry
REG DELETE "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.add0n.node" /f

echo .. Deleting Chromium Registry
REG DELETE "HKEY_CURRENT_USER\Software\Chromium\NativeMessagingHosts\com.add0n.node" /f

echo .. Deleting Microsoft Edge Registry
REG DELETE "HKEY_CURRENT_USER\Software\Microsoft\Edge\NativeMessagingHosts\com.add0n.node" /f

echo .. Deleting Firefox Registry
REG DELETE "HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\com.add0n.node" /f

echo .. Deleting Waterfox Registry
REG DELETE "HKCU\SOFTWARE\Waterfox\NativeMessagingHosts\com.add0n.node" /f

echo .. Deleting Thunderbird Registry
REG DELETE "HKCU\SOFTWARE\Thunderbird\NativeMessagingHosts\com.add0n.node" /f

echo .. Deleting com.add0n.node
RMDIR /Q /S "%LocalAPPData%\com.add0n.node"

echo.
echo ^>^>^> Done! ^<^<^<
echo.
pause

