@echo off
setlocal
title Restaurant Management System - Quick Run

:MENU
cls
echo ======================================================
echo    RESTAURANT MANAGEMENT SYSTEM - QUICK RUN
echo ======================================================
echo.
echo  [1] Run EVERYTHING (Start Docker Services + 3 Apps)
echo  [2] Run APPS ONLY (Use if DB/MinIO is already running)
echo  [3] Stop Docker Services
echo  [4] Start MinIO Local (Use if NOT using Docker)
echo  [5] Exit
echo.
echo ======================================================
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto RUN_ALL
if "%choice%"=="2" goto RUN_APPS
if "%choice%"=="3" goto STOP_DOCKER
if "%choice%"=="4" goto START_MINIO_LOCAL
if "%choice%"=="5" goto EXIT
goto MENU

:START_MINIO_LOCAL
echo.
echo Starting MinIO Local...
if not exist "minio_storage" mkdir "minio_storage"
set MINIO_ROOT_USER=admin
set MINIO_ROOT_PASSWORD=12345678
start "MinIO Server" cmd /c "minio.exe server minio_storage --console-address :9001"
echo [OK] MinIO is starting in a new window.
timeout /t 3
goto MENU

:RUN_ALL
echo.
echo Starting Docker services in API folder...
cd API
docker-compose up -d
cd ..
goto RUN_APPS

:RUN_APPS
echo.
echo Starting all applications in separate windows...

:: Backend
start "Backend (API) - Port 4000" cmd /c "cd API && npm run dev"

:: Admin
start "Admin Dashboard - Port 3001" cmd /c "cd admin-dashboard-webapp && npm run dev"

:: Customer
start "Customer App - Port 3000" cmd /c "cd customer-ordering-webapp && npm run dev"

echo.
echo All projects are starting! Please check the new windows for logs.
timeout /t 5
goto EXIT

:STOP_DOCKER
echo.
echo Stopping Docker services...
cd API
docker-compose down
cd ..
echo Done.
pause
goto MENU

:EXIT
echo Goodbye!
exit
