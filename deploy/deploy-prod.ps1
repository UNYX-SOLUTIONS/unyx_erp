# ============================================================================
# Unyx ERP - Sube el proyecto al VPS y ejecuta el despliegue de PRODUCCIÓN
#
# Uso (PowerShell 7, desde la raíz del repo):
#   .\deploy\deploy-prod.ps1 -VpsHost 203.0.113.10
#   .\deploy\deploy-prod.ps1 -VpsHost 203.0.113.10 -VpsUser ubuntu
#   .\deploy\deploy-prod.ps1 -VpsHost 203.0.113.10 -Seed
#   .\deploy\deploy-prod.ps1 -VpsHost 203.0.113.10 -NoBackup
#   .\deploy\deploy-prod.ps1 -VpsHost 203.0.113.10 -SkipUpload
#
# Requisitos locales: OpenSSH (ssh, scp) y tar. En Windows 10/11 ya vienen.
# Requisitos remotos: Docker + Traefik y /opt/unyx-erp/.env.production.
# El archivo .env.production NO se sube: se conserva y valida en el VPS.
# ============================================================================

param(
  [Parameter(Mandatory = $true)][string]$VpsHost,
  [string]$VpsUser = 'root',
  [int]$SshPort = 22,
  [string]$RemoteDir = '/opt/unyx-erp',
  [switch]$SkipUpload,
  [switch]$Seed,
  [switch]$Demo,
  [switch]$NoBackup,
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

foreach ($cmd in 'ssh', 'scp', 'tar') {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "No se encontro '$cmd' en PATH. Instala el cliente OpenSSH (Configuracion > Aplicaciones > Caracteristicas opcionales > Cliente OpenSSH)."
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$target = "$VpsUser@$VpsHost"
$sshArgs = @('-p', "$SshPort", '-o', 'StrictHostKeyChecking=accept-new')
$scpArgs = @('-P', "$SshPort", '-o', 'StrictHostKeyChecking=accept-new')

if (-not $SkipUpload) {
  $archive = Join-Path $env:TEMP 'unyx-erp-prod.tar.gz'
  if (Test-Path $archive) { Remove-Item $archive -Force }

  Write-Host "==> Empaquetando proyecto (sin node_modules, .next, dist, .git, .env* ni backups)..." -ForegroundColor Cyan
  Push-Location $repoRoot
  try {
    tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=.kilo --exclude=dist `
      --exclude=backups --exclude=.env --exclude=.env.local --exclude=.env.production `
      --exclude=.env.deploy -czf $archive .
    if ($LASTEXITCODE -ne 0) { throw 'tar fallo al empaquetar el proyecto.' }
  } finally {
    Pop-Location
  }

  $sizeMb = [math]::Round((Get-Item $archive).Length / 1MB, 1)
  Write-Host "==> Paquete listo ($sizeMb MB). Subiendo a ${target}..." -ForegroundColor Cyan
  & scp @scpArgs $archive "${target}:/tmp/unyx-erp-prod.tar.gz"
  if ($LASTEXITCODE -ne 0) { throw 'scp fallo al subir el paquete.' }

  Write-Host "==> Extrayendo en $RemoteDir ..." -ForegroundColor Cyan
  & ssh @sshArgs $target "mkdir -p '$RemoteDir' && tar -xzf /tmp/unyx-erp-prod.tar.gz -C '$RemoteDir' && rm -f /tmp/unyx-erp-prod.tar.gz"
  if ($LASTEXITCODE -ne 0) { throw 'La extraccion remota fallo.' }
}

$flags = @()
if ($Seed) { $flags += '--seed' }
if ($Demo) { $flags += '--demo' }
if ($NoBackup) { $flags += '--no-backup' }
if ($SkipBuild) { $flags += '--skip-build' }
$flagsText = ($flags -join ' ')

$remoteCmd = "cd '$RemoteDir' && test -f .env.production || { echo 'ERROR: falta $RemoteDir/.env.production. Crealo desde .env.production.example antes de desplegar.'; exit 1; }; " +
  "for f in deploy/*.sh; do sed -i 's/\r`$//' `"`$f`"; chmod +x `"`$f`"; done; " +
  "if [ `$(id -u) -eq 0 ]; then bash deploy/deploy-prod.sh $flagsText; " +
  "else sudo bash deploy/deploy-prod.sh $flagsText; fi"

Write-Host "==> Ejecutando despliegue de PRODUCCION en el VPS (SSH)..." -ForegroundColor Cyan
& ssh @sshArgs $target $remoteCmd
if ($LASTEXITCODE -ne 0) { throw 'El despliegue remoto fallo. Revisa la salida de arriba.' }

$domain = (& ssh @sshArgs $target "grep '^UNYX_DOMAIN=' '$RemoteDir/.env.production' | head -n1 | cut -d= -f2-").Trim()
Write-Host ""
Write-Host "Despliegue completado." -ForegroundColor Green
if ($domain) {
  Write-Host "URL:   https://$domain" -ForegroundColor Green
  Write-Host "API:   https://$domain/api/v1/health" -ForegroundColor Green
}
Write-Host ""
Write-Host "Siguiente paso (sync inicial de Contifico):" -ForegroundColor Yellow
Write-Host "  ssh -p $SshPort ${target} `"cd '$RemoteDir' && ./deploy/contifico-sync.sh --dry-run --match-by-name`"" -ForegroundColor Yellow
Write-Host "  ssh -p $SshPort ${target} `"cd '$RemoteDir' && ./deploy/contifico-sync.sh --apply --match-by-name`"" -ForegroundColor Yellow
