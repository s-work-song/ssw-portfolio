[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $Name,

    [Parameter(Mandatory)]
    [string] $SolutionPath,

    [switch] $NoRestore
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$resolvedSolutionPath = (Resolve-Path -LiteralPath $SolutionPath).Path
$dotnetArguments = @("test", $resolvedSolutionPath, "-c", "Release")

if ($NoRestore) {
    $dotnetArguments += "--no-restore"
}

Write-Host "`n==> $Name tests"
& dotnet @dotnetArguments 2>&1 | Tee-Object -Variable testOutput
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    throw "$Name tests failed with exit code $exitCode."
}

$outputText = $testOutput | Out-String
if ($outputText -notmatch "Passed!|통과!") {
    throw "$Name test command exited successfully but did not report any executed tests. Restore the project and try again."
}
