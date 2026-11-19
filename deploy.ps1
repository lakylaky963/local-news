# Deploy local-news to CT 110 (/opt/local-news) over ssh root@server + pct push, then restart pm2 "news".
# Usage: .\deploy.ps1              (takes a snapshot first)
#        .\deploy.ps1 -NoSnapshot  (skip the snapshot)
# Needs the laptop's SSH key for root@server. .env on the container is never touched.
param(
  [bool]$Snapshot = $true,
  [switch]$NoSnapshot
)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$tgz  = Join-Path $env:TEMP 'local-news-deploy.tgz'
$ct   = 110
$dest = '/opt/local-news'
$url  = 'https://central-proxy.bluebuck-tailor.ts.net/news/'

if ($NoSnapshot) { $Snapshot = $false }
if ($Snapshot) {
  $snap = 'pre-news-deploy-' + (Get-Date -Format 'yyyyMMdd-HHmm')
  ssh root@server "pct snapshot $ct $snap"
  if ($LASTEXITCODE) { throw 'snapshot failed' }
  Write-Host "Snapshot $snap taken. Undo with: ssh root@server `"pct rollback $ct $snap`""
}

# Package everything except repo/dev files and secrets.
$ex = @('.git', '.gitignore', '.claude', 'node_modules', 'deploy.ps1', '.env')
$items = Get-ChildItem -LiteralPath $root -Force | Where-Object { $ex -notcontains $_.Name } | ForEach-Object { $_.Name }
Push-Location $root
try { tar -czf $tgz @items; if ($LASTEXITCODE) { throw 'tar failed' } } finally { Pop-Location }

scp -q $tgz root@server:/tmp/local-news-deploy.tgz
if ($LASTEXITCODE) { throw 'scp failed' }
ssh root@server "pct push $ct /tmp/local-news-deploy.tgz /tmp/local-news-deploy.tgz && rm /tmp/local-news-deploy.tgz && pct exec $ct -- sh -c 'mkdir -p $dest && tar -xzf /tmp/local-news-deploy.tgz -C $dest --no-same-owner && rm /tmp/local-news-deploy.tgz && cd $dest && npm install --omit=dev --no-audit --no-fund && (pm2 restart news --update-env || pm2 start server.js --name news) && pm2 save'"
if ($LASTEXITCODE) { throw 'remote install/restart failed' }
Remove-Item $tgz -Force

Start-Sleep -Seconds 3
$code = (curl.exe -s -o NUL -w '%{http_code}' $url)
Write-Host "Deployed. /news/ -> HTTP $code"
$liveFile = Join-Path $env:TEMP 'local-news-live-app.js'
curl.exe -s -o $liveFile ($url + 'app.js')
$local = (Get-FileHash -Algorithm MD5 -LiteralPath (Join-Path $root 'public/app.js')).Hash.ToLower()
$live  = (Get-FileHash -Algorithm MD5 -LiteralPath $liveFile).Hash.ToLower()
Remove-Item $liveFile -Force
Write-Host "public/app.js md5  local: $local"
Write-Host "public/app.js md5  live : $live"
if ($local -ne $live) { Write-Warning 'md5 differs: the live app.js is not what is in this folder.' }
