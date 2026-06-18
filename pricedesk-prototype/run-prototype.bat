@echo off
title PriceDesk Prototype Server Launcher
echo ========================================================
echo Starting PriceDesk Offline Server...
echo ========================================================

rem Check if folder is extracted
if not exist "%~dp0index.html" (
    echo.
    echo ERROR: YOU MUST EXTRACT THE ZIP FILE FIRST!
    echo.
    echo It looks like you are double-clicking this file directly inside the ZIP folder.
    echo.
    echo Please:
    echo 1. Right-click the zip file.
    echo 2. Click "Extract All..." and extract it to a folder.
    echo 3. Open the extracted folder and double-click "run-prototype.bat".
    echo.
    pause
    exit /b
)

rem Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [Info] Node.js detected. Starting server...
    node "%~dp0server.js"
    goto end
)

rem If Node.js is not found, use inline PowerShell (avoids script execution policy blocks on .ps1 files)
echo [Info] Node.js not detected. Starting server via PowerShell inline...
powershell -NoProfile -Command "$PSScriptRoot = '%~dp0'; $port = 8080; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:' + $port + '/'); try { $listener.Start() } catch { $port = 8081; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:' + $port + '/'); $listener.Start() }; Write-Host 'PriceDesk Offline Prototype Server is Running!'; Write-Host ('Address: http://localhost:' + $port + '/'); Start-Process ('http://localhost:' + $port + '/'); while ($listener.IsListening) { try { $context = $listener.GetContext(); $request = $context.Request; $response = $context.Response; $url = $request.Url.LocalPath; if ($url -eq '/') { $url = '/index.html' }; $url = $url.TrimStart('/'); $filePath = [System.IO.Path]::Combine($PSScriptRoot, $url); if (Test-Path $filePath -PathType Leaf) { $bytes = [System.IO.File]::ReadAllBytes($filePath); if ($filePath.EndsWith('.html')) { $response.ContentType = 'text/html' } elseif ($filePath.EndsWith('.js')) { $response.ContentType = 'application/javascript' } elseif ($filePath.EndsWith('.css')) { $response.ContentType = 'text/css' } elseif ($filePath.EndsWith('.png')) { $response.ContentType = 'image/png' } elseif ($filePath.EndsWith('.svg')) { $response.ContentType = 'image/svg+xml' }; $response.ContentLength64 = $bytes.Length; $response.OutputStream.Write($bytes, 0, $bytes.Length) } else { $response.StatusCode = 404 }; $response.Close() } catch {} }"

:end
pause
