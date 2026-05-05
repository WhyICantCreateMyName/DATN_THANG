@echo off
echo Dang kiem tra cap nhat tu GitHub...
git fetch --all
git reset --hard origin/main
echo Cap nhat xong!
pause
