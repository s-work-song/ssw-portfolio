[CmdletBinding()]
param([switch] $NoRestore)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectPath = Join-Path $PSScriptRoot "bench/SSW.Benchmarks.SerializationProtobuf.Benchmarks/SSW.Benchmarks.SerializationProtobuf.Benchmarks.csproj"
$dotnetArguments = @("run", "-c", "Release")

if ($NoRestore) {
    $dotnetArguments += "--no-restore"
}
$dotnetArguments += @("--project", $projectPath, "--", "--size-only")

Write-Host "`n==> serialization-protobuf payload size report"
& dotnet @dotnetArguments

if ($LASTEXITCODE -ne 0) {
    throw "serialization-protobuf size report failed with exit code $LASTEXITCODE."
}
