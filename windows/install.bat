@echo off

pushd "%~dp0"
CD app

SET PATH=C:\Windows\System32;%PATH%

:: Set Node.js version and URL base
set NODE_VERSION=v18.20.5
set BASE_URL=https://nodejs.org/download/release/%NODE_VERSION%/
set ARCHIVE_NAME=
set ARCHIVE_DIR=
set DEST_DIR=node
set TEMP_DIR=node

IF EXIST "%~dp0\app\install.js" (GOTO :EXISTING) ELSE GOTO :MISSING

:EXISTING
  :: Create temp directory
  if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"
  :: Determine architecture and set download file
  IF "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
      set ARCHIVE_NAME=node-%NODE_VERSION%-win-x64.zip
      set ARCHIVE_DIR=node-%NODE_VERSION%-win-x64
  ) ELSE (
      set ARCHIVE_NAME=node-%NODE_VERSION%-win-x86.zip
      set ARCHIVE_DIR=node-%NODE_VERSION%-win-x86
  )
  :: Download Node.js archive
  ECHO Downloading %BASE_URL%%ARCHIVE_NAME%...
  curl -o "%TEMP_DIR%\%ARCHIVE_NAME%" "%BASE_URL%%ARCHIVE_NAME%"
  if %ERRORLEVEL% NEQ 0 (
      ECHO Failed to download %ARCHIVE_NAME%.
      exit /b 1
  )
  :: Extract archive
  ECHO Extracting %ARCHIVE_NAME%...
  powershell -Command "Expand-Archive -Path '%TEMP_DIR%\%ARCHIVE_NAME%' -DestinationPath '%DEST_DIR%' -Force"
  if %ERRORLEVEL% NEQ 0 (
      ECHO Failed to extract %ARCHIVE_NAME%.
      exit /b 1
  )
  :: Run install.js
  ECHO Running install.js...
  "%DEST_DIR%\%ARCHIVE_DIR%\node.exe" install.js "%LocalAPPData%"
  if %ERRORLEVEL% NEQ 0 (
      ECHO Failed to run install.js.
      exit /b 1
  )
  :: Cleanup
  echo Cleaning up...
  rmdir /s /q "%TEMP_DIR%"

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

  GOTO :COMMON

:MISSING
  ECHO To run the installer, please first unzip the archive

:COMMON
  PAUSE
