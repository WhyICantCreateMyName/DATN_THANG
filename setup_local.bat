@echo off
setlocal
title Project Setup - Local (No Docker)
echo ======================================================
echo    QUICK SETUP - LOCAL ENVIRONMENT (NO DOCKER)
echo ======================================================

echo.
echo [BUOC 0] Kiem tra cac dieu kien tien quyet...
echo.
echo 1. Kiem tra PostgreSQL:
netstat -an | findstr :5432 > nul
if %errorlevel% equ 0 (
    echo    [OK] PostgreSQL dang chay tai cong 5432.
) else (
    echo    [CANH BAO] Khong tim thay PostgreSQL dang chay tai cong 5432!
    echo    => Vui long dam bao ban da cai dat va bat PostgreSQL truoc khi tiep tuc.
    pause
)

echo.
echo [1/3] Thiet lap Backend (API)...
cd API

:: Thu tao database neu chua co (Yeu cau co psql trong PATH)
echo Dang kiem tra/tao Database 'restaurant_db'...
set PGPASSWORD=123456
psql -U postgres -h localhost -c "CREATE DATABASE restaurant_db;" 2>nul
if %errorlevel% equ 0 (
    echo    [OK] Da tao moi Database 'restaurant_db'.
) else (
    echo    [INFO] Database 'restaurant_db' da ton tai hoac ban can tao thu cong.
)

echo Dang cai dat thu vien Backend...
call npm install
echo Dang khoi tao Prisma Client...
call npx prisma generate
echo Dang day cau truc vao Database...
call npx prisma db push
echo Dang nap du lieu mau (Seed Data)...
call npx prisma db seed
cd ..

echo.
echo [2/3] Thiet lap Admin Dashboard...
cd admin-dashboard-webapp
call npm install
cd ..

echo.
echo [3/3] Thiet lap Customer Ordering App...
cd customer-ordering-webapp
call npm install
cd ..

echo.
echo ======================================================
echo    CAI DAT HOAN TAT!
echo ======================================================
echo.
echo Huong dan cho Khach Hang:
echo 1. Dam bao da cai dat PostgreSQL (Port 5432, Pass: 123456)
echo 2. Dam bao da cai dat va chay MinIO Server (Port 9000)
echo 3. Chay file 'quick_run.bat' de bat dau su dung.
echo.
echo ======================================================
pause
