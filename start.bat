@echo off
title Smart Timetable Scheduler - Live Server
echo ======================================================================
echo          SMART TIMETABLE SCHEDULER (AIDS DEPARTMENT)
echo          Final Year Academic Project - Live Web Server
echo ======================================================================
echo.
echo Launching Smart Timetable Scheduler in your default browser...
start "" http://localhost:5000
echo.
echo Starting backend server on http://localhost:5000 (Press Ctrl+C to stop)...
echo.
node server/index.js
pause
