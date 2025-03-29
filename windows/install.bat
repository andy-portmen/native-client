@echo off
@setlocal enabledelayedexpansion
@chcp 65001 >nul
:: ==============================================
:: Initialize
:: ==============================================
rem :CheckAdmin
:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Not running in privileged mode.
    echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Requesting elevated privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
echo.
echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Running in privileged mode.

rem :Initialize
cd /d "%~dp0" 
IF NOT EXIST "app\install.js" (
    echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Fatal] To run the installer, please first unzip the archive
    exit /b 1
)
SET PATH=%SystemRoot%\System32;%PATH%
set DEST_DIR=node
if not exist "node" mkdir "node" || exit /b 1
set TEMP_DIR=download
if not exist "download" mkdir "download" || exit /b 1
call :RunInstallJS
call :Cleanup
echo.
echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Info]Setup Complete.&pause>nul
:: ==============================================
:: Function Definitions
:: ==============================================
:: Check Operating System Version
:CheckOSVersion
for /f "tokens=2 delims=[]" %%a in ('ver') do (
	for /f "tokens=2-4 delims=. " %%b in ("%%a") do (
		set "ver=%%b%%c" 
		set "verbuild=%%d"
	)
)
if %ver% LSS 61 goto NotSupport
if %ver% EQU 61 set OS_Ver=7 && set "WIN7_COMPAT=1"
if %ver% EQU 62 set OS_Ver=8
if %ver% EQU 63 set OS_Ver=8.1
if %ver% EQU 100 (
    if %verbuild% LSS 22000 (
        set OS_Ver=10
    ) else (
        set OS_Ver=11
    )
)
:: Get PowerShell version
rem for /f "skip=3" %%a in ('powershell -Command "$PS_VersionTable.PS_Version.Major"') do ( set PS_Ver=%%a )
for /f "skip=3" %%a in ('powershell -Command "Get-Host | Select-Object Version"') do (
	for /f "tokens=1 delims=. " %%b in ("%%a") do (	set "PS_Ver=%%b" )
)
echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Windows %OS_Ver% and PowerShell %PS_Ver% .
exit /b 0
:: Check if archive exists, if yes, Extract it, if no, download it
:CheckAndDownload
call :CheckOSVersion
pushd %~dp0
if defined WIN7_COMPAT (
    :: The last version of nodejs that supports Windows 7 is v13.14.0
    set "NODE_VERSION=v13.14.0"
) else (
    set "NODE_VERSION=v18.20.5"
)

rem set "BASE_URL=https://nodejs.org/download/release/%NODE_VERSION%/"
set "BASE_URL=https://mirrors.aliyun.com/nodejs-release/%NODE_VERSION%/"
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set "ARCHIVE_NAME=node-%NODE_VERSION%-win-x64.zip"
    set "ARCHIVE_DIR=node-%NODE_VERSION%-win-x64"
) else (
    set "ARCHIVE_NAME=node-%NODE_VERSION%-win-x86.zip"
    set "ARCHIVE_DIR=node-%NODE_VERSION%-win-x86"
)
if EXIST %TEMP_DIR%\%ARCHIVE_NAME% (
    echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] ^Find local Node.js package: %TEMP_DIR%\%ARCHIVE_NAME%
    goto Extract
) else (
    goto Download
)
if %ERRORLEVEL% EQU 99 (
	exit /b 99
)
:: Download Node.js archive based on OS version and PowerShell version
:Download
echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] downloading %ARCHIVE_NAME%
if %OS_Ver% EQU 7 (
    :: For Windows 7 and PowerShell 2.0, download using BitsAdmin
    if !PS_Ver! EQU 2 (
		echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] PowerShell version is too low, using 'bitsadmin'...
		call :DownloadUsingBitsAdmin %BASE_URL%%ARCHIVE_NAME% %~dp0%TEMP_DIR%\%ARCHIVE_NAME%
    )
    :: For Windows 7 and PowerShell 3.0, download using PowerShell
    if !PS_Ver! GEQ 3 (
        echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] PowerShell version is 3.0, download using PowerShell
        call :DownloadFile %BASE_URL%%ARCHIVE_NAME% %~dp0%TEMP_DIR%\%ARCHIVE_NAME%
    ) 
) else (
    :: For Windows 8 and newer, download using PowerShell or curl
    echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Windows 8 and newer, download using PowerShell or curl
    call :DownloadFile %BASE_URL%%ARCHIVE_NAME% %~dp0%TEMP_DIR%\%ARCHIVE_NAME%
)
popd
echo %cd%
:: Download file using PowerShell 3.0 or newer, or curl if available
:DownloadFile
set FILE_URL=%1
set DEST_PATH=%2
:: Retry download up to 3 times if failed
set RETRY_COUNT=3
set DOWNLOAD_SUCCESS=false
for /l %%i in (1,1,%RETRY_COUNT%) do (
    if !PS_Ver! GEQ 3 (
		if exist "%SystemRoot%\System32\curl.exe" (
			curl -o "%DEST_PATH%" "%FILE_URL%"
		) else (
			powershell -Command "& {try {Start-BitsTransfer -Source '%FILE_URL%' -Destination '%DEST_PATH%'} catch {exit 1}}"
		)
	)
	if %ERRORLEVEL% EQU 0 (
        set DOWNLOAD_SUCCESS=true
        goto Extract
    )
)
if not %DOWNLOAD_SUCCESS% == true (
    echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Failed to download %ARCHIVE_NAME% after %RETRY_COUNT% attempts.
    exit /b 1
)
:: Download using bitsadmin for PowerShell 2.0 or below
:DownloadUsingBitsAdmin
where bitsadmin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] bitsadmin is not available. Exiting.
    exit /b 1
)
set FILE_URL=%1
set DEST_PATH=%2
:: Retry download up to 3 times if failed
set RETRY_COUNT=3
set DOWNLOAD_SUCCESS=false
for /l %%i in (1,1,%RETRY_COUNT%) do (
	start "Downloading" /wait bitsadmin /transfer "Downloading %ARCHIVE_NAME%..." "%FILE_URL%" "%DEST_PATH%"
	if %ERRORLEVEL% EQU 0 (
        set DOWNLOAD_SUCCESS=true
        goto CheckAndDownload
    )
)
if not %DOWNLOAD_SUCCESS% == true (
    echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Failed to download %ARCHIVE_NAME% after %RETRY_COUNT% attempts.
    exit /b 1
)
:: Extract downloaded archive using PowerShell
:Extract
echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Extracting %ARCHIVE_NAME%...
rem pushd %~dp0%TEMP_DIR%
if %OS_Ver% EQU 7 (   
    :: For Windows 7 and PowerShell 2.0 , try to using system command
    if !PS_Ver! EQU 2 (
		echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] PowerShell version is too low,PowerShell 2.0 does not have an Extract module.
		echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Try to find 7zip.
		set 7zip=""
		for /f "delims=" %%A in ('where.exe /r C:\ 7z.exe 2^>nul') do (
		    set 7zip=%%A
		    echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Found 7z.exe in:%%A		    
		)		
		if not !7zip! == "" (
			start "Extracting.." /wait /d %~dp0 "!7zip!" x "%TEMP_DIR%\%ARCHIVE_NAME%" -o"%DEST_DIR%" -aoa
			exit /b 0
		) 
		echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Not Found 7z.exe , try next.	
		echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Try to find WinRAR.
		set WinRAR=""
		for /f "delims=" %%A in ('where.exe /r C:\ WinRAR.exe 2^>nul') do (
		    set WinRAR=%%A
		    echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Found WinRAR.exe in:%%A		    
		)
		if not !WinRAR! == "" (
			start "Extracting.." /wait /d %~dp0 "!WinRAR!" x -r -o+ %TEMP_DIR%\%ARCHIVE_NAME% %DEST_DIR% -y 
			exit /b 0
		) else ( exit /b 99 )
		if %ERRORLEVEL% EQU 99 (
			exit /b 99
		)
	)
	if %ERRORLEVEL% EQU 99 (
		exit /b 99
	)	
	:: For Windows 7 and PowerShell 3.0 or higher, Using Expand-Archive
    if !PS_Ver! GEQ 3 (
        powershell -Command "& {try {Expand-Archive -Path '%TEMP_DIR%\%ARCHIVE_NAME%' -DestinationPath '%DEST_DIR%' -Force} catch {exit 1}}"
        if %ERRORLEVEL% NEQ 0 (
			echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Failed to Extract %ARCHIVE_NAME%.
			exit /b 1
		)
    )     
) else (
	:: For Windows 8 or higher, Using Expand-Archive
	powershell -Command "& {try {Expand-Archive -Path '%TEMP_DIR%\%ARCHIVE_NAME%' -DestinationPath '%DEST_DIR%' -Force} catch {exit 1}}"
	if %ERRORLEVEL% NEQ 0 (
		echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Failed to Extract %ARCHIVE_NAME%.
		exit /b 1
	)
)
if %ERRORLEVEL% EQU 99 (
	exit /b 99
)
:: Run Node.js installation script
:RunInstallJS
call :CheckAndDownload
if %ERRORLEVEL% EQU 99 ( goto end )
echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Running install.js...
pushd %~dp0app
"%~dp0%DEST_DIR%\%ARCHIVE_DIR%\node.exe" install.js "%LocalAPPData%"
if %ERRORLEVEL% NEQ 0 (
    echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Failed to run install.js.
)
echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Registering browser extensions...
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
:: Get short path name (8.3 format) for compatibility with older systems
FOR %%f in ("%LocalAPPData%") do SET SHORT_PATH=%%~sf
REG ADD "HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%SHORT_PATH%\com.add0n.node\manifest-firefox.json" /f
ECHO .. Writting to Waterfox Registry
ECHO .. Key: HKCU\SOFTWARE\Waterfox\NativeMessagingHosts\com.add0n.node
REG ADD "HKCU\SOFTWARE\Waterfox\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%SHORT_PATH%\com.add0n.node\manifest-firefox.json" /f
ECHO .. Writting to Thunderbird Registry
ECHO .. Key: HKCU\SOFTWARE\Thunderbird\NativeMessagingHosts\com.add0n.node
REG ADD "HKCU\SOFTWARE\Thunderbird\NativeMessagingHosts\com.add0n.node" /ve /t REG_SZ /d "%SHORT_PATH%\com.add0n.node\manifest-firefox.json" /f
popd
exit /b 0
:: Cleanup temporary directories
:Cleanup
echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][Debug] Cleaning up...
rmdir /s /q "%DEST_DIR%"
rem rmdir /s /q "%TEMP_DIR%" >nul 
PAUSE&exit
:: End script
:end
cls
color 04
echo ----------------------------------------
echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][error] Not Found WinRAR.exe
echo [%date:~0,4%-%date:~5,2%-%date:~8,2%][error] Please Setup 7zip(Recommended) or WinRAR.
echo ----------------------------------------
PAUSE&exit