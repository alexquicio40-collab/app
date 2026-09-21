$ErrorActionPreference = "Stop"

$project = Split-Path $PSScriptRoot -Parent
$androidHome = "C:\Users\Alex\AppData\Local\Android\Sdk"
$javaHome = "C:\Program Files\Android\Android Studio\jbr"
$shortRoot = "C:\u"

$env:ANDROID_HOME = $androidHome
$env:ANDROID_SDK_ROOT = $androidHome
$env:JAVA_HOME = $javaHome
$env:PATH = "$javaHome\bin;$androidHome\platform-tools;$env:PATH"
$env:CI = "1"

if (-not (Test-Path $shortRoot)) {
  cmd /c "mklink /J `"$shortRoot`" `"$project`""
}

Set-Location $project
npx expo prebuild --platform android

$cxx = Join-Path $shortRoot "android\app\.cxx"
if (Test-Path $cxx) {
  cmd /c "rmdir /s /q `"$cxx`""
}

Set-Location (Join-Path $shortRoot "android")
.\gradlew.bat assembleRelease --no-daemon "-PreactNativeArchitectures=armeabi-v7a,arm64-v8a"

$apk = Join-Path $shortRoot "android\app\build\outputs\apk\release\app-release.apk"
$outDir = Join-Path $project "dist"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Copy-Item $apk (Join-Path $outDir "ubicacion-1.0.0.apk") -Force
Write-Host "APK lista: $outDir\ubicacion-1.0.0.apk"
