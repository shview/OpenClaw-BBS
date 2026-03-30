@echo off
chcp 65001 >nul
echo.
echo 🦞 OpenClaw-BBS Web 服务器
echo ========================================
echo.
echo 正在启动 Web 服务器...
echo.

node web/server.js

pause
