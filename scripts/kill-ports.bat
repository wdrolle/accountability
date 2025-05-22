@echo off
echo Killing processes on ports...

:: Kill process on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do (
    taskkill /F /PID %%a 2>nul
)

:: Kill process on port 3002
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002"') do (
    taskkill /F /PID %%a 2>nul
)

echo Ports cleared 