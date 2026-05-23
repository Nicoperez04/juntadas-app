$ErrorActionPreference = 'Stop'

$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')

$adb = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adb) {
  Write-Error "adb no encontrado. Instalalo con: winget install Google.PlatformTools"
  exit 1
}

$devices = adb devices | Select-String -Pattern '^\w' | Where-Object { $_ -notmatch 'List of devices' }
if (-not $devices) {
  Write-Host ""
  Write-Host "No hay celular conectado por USB." -ForegroundColor Yellow
  Write-Host "1. Conecta el celular con cable USB"
  Write-Host "2. Activa Opciones de desarrollador > Depuracion USB"
  Write-Host "3. Acepta el dialogo 'Permitir depuracion USB' en el celular"
  Write-Host "4. Volvé a ejecutar: npm run start:usb"
  Write-Host ""
  exit 1
}

Write-Host "Dispositivo detectado. Configurando adb reverse..." -ForegroundColor Green
adb reverse tcp:8081 tcp:8081

Write-Host "Iniciando Expo en localhost (exp://127.0.0.1:8081)..." -ForegroundColor Green
npx expo start --localhost
