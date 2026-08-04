[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $Name,

    [Parameter(Mandatory)]
    [string] $ProjectPath,

    [Parameter(Mandatory)]
    [string] $Filter,

    [switch] $List,

    [switch] $NoRestore
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$resolvedProjectPath = (Resolve-Path -LiteralPath $ProjectPath).Path
$dotnetArguments = @("run", "-c", "Release")

if ($NoRestore) {
    $dotnetArguments += "--no-restore"
}
$dotnetArguments += @("--project", $resolvedProjectPath, "--")

if ($List) {
    $dotnetArguments += @("--list", "flat")
}
else {
    # 배열 원소로 넘기면 PowerShell이 *를 파일 와일드카드로 확장하지 않습니다.
    $dotnetArguments += @("--filter", $Filter)
}

$action = if ($List) { "benchmark list" } else { "benchmarks" }
$projectDirectory = Split-Path -Parent $resolvedProjectPath

Write-Host "`n==> $Name $action"
Push-Location $projectDirectory
try {
    & dotnet @dotnetArguments 2>&1 | Tee-Object -Variable benchmarkOutput
    $exitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

if ($exitCode -ne 0) {
    throw "$Name $action failed with exit code $exitCode."
}

if (-not $List) {
    $outputText = $benchmarkOutput | Out-String
    $benchmarkFailed = $outputText -match
        "BenchmarkDotNet has failed to build|There are not any results runs|executed benchmarks: 0"

    if ($benchmarkFailed) {
        throw "$Name BenchmarkDotNet did not produce a measurement. Review the build output above."
    }
}
