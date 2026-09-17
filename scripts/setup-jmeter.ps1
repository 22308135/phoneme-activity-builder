$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Portable tools only: no administrator access or system PATH changes.
$toolDirectory = Join-Path $env:LOCALAPPDATA 'PhonemeBuilderTools'
New-Item -ItemType Directory -Path $toolDirectory -Force | Out-Null
$jmeterVersion = '5.6.3'
$jmeterDirectory = Join-Path $toolDirectory "apache-jmeter-$jmeterVersion"
$javaDirectory = Join-Path $toolDirectory 'java17'

function Get-VerifiedArchive {
    param([string]$Url, [string]$Destination, [string]$Hash, [string]$Algorithm)
    if (-not (Test-Path -LiteralPath $Destination)) {
        Invoke-WebRequest -Uri $Url -OutFile $Destination -UseBasicParsing
    }
    $actual = (Get-FileHash -LiteralPath $Destination -Algorithm $Algorithm).Hash
    if ($actual -ne $Hash) { throw "Checksum mismatch for $Destination. Remove that archive and retry." }
}

if (-not (Test-Path -LiteralPath (Join-Path $jmeterDirectory 'bin/ApacheJMeter.jar'))) {
    Write-Host "Downloading Apache JMeter $jmeterVersion..."
    $archive = Join-Path $toolDirectory "apache-jmeter-$jmeterVersion.zip"
    $url = "https://downloads.apache.org/jmeter/binaries/apache-jmeter-$jmeterVersion.zip"
    $hashText = (Invoke-WebRequest -Uri "$url.sha512" -UseBasicParsing).Content
    $expectedHash = [regex]::Match($hashText, '[a-fA-F0-9]{128}').Value
    if (-not $expectedHash) { throw 'Apache did not return a SHA-512 checksum.' }
    Get-VerifiedArchive -Url $url -Destination $archive -Hash $expectedHash -Algorithm SHA512
    Expand-Archive -LiteralPath $archive -DestinationPath $toolDirectory -Force
}

if (-not (Test-Path -LiteralPath $javaDirectory)) { New-Item -ItemType Directory -Path $javaDirectory | Out-Null }
$javaExecutable = Get-ChildItem -LiteralPath $javaDirectory -Filter java.exe -Recurse | Select-Object -First 1
if (-not $javaExecutable) {
    Write-Host 'Downloading Eclipse Temurin Java 17 runtime...'
    $assets = Invoke-RestMethod -Uri 'https://api.adoptium.net/v3/assets/latest/17/hotspot?architecture=x64&image_type=jre&os=windows&vendor=eclipse'
    $package = $assets[0].binary.package
    $archive = Join-Path $toolDirectory $package.name
    Get-VerifiedArchive -Url $package.link -Destination $archive -Hash $package.checksum -Algorithm SHA256
    Expand-Archive -LiteralPath $archive -DestinationPath $javaDirectory -Force
    $javaExecutable = Get-ChildItem -LiteralPath $javaDirectory -Filter java.exe -Recurse | Select-Object -First 1
}
if (-not $javaExecutable) { throw 'Java runtime could not be located after extraction.' }

$configuration = @{ java = $javaExecutable.FullName; jmeterJar = (Join-Path $jmeterDirectory 'bin/ApacheJMeter.jar'); jmeterVersion = $jmeterVersion }
$configuration | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $toolDirectory 'toolchain.json') -Encoding UTF8
& $javaExecutable.FullName -version
Write-Host "Portable JMeter tools are ready in $toolDirectory"
