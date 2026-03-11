# Rebuilds the prebuilt offline ZIP from the current minMain folder contents.
param()

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $root

$zipName = 'beyond-bell-offline.zip'

Write-Host "Packaging offline bundle from $root ..." -ForegroundColor Cyan

Remove-Item $zipName -ErrorAction SilentlyContinue

$items = Get-ChildItem -Force | Where-Object { $_.Name -notin '.git', $zipName }

Compress-Archive -Path $items.FullName -DestinationPath $zipName -Force

Write-Host "Done. Created $zipName with current minMain contents." -ForegroundColor Green

