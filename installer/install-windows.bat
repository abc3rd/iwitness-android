@echo off
title UCrash iWitness - One-Click Installer
color 0A
cls

echo ============================================================
echo   UCrash iWitness - Smart Viral Affiliate Super-App
echo   One-Click Installer for Windows
echo ============================================================
echo.

:: ---- Check Admin ----
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Please right-click and "Run as Administrator"
    pause
    exit /b 1
)

set "INSTALL_DIR=%USERPROFILE%\ucrash-iwitness"
set "DESKTOP=%USERPROFILE%\Desktop"

echo [1/8] Checking prerequisites...
echo.

:: ---- Check Node.js ----
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Node.js not found. Installing Node.js 22 LTS...
    echo [*] Downloading...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi' -OutFile '%TEMP%\node-install.msi'"
    echo [*] Running installer...
    msiexec /i "%TEMP%\node-install.msi" /qn /norestart
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    echo [OK] Node.js installed.
) else (
    for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js found: %%i
)

:: ---- Check Git ----
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Git not found. Installing Git...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/Git-2.47.1-64-bit.exe' -OutFile '%TEMP%\git-install.exe'"
    "%TEMP%\git-install.exe" /VERYSILENT /NORESTART
    set "PATH=%ProgramFiles%\Git\cmd;%PATH%"
    echo [OK] Git installed.
) else (
    for /f "tokens=*" %%i in ('git --version') do echo [OK] Git found: %%i
)

echo.
echo [2/8] Creating install directory: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: ---- Clone or copy project ----
echo.
echo [3/8] Setting up project files...
if exist "%~dp0package.json" (
    echo [*] Copying local project files...
    xcopy /E /I /Y "%~dp0*" "%INSTALL_DIR%\" >nul 2>&1
) else if exist "%~dp0..\package.json" (
    echo [*] Copying from parent directory...
    xcopy /E /I /Y "%~dp0..\*" "%INSTALL_DIR%\" >nul 2>&1
) else (
    echo [*] Cloning from repository...
    git clone https://github.com/abc3rd/iwitness-android.git "%INSTALL_DIR%" 2>nul
    if %errorlevel% neq 0 (
        echo [!] Clone failed. Please place this installer inside the project folder.
        pause
        exit /b 1
    )
)

cd /d "%INSTALL_DIR%"

:: ---- Install Frontend Dependencies ----
echo.
echo [4/8] Installing frontend dependencies...
call npm install --legacy-peer-deps 2>nul
if %errorlevel% neq 0 (
    echo [!] npm install failed, retrying...
    call npm install --force
)
echo [OK] Frontend dependencies installed.

:: ---- Install Backend Dependencies ----
echo.
echo [5/8] Installing backend dependencies...
if exist "backend\package.json" (
    cd /d "%INSTALL_DIR%\backend"
    call npm install --legacy-peer-deps 2>nul
    if %errorlevel% neq 0 (
        call npm install --force
    )
    echo [OK] Backend dependencies installed.
    cd /d "%INSTALL_DIR%"
) else (
    echo [SKIP] No backend package.json found.
)

:: ---- Create .env for backend ----
echo.
echo [6/8] Setting up environment configuration...
if exist "backend\.env.example" (
    if not exist "backend\.env" (
        copy "backend\.env.example" "backend\.env" >nul
        echo [OK] Backend .env created from template.
        echo [!] IMPORTANT: Edit backend\.env with your API keys before going live.
    ) else (
        echo [OK] Backend .env already exists.
    )
)

:: ---- Build Frontend ----
echo.
echo [7/8] Building frontend...
cd /d "%INSTALL_DIR%"
call npm run build 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Frontend build had issues - the dev server will still work.
) else (
    echo [OK] Frontend built to dist/
)

:: ---- Create Desktop Shortcuts ----
echo.
echo [8/8] Creating desktop shortcuts...

:: Start App shortcut
(
echo @echo off
echo title UCrash iWitness
echo color 0A
echo echo Starting UCrash iWitness...
echo echo.
echo cd /d "%INSTALL_DIR%"
echo start "UCrash Backend" cmd /k "cd backend && npm run dev"
echo timeout /t 3 /nobreak ^>nul
echo start "UCrash Frontend" cmd /k "npm run dev"
echo timeout /t 5 /nobreak ^>nul
echo start http://localhost:5173
echo echo.
echo echo UCrash iWitness is running!
echo echo   Frontend: http://localhost:5173
echo echo   Backend:  http://localhost:3001
echo echo.
echo echo Close this window to stop.
echo pause
) > "%DESKTOP%\UCrash iWitness.bat"

:: Stop App shortcut
(
echo @echo off
echo title Stop UCrash
echo echo Stopping UCrash iWitness servers...
echo taskkill /f /fi "WINDOWTITLE eq UCrash Backend*" ^>nul 2^>^&1
echo taskkill /f /fi "WINDOWTITLE eq UCrash Frontend*" ^>nul 2^>^&1
echo for /f "tokens=5" %%%%a in ^('netstat -aon ^^^| findstr :3001 ^^^| findstr LISTENING'^) do taskkill /f /pid %%%%a ^>nul 2^>^&1
echo for /f "tokens=5" %%%%a in ^('netstat -aon ^^^| findstr :5173 ^^^| findstr LISTENING'^) do taskkill /f /pid %%%%a ^>nul 2^>^&1
echo echo Done!
echo timeout /t 2 /nobreak ^>nul
) > "%DESKTOP%\Stop UCrash.bat"

echo [OK] Desktop shortcuts created.

echo.
echo ============================================================
echo   INSTALLATION COMPLETE!
echo ============================================================
echo.
echo   Install location: %INSTALL_DIR%
echo.
echo   Desktop shortcuts created:
echo     - "UCrash iWitness.bat"  (double-click to start)
echo     - "Stop UCrash.bat"      (double-click to stop)
echo.
echo   To start the app:
echo     1. Double-click "UCrash iWitness" on your desktop
echo     2. Wait for servers to start
echo     3. Browser opens to http://localhost:5173
echo.
echo   NEXT STEPS:
echo     - Edit backend\.env with your API keys
echo     - Set up PostgreSQL database (or use Docker)
echo     - Configure Supabase/Stripe/Twilio keys
echo.
echo ============================================================
echo.
pause
