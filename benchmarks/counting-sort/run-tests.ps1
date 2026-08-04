[CmdletBinding()]
param([switch] $NoRestore)

& (Join-Path $PSScriptRoot "../Shared/Scripts/Invoke-Tests.ps1") `
    -Name "counting-sort" `
    -SolutionPath (Join-Path $PSScriptRoot "SSW.Benchmarks.CountingSort.sln") `
    -NoRestore:$NoRestore
