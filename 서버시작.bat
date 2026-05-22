@echo off
title Tatoa CMS - 서버 시작 중...
cd /d "%~dp0"

echo.
echo  ================================
echo   Tatoa CMS 서버를 시작합니다...
echo  ================================
echo.

:: node_modules 없으면 install 먼저
if not exist "node_modules" (
    echo  [1/2] 패키지 설치 중... (최초 1회만 실행됩니다)
    echo.
    where pnpm >nul 2>&1
    if %errorlevel% == 0 (
        pnpm install
    ) else (
        npm install
    )
    echo.
    echo  패키지 설치 완료!
    echo.
)

echo  [2/2] 서버 시작 중... (포트 7000)
echo.
echo  접속 주소: http://localhost:7000
echo.

where pnpm >nul 2>&1
if %errorlevel% == 0 (
    pnpm next dev -p 7000
) else (
    npm run dev -- -p 7000
)

pause
