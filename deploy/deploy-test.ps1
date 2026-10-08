# ============================================================================
# Unyx ERP - Sube el proyecto al VPS y ejecuta el despliegue de PRUEBAS
#
# Uso (PowerShell 7, desde la raiz del repo):
#   .\deploy\deploy-test.ps1 -VpsHost 203.0.113.10
#   .\deploy\deploy-test.ps1 -VpsHost 203.0.113.10 -VpsUser ubuntu
#   .\deploy\deploy-test.ps1 -VpsHost 203.0.113.10 -SshPort 2222
#   .\deploy\deploy-test.ps1 -VpsHost 203.0.113.10 -SkipUpload -NoSeed
#
# Requisitos locales: OpenSSH (ssh, scp) y tar. En Windows 10/11 ya vienen.
# Excluye node_modules, .next, dist, .git y archivos .env (los genera el VPS).
# ============================================================================

param(
  [Parameter(Mandatory = $true)][string]$VpsHost,
  [string]$VpsUser = 'root',
  [int]$SshPort = 22,
  [string]$RemoteDir = '/opt/unyx-erp',
  [switch]$SkipUpload,
  [switch]$NoSeed
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
  $archive = Join-Path $env:TEMP 'unyx-erp-test.tar.gz'
  if (Test-Path $archive) { Remove-Item $archive -Force }

  Write-Host "==> Empaquetando proyecto (sin node_modules, .next, dist, .git ni .env*)..." -ForegroundColor Cyan
  Push-Location $repoRoot
  try {
    tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=.kilo --exclude=dist --exclude=.env --exclude=.env.local --exclude=.env.deploy -czf $archive .
    if ($LASTEXITCODE -ne 0) { throw 'tar fallo al empaquetar el proyecto.' }
  } finally {
    Pop-Location
  }

  $sizeMb = [math]::Round((Get-Item $archive).Length / 1MB, 1)
  Write-Host "==> Paquete listo ($sizeMb MB). Subiendo a ${target}..." -ForegroundColor Cyan
  & scp @scpArgs $archive "${target}:/tmp/unyx-erp-test.tar.gz"
  if ($LASTEXITCODE -ne 0) { throw 'scp fallo al subir el paquete.' }

  Write-Host "==> Extrayendo en $RemoteDir ..." -ForegroundColor Cyan
  & ssh @sshArgs $target "mkdir -p '$RemoteDir' && tar -xzf /tmp/unyx-erp-test.tar.gz -C '$RemoteDir' && rm -f /tmp/unyx-erp-test.tar.gz"
  if ($LASTEXITCODE -ne 0) { throw 'La extraccion remota fallo.' }
}

$seedFlag = if ($NoSeed) { ' --no-seed' } else { '' }
$remoteCmd = "cd '$RemoteDir' && sed -i 's/\r`$//' deploy/deploy-test.sh && " +
  "if [ \"`$(id -u)\" -eq 0 ]; then bash deploy/deploy-test.sh $VpsHost$seedFlag; " +
  "else sudo bash deploy/deploy-test.sh $VpsHost$seedFlag; fi"

Write-Host "==> Ejecutando despliegue en el VPS (SSH)..." -ForegroundColor Cyan
& ssh @sshArgs $target $remoteCmd
if ($LASTEXITCODE -ne 0) { throw 'El despliegue remoto fallo. Revisa la salida de arriba.' }

Write-Host ""
Write-Host "Listo. Link de pruebas:  http://${VpsHost}:3000" -ForegroundColor Green
Write-Host "Admin: admin@unyx.erp / Admin123!" -ForegroundColor Green
