# Prueba E2E del flujo completo contra el servidor local.
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'  # evita el ruido de la barra de progreso
$base = 'http://localhost:3000'
$fail = 0
function Ok($m)  { Write-Host "OK  $m" }
function Bad($m) { Write-Host "FAIL $m"; $script:fail++ }

# --- Sesiones ---
$admin   = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$cliente = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# 1) Login admin incorrecto
try {
  Invoke-RestMethod -Uri "$base/api/admin/login" -Method Post -ContentType 'application/json' -Body (@{user='admin';password='malo'} | ConvertTo-Json) -WebSession $admin | Out-Null
  Bad 'login incorrecto fue aceptado'
} catch { Ok "login incorrecto rechazado (403)" }

# 2) Login admin correcto
$r = Invoke-RestMethod -Uri "$base/api/admin/login" -Method Post -ContentType 'application/json' -Body (@{user='admin';password='12345'} | ConvertTo-Json) -WebSession $admin
if ($r.authenticated) { Ok 'login admin' } else { Bad 'login admin sin authenticated' }

# 3) Crear enlace
$link = Invoke-RestMethod -Uri "$base/api/admin/links" -Method Post -ContentType 'application/json' -Body (@{name='Empresa Prueba SA'} | ConvertTo-Json) -WebSession $admin
if ($link.slug -and $link.password) { Ok "enlace creado slug=$($link.slug)" } else { Bad 'enlace sin slug/password' }

# 4) Listar
$lista = Invoke-RestMethod -Uri "$base/api/admin/links" -WebSession $admin
$encontrado = $lista.links | Where-Object { $_.slug -eq $link.slug }
if ($encontrado) { Ok "listar encuentra el enlace (total=$($lista.links.Count))" } else { Bad "listar no encuentra el enlace (total=$($lista.links.Count))" }

# 5) Empresa password incorrecta
try {
  Invoke-RestMethod -Uri "$base/api/auth/$($link.slug)" -Method Post -ContentType 'application/json' -Body (@{password='mala'} | ConvertTo-Json) -WebSession $cliente | Out-Null
  Bad 'password empresa incorrecta aceptada'
} catch { Ok 'password empresa incorrecta rechazada (403)' }

# 6) Empresa login correcto
$r = Invoke-RestMethod -Uri "$base/api/auth/$($link.slug)" -Method Post -ContentType 'application/json' -Body (@{password=$link.password} | ConvertTo-Json) -WebSession $cliente
if ($r.authenticated) { Ok 'auth empresa' } else { Bad 'auth empresa sin authenticated' }

# 7) Crear ZIP de prueba (5 MB)
$zipPath = "$env:TEMP\scorm_prueba.zip"
$bytes = New-Object byte[] (5MB)
(New-Object Random).NextBytes($bytes)
[System.IO.File]::WriteAllBytes($zipPath, $bytes)
$origLen = (Get-Item $zipPath).Length
Ok "ZIP de prueba creado ($origLen bytes)"

# 8) Subir
$up = Invoke-RestMethod -Uri "$base/api/upload/$($link.slug)" -Method Post -Headers @{'x-file-name'='scorm_prueba.zip'} -ContentType 'application/zip' -InFile $zipPath -WebSession $cliente
if ($up.file.originalName -eq 'scorm_prueba.zip' -and $up.file.extension -eq 'zip') { Ok "subida: $($up.file.originalName) bytes=$($up.file.sizeBytes)" } else { Bad 'subida sin metadatos correctos' }

# 9) Detalle admin
$det = Invoke-RestMethod -Uri "$base/api/admin/links/$($link.id)" -WebSession $admin
if ($det.file -and $det.file.originalName -eq 'scorm_prueba.zip') { Ok "detalle con archivo ext=$($det.file.extension)" } else { Bad 'detalle sin archivo' }

# 10) Descargar y comparar integridad
$dlPath = "$env:TEMP\descargado.zip"
if (Test-Path $dlPath) { Remove-Item $dlPath -Force }
Invoke-WebRequest -Uri "$base/api/admin/links/$($link.id)/file" -WebSession $admin -OutFile $dlPath -UseBasicParsing
$dlLen = (Get-Item $dlPath).Length
if ($dlLen -eq $origLen) {
  $h1 = (Get-FileHash $zipPath -Algorithm SHA256).Hash
  $h2 = (Get-FileHash $dlPath -Algorithm SHA256).Hash
  if ($h1 -eq $h2) { Ok "descarga integra ($dlLen bytes, hash coincide)" } else { Bad "descarga tamano ok pero hash distinto" }
} else { Bad "descarga tamano $dlLen != $origLen" }

# 11) Rechazo no-zip
try {
  $txt = "$env:TEMP\noeszip.txt"; 'hola' | Out-File $txt
  Invoke-RestMethod -Uri "$base/api/upload/$($link.slug)" -Method Post -Headers @{'x-file-name'='noeszip.txt'} -ContentType 'text/plain' -InFile $txt -WebSession $cliente | Out-Null
  Bad 'archivo no-zip aceptado'
} catch { Ok 'archivo no-zip rechazado (415)' }

# 12) Eliminar
$r = Invoke-RestMethod -Uri "$base/api/admin/links/$($link.id)" -Method Delete -WebSession $admin
if ($r.deleted) { Ok 'enlace eliminado' } else { Bad 'eliminar sin deleted' }

# 13) Revocacion: status 404
try {
  Invoke-RestMethod -Uri "$base/api/u/$($link.slug)/status" | Out-Null
  Bad 'enlace accesible tras eliminar'
} catch { Ok 'revocacion confirmada (404)' }

# 14) Archivo fisico borrado
$dir = Join-Path (Get-Location) "storage\$($link.slug)"
if (Test-Path $dir) { Bad "carpeta storage persiste: $dir" } else { Ok 'archivo fisico eliminado' }

Write-Host ""
if ($fail -eq 0) { Write-Host "=== TODOS LOS CASOS OK ===" } else { Write-Host "=== $fail CASO(S) FALLIDO(S) ===" }
