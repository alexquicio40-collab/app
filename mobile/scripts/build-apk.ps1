$ErrorActionPreference = "Stop"

$project = Split-Path $PSScriptRoot -Parent
$androidHome = "C:\Users\Alex\AppData\Local\Android\Sdk"
if (-not (Test-Path $androidHome)) {
  $androidHome = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}
$javaHome = "C:\Program Files\Android\Android Studio\jbr"
if (-not (Test-Path (Join-Path $javaHome "bin\java.exe"))) {
  throw "No está el JDK de Android Studio en $javaHome"
}
$javaVersion = (cmd /c "`"$(Join-Path $javaHome 'bin\java.exe')`" -version 2>&1" | Out-String)
if ($javaVersion -notmatch 'version "(\d+)') {
  throw "No se pudo leer la versión de Java en ${javaHome}: $javaVersion"
}
if ([int]$Matches[1] -ge 21) {
  $jdk17 = Get-ChildItem (Join-Path $env:LOCALAPPDATA "jdk-17") -Directory -ErrorAction SilentlyContinue |
    Where-Object { Test-Path (Join-Path $_.FullName "bin\java.exe") } |
    Select-Object -First 1
  if (-not $jdk17) { throw "Android Studio trae Java $($Matches[1]) y esta app necesita JDK 17 para compilar el código nativo." }
  Write-Host "Android Studio usa Java $($Matches[1]). La compilación nativa usa JDK 17."
  $javaHome = $jdk17.FullName
}
$shortRoot = "C:\u"

$env:ANDROID_HOME = $androidHome
$env:ANDROID_SDK_ROOT = $androidHome
$env:JAVA_HOME = $javaHome
$env:PATH = "$javaHome\bin;$androidHome\platform-tools;$env:PATH"
$env:CI = "1"

if (-not (Test-Path $androidHome)) {
  throw "No está el Android SDK en $androidHome"
}

if (-not (Test-Path $shortRoot)) {
  cmd /c "mklink /J `"$shortRoot`" `"$project`""
  if (-not (Test-Path $shortRoot)) { throw "No se pudo crear el enlace C:\u" }
}

$cred = Get-Content (Join-Path $project "credentials.json") -Raw | ConvertFrom-Json
$keystore = (Resolve-Path (Join-Path $project $cred.android.keystore.keystorePath)).Path

$appJsonPath = Join-Path $project "app.json"
$appJson = [System.IO.File]::ReadAllText($appJsonPath)
if ($appJson -notmatch '"versionCode"\s*:\s*(\d+)') {
  throw "app.json no tiene android.versionCode"
}
$nextCode = [int]$Matches[1] + 1
$appJson = [regex]::Replace($appJson, '"versionCode"\s*:\s*\d+', ('"versionCode": ' + $nextCode), 1)
if ($appJson -notmatch '"version"\s*:\s*"(\d+)\.(\d+)\.(\d+)"') {
  throw "app.json no tiene version con formato x.y.z"
}
$nextVersion = "{0}.{1}.{2}" -f $Matches[1], $Matches[2], ([int]$Matches[3] + 1)
$appJson = [regex]::Replace($appJson, '"version"\s*:\s*"\d+\.\d+\.\d+"', ('"version": "' + $nextVersion + '"'), 1)
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($appJsonPath, $appJson, $utf8)
Write-Host "Versión $nextVersion · versionCode $nextCode"

# App y caché nativa de cero: si se reutiliza android/, Gradle mezcla el FGS viejo.
$androidDir = Join-Path $project "android"
if (Test-Path $androidDir) {
  cmd /c "rmdir /s /q `"$androidDir`""
}
foreach ($rel in @(".expo", "node_modules\.cache")) {
  $dir = Join-Path $project $rel
  if (Test-Path $dir) { cmd /c "rmdir /s /q `"$dir`"" }
}

Set-Location $project
npx expo prebuild --platform android --clean
if ($LASTEXITCODE -ne 0) { throw "expo prebuild terminó con código $LASTEXITCODE" }

$cxx = Join-Path $shortRoot "android\app\.cxx"
if (Test-Path $cxx) {
  cmd /c "rmdir /s /q `"$cxx`""
}

# Caché nativa vieja dentro de las librerías. Si se deja, Ninja entra en bucle en Windows.
$nativeCaches = @(
  "react-native-reanimated\android\.cxx",
  "react-native-screens\android\.cxx",
  "react-native-worklets\android\.cxx",
  "react-native-gesture-handler\android\.cxx",
  "expo-modules-core\android\.cxx"
)
foreach ($rel in $nativeCaches) {
  $dir = Join-Path $project "node_modules\$rel"
  if (Test-Path $dir) { cmd /c "rmdir /s /q `"$dir`"" }
}

# CMake 3.22 entra en bucle con Ninja en Windows. El SDK tiene 3.30.5.
$initScript = Join-Path $PSScriptRoot "pin-cmake.gradle"

# Expo a veces cachea packageName=com.bioclim (nombre de la app) y el compile explota.
foreach ($alink in @(
  (Join-Path $shortRoot "android\build\generated\autolinking"),
  (Join-Path $shortRoot "android\app\build\generated\autolinking")
)) {
  if (Test-Path $alink) { cmd /c "rmdir /s /q `"$alink`"" }
}

Set-Location (Join-Path $shortRoot "android")
.\gradlew.bat clean --no-daemon --init-script $initScript
if ($LASTEXITCODE -ne 0) { throw "Gradle clean terminó con código $LASTEXITCODE" }
.\gradlew.bat assembleRelease --no-daemon --init-script $initScript "-PreactNativeArchitectures=armeabi-v7a,arm64-v8a" "-Pandroid.injected.signing.store.file=$keystore" "-Pandroid.injected.signing.store.password=$($cred.android.keystore.keystorePassword)" "-Pandroid.injected.signing.key.alias=$($cred.android.keystore.keyAlias)" "-Pandroid.injected.signing.key.password=$($cred.android.keystore.keyPassword)"
if ($LASTEXITCODE -ne 0) { throw "Gradle terminó con código $LASTEXITCODE" }

$apk = Join-Path $shortRoot "android\app\build\outputs\apk\release\app-release.apk"
$outDir = Join-Path $project "dist"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$apkName = "ubicacion-$nextVersion.apk"
Copy-Item $apk (Join-Path $outDir $apkName) -Force
Write-Host "APK lista: $outDir\$apkName"
