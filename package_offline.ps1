# Rebuilds the prebuilt offline ZIP from the current minMain folder contents.
param()

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $root

$zipName = 'beyond-bell-offline.zip'

Write-Host "Packaging offline bundle from $root ..." -ForegroundColor Cyan

Remove-Item $zipName -ErrorAction SilentlyContinue

# Exclude git, zip, and any documentation files
$excludePatterns = @('.git', $zipName, '*.md', '*.txt', 'debug-*', 'fix_*', 'verify_*')
$items = Get-ChildItem -Force | Where-Object { 
    $exclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($_.Name -like $pattern -or $_.Name -eq $pattern) {
            $exclude = $true
            break
        }
    }
    -not $exclude
}

Compress-Archive -Path $items.FullName -DestinationPath $zipName -Force

Write-Host "Done. Created $zipName with current minMain contents." -ForegroundColor Green

