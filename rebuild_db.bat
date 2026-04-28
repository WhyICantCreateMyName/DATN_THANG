@echo off
setlocal
title Database Rebuild Tool
echo ======================================================
echo    CONG CU KHOI TAO / LAM MOI DATABASE
echo ======================================================
echo.

:: 1. Nhập cấu hình
set /p DB_PASS="Nhap password PostgreSQL (Mac dinh 123456): "
if "%DB_PASS%"=="" set DB_PASS=123456

set PGPASSWORD=%DB_PASS%

echo.
echo [1/4] Kiem tra ket noi va tao Database...
psql -U postgres -h localhost -c "CREATE DATABASE restaurant_db;" 2>nul
if %errorlevel% equ 0 (
    echo    - Da tao moi database 'restaurant_db'.
) else (
    echo    - Database da ton tai hoac psql chua duoc thiet lap PATH. Tiep tuc...
)

echo.
echo [2/4] Cap nhat file .env voi password moi...
cd API
:: Cap nhat password trong file .env (dung Powershell de replace)
powershell -Command "(gc .env) -replace 'postgres:.*@localhost', 'postgres:%DB_PASS%@localhost' | Out-File -encoding utf8 .env"

echo.
echo [3/4] Dong bo cau truc Prisma (Force Push)...
call npx prisma generate
call npx prisma db push --accept-data-loss

echo.
echo [4/4] Nap du lieu mau (Seed)...
call npm run seed

echo.
echo ======================================================
echo    HOAN TAT! DATABASE DA SAN SANG.
echo ======================================================
cd ..
pause
