Write-Host "Starting local web server..." -ForegroundColor Green
Write-Host ""

# Try Node.js first (most reliable)
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    Write-Host "Using Node.js http-server..." -ForegroundColor Cyan
    Write-Host "Opening browser in 2 seconds..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
    Write-Host ""
    
    # Open browser after a short delay
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 2
        Start-Process "http://localhost:8000"
    } | Out-Null
    
    # Start server (this will block)
    npx --yes http-server -p 8000 -c-1
} else {
    # Try Python
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) {
        $python = Get-Command python3 -ErrorAction SilentlyContinue
    }
    
    if ($python) {
        Write-Host "Using Python http.server..." -ForegroundColor Cyan
        Write-Host "Opening browser in 2 seconds..." -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
        Write-Host ""
        
        # Open browser after a short delay
        Start-Job -ScriptBlock {
            Start-Sleep -Seconds 2
            Start-Process "http://localhost:8000"
        } | Out-Null
        
        # Start server (this will block)
        python -m http.server 8000
    } else {
        Write-Host "ERROR: Neither Python nor Node.js found!" -ForegroundColor Red
        Write-Host "Please install Node.js from https://nodejs.org/ (recommended)" -ForegroundColor Yellow
        Write-Host "Or install Python from https://www.python.org/" -ForegroundColor Yellow
        pause
    }
}

