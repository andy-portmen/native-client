@echo off

echo .. Writting to Chrome Registry
echo .. Key: HKCU\Software\Google\Chrome\NativeMessagingHosts\com.add0n.node
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%LocalAPPData%\com.add0n.node\manifest-chrome.json" /f

echo .. Writting to Firefox Registry
echo .. Key: HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\com.add0n.node
for %%f in ("%LocalAPPData%") do SET SHORT_PATH=%%~sf
REG ADD "HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%SHORT_PATH%\com.add0n.node\manifest-firefox.json" /f

pushd "%~dp0"
cd app
..\node.exe install.js "%LocalAPPData%"

pause
