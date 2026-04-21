@echo off
REM Folusho Reporting Sheet - Git Push Script
REM This script will add, commit, and push all changes to GitHub

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     Folusho Reporting Sheet - GitHub Push Script          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo ✓ Git found
echo.

REM Show current status
echo [STEP 1] Checking git status...
git status
echo.

REM Ask for confirmation
set /p confirm="Do you want to continue with push? (y/n): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    exit /b 0
)

echo.
echo [STEP 2] Adding all changes...
git add .
if errorlevel 1 (
    echo ❌ Failed to add changes
    pause
    exit /b 1
)
echo ✓ Changes added

echo.
echo [STEP 3] Committing changes...
git commit -m "feat: implement critical security and stability fixes

- Add input validation system for all forms
- Add 30-second request timeout protection
- Add 30-minute session timeout with activity reset
- Add error boundary component for crash handling
- Add HTTPS enforcement in production
- Disable development credentials in production
- Improve MongoDB + Supabase fallback routing
- Update email notifications with new app password
- Add comprehensive documentation"

if errorlevel 1 (
    echo ❌ Failed to commit changes
    pause
    exit /b 1
)
echo ✓ Changes committed

echo.
echo [STEP 4] Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ Failed to push to GitHub
    echo.
    echo Possible issues:
    echo - Not authenticated with GitHub
    echo - Wrong branch name (not 'main')
    echo - No internet connection
    echo.
    echo Try these commands manually:
    echo   git config --global user.name "Your Name"
    echo   git config --global user.email "your-email@gmail.com"
    echo   git push origin main
    pause
    exit /b 1
)
echo ✓ Changes pushed to GitHub

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║               ✓ Push Successful!                          ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ Your changes have been pushed to GitHub                   ║
echo ║ Check: https://github.com/your-username/your-repo        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

pause
