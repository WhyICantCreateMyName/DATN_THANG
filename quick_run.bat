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
echo  [2] Run APPS + Local MinIO (No Docker)
echo  [3] Build Web Applications (Admin & Customer)
echo  [4] Stop Docker Services
echo  [5] Exit
echo.
echo ======================================================
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto RUN_ALL
if "%choice%"=="2" goto RUN_APPS_LOCAL
if "%choice%"=="3" goto BUILD_APPS
if "%choice%"=="4" goto STOP_DOCKER
if "%choice%"=="5" goto EXIT
goto MENU

:RUN_APPS_LOCAL
echo.
echo [1/2] Starting MinIO in background...
if not exist "minio_storage" mkdir "minio_storage"
powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c set MINIO_ROOT_USER=admin && set MINIO_ROOT_PASSWORD=12345678 && minio.exe server minio_storage --console-address :9001' -WindowStyle Hidden"
timeout /t 2
goto RUN_APPS

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
start "Admin Dashboard - Port 9977" cmd /c "cd admin-dashboard-webapp && npm run start"

:: Customer
start "Customer App - Port 6688" cmd /c "cd customer-ordering-webapp && npm run start"

echo.
echo All projects are starting! Please check the new windows for logs.
timeout /t 5
goto EXIT

:BUILD_APPS
echo.
echo ======================================================
echo    BUILDING WEB APPLICATIONS (PRODUCTION BUILD)
echo ======================================================
echo.
echo [1/2] Building Admin Dashboard Webapp...
cd admin-dashboard-webapp
call npm run build
cd ..
echo.
echo [2/2] Building Customer Ordering Webapp...
cd customer-ordering-webapp
call npm run build
cd ..
echo.
echo All builds completed successfully!
pause
goto MENU

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
