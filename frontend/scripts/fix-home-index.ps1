# Run from frontend/ after closing any workspace opened on src/pages/Home/index.js
$homeDir = Join-Path $PSScriptRoot "..\src\pages\Home"
$indexDir = Join-Path $homeDir "index.js"
$indexJsx = Join-Path $homeDir "index.jsx"
$appJs = Join-Path $PSScriptRoot "..\src\App.js"

if (Test-Path $indexDir -PathType Container) {
  Remove-Item -Recurse -Force $indexDir
  Write-Host "Removed index.js directory"
}

if (Test-Path $indexJsx) {
  Rename-Item $indexJsx "index.js" -Force
  Write-Host "Renamed index.jsx to index.js"
}

$content = Get-Content $appJs -Raw
$content = $content -replace "from '\./pages/Home/index\.jsx'", "from './pages/Home'"
Set-Content -Path $appJs -Value ($content.TrimEnd() + [Environment]::NewLine)
Write-Host "Updated App.js import to ./pages/Home"
Write-Host "Done."
