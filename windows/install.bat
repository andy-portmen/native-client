@echo off

ECHO .. Writting to Chrome Registry
ECHO .. Key: HKCU\Software\Google\Chrome\NativeMessagingHosts\com.add0n.node
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%USERPROFILE%\Local Settings\Application Data\com.add0n.node\manifest-chrome.json" /f

ECHO .. Writting to Firefox Registry
ECHO .. Key: HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\com.add0n.node
FOR %%f in ("%USERPROFILE%\Local Settings\Application Data") do SET SHORT_PATH=%%~sf
REG ADD "HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%SHORT_PATH%\com.add0n.node\manifest-firefox.json" /f

pushd "%~dp0"
CD app

IF "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
  ..\node\x64\node.exe install.js "%USERPROFILE%\Local Settings\Application Data"
) ELSE (
  ..\node\x86\node.exe install.js "%USERPROFILE%\Local Settings\Application Data"
)

PAUSE
