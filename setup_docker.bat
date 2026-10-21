@echo off
setlocal
echo ======================================================
echo QUICK SETUP - WITH DOCKER SERVICES
echo ======================================================

echo.
echo [1/4] Starting Docker Containers (Postgres, MinIO)...
cd API
docker compose down -v
docker compose up -d
cd ..

echo.
echo [2/4] Setting up Backend (API)...
cd API
call npm install
call npx prisma generate
echo Cho PostgreSQL khoi tao va san sang ket noi...
:WAIT_PG
docker exec restaurant_db pg_isready -U postgres >nul 2>&1
if %errorlevel% neq 0 (
    ping 127.0.0.1 -n 2 >nul
    goto WAIT_PG
)
echo PostgreSQL da san sang!
call npx prisma db push
echo Seeding database...
call npx prisma db seed
cd ..

echo.
echo [3/4] Setting up Admin Dashboard...
cd admin-dashboard-webapp
call npm install
cd ..

echo.
echo [4/4] Setting up Customer Ordering App...
cd customer-ordering-webapp
call npm install
cd ..

echo.
echo ======================================================
echo SETUP COMPLETE!
echo Database and MinIO are running in Docker.
echo You can now start the applications using 'npm run dev'
echo ======================================================
pause
