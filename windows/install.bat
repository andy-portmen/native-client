@echo off

SET PATH=C:\Windows\System32;%PATH%

IF EXIST "%~dp0\app\install.js" (GOTO :EXISTING) ELSE GOTO :MISSING

:EXISTING
  ECHO .. Writting to Chrome Registry
  ECHO .. Key: HKCU\Software\Google\Chrome\NativeMessagingHosts\com.add0n.node
  REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%LocalAPPData%\com.add0n.node\manifest-chrome.json" /f

  ECHO .. Writting to Chromium Registry
  ECHO .. Key: HKCU\Software\Chromium\NativeMessagingHosts\com.add0n.node
  REG ADD "HKCU\Software\Chromium\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%LocalAPPData%\com.add0n.node\manifest-chrome.json" /f

  ECHO .. Writting to Edge Registry
  ECHO .. Key: HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.add0n.node
  REG ADD "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%LocalAPPData%\com.add0n.node\manifest-chrome.json" /f

  ECHO .. Writting to Firefox Registry
  ECHO .. Key: HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\com.add0n.node
  FOR %%f in ("%LocalAPPData%") do SET SHORT_PATH=%%~sf
  REG ADD "HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%SHORT_PATH%\com.add0n.node\manifest-firefox.json" /f

  ECHO .. Writting to Waterfox Registry
  ECHO .. Key: HKCU\SOFTWARE\Waterfox\NativeMessagingHosts\com.add0n.node
  REG ADD "HKCU\SOFTWARE\Waterfox\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%SHORT_PATH%\com.add0n.node\manifest-firefox.json" /f

  ECHO .. Writting to Thunderbird Registry
  ECHO .. Key: HKCU\SOFTWARE\Thunderbird\NativeMessagingHosts\com.add0n.node
  REG ADD "HKCU\SOFTWARE\Thunderbird\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%SHORT_PATH%\com.add0n.node\manifest-firefox.json" /f

  pushd "%~dp0"
  CD app

  IF "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    ..\node\x64\node.exe install.js "%LocalAPPData%"
  ) ELSE (
    ..\node\x86\node.exe install.js "%LocalAPPData%"
  )

  GOTO :COMMON

:MISSING
  ECHO To run the installer, please first unzip the archive

:COMMON
  PAUSE
