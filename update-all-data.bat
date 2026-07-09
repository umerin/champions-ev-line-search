@echo off
setlocal

cd /d "%~dp0"
set "LOG_FILE=%~dp0update-all-data.log"

echo Pokemon Champions EV Support data update > "%LOG_FILE%"
echo Started: %DATE% %TIME% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

echo Pokemon Champions EV Support
echo Updating ALL Pokemon and move data from PokeAPI.
echo This can take several minutes.
echo.

where node >nul 2>nul
if errorlevel 1 (
  set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
) else (
  set "NODE_EXE=node"
)

if not "%NODE_EXE%"=="node" (
  if not exist "%NODE_EXE%" (
    echo ERROR: Node.js was not found.
    echo ERROR: Node.js was not found. >> "%LOG_FILE%"
    echo Install Node.js or run this inside the Codex runtime environment.
    goto END
  )
)

echo Using Node: %NODE_EXE%
echo Using Node: %NODE_EXE% >> "%LOG_FILE%"
echo.

"%NODE_EXE%" scripts\fetch-pokeapi-data.mjs --all >> "%LOG_FILE%" 2>&1
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
  echo ERROR: Data update failed. Exit code: %EXIT_CODE%
  echo See log:
  echo %LOG_FILE%
  goto END
)

echo Data update completed.
echo Completed: %DATE% %TIME% >> "%LOG_FILE%"

:END
echo.
echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%
