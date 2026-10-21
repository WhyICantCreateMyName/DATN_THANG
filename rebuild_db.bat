@echo off
setlocal
title Database Rebuild Tool
echo ======================================================
echo    CONG CU KHOI TAO / LAM MOI DATABASE
echo ======================================================
echo  [1] Rebuild Database DOCKER (Xoa sach volume cu, tao moi 100%%) - KHUYEN DUNG
echo  [2] Rebuild Database LOCAL (May da cai san PostgreSQL ngoai Windows)
echo.
set /p choice="Nhap lua chon (1 hoac 2, Mac dinh la 1): "
if "%choice%"=="" set choice=1

if "%choice%"=="2" goto REBUILD_LOCAL

:REBUILD_DOCKER
echo.
echo [1/3] Dang xoa Volume cu va khoi tao lai Docker Containers...
cd API
docker compose down -v
docker compose up -d
echo Cho PostgreSQL khoi tao va san sang ket noi...
:WAIT_PG
docker exec restaurant_db pg_isready -U postgres >nul 2>&1
if %errorlevel% neq 0 (
    ping 127.0.0.1 -n 2 >nul
    goto WAIT_PG
)
echo PostgreSQL da san sang!
echo.
echo [2/3] Dong bo cau truc Database (Prisma push)...
call npx prisma generate
call npx prisma db push --accept-data-loss
echo.
echo [3/3] Nap du lieu mau (Seed Data)...
call npx prisma db seed
cd ..
echo.
echo ======================================================
echo    HOAN TAT! DATABASE DOCKER DA KHOI TAO THANH CONG.
echo ======================================================
pause
exit

:REBUILD_LOCAL
echo.
:: 1. Nhập cấu hình
set /p DB_PASS="Nhap password PostgreSQL Local (Mac dinh 123456): "
if "%DB_PASS%"=="" set DB_PASS=123456

set PGPASSWORD=%DB_PASS%

echo.
echo [1/4] Kiem tra ket noi va tao Database Local...
psql -U postgres -h localhost -c "CREATE DATABASE restaurant_db;" 2>nul
if %errorlevel% equ 0 (
    echo    - Da tao moi database 'restaurant_db'.
) else (
    echo    - Database da ton tai hoac psql chua duoc thiet lap PATH. Tiep tuc...
)

echo.
echo [2/4] Cap nhat file .env voi password moi...
cd API
powershell -Command "(gc .env) -replace 'postgres:.*@localhost', 'postgres:%DB_PASS%@localhost' | Out-File -encoding utf8 .env"

echo.
echo [3/4] Dong bo cau truc Prisma (Force Push)...
call npx prisma generate
call npx prisma db push --accept-data-loss

echo.
echo [4/4] Nap du lieu mau (Seed)...
call npx prisma db seed

echo.
echo ======================================================
echo    HOAN TAT! DATABASE LOCAL DA SAN SANG.
echo ======================================================
cd ..
pause
