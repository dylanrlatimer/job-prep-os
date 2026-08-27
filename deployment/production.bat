@echo off
setlocal

if "%~1"=="" (
    echo You must provide a commit message.
    echo Example: production.bat "your message here"
    exit /b 1
)

set MSG=%~1

git checkout production
git merge main -m "%MSG%"
git push origin production
git checkout main