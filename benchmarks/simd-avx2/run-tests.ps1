[CmdletBinding()]
param([switch] $NoRestore)

& (Join-Path $PSScriptRoot "../Shared/Scripts/Invoke-Tests.ps1") `
    -Name "simd-avx2" `
    -SolutionPath (Join-Path $PSScriptRoot "SSW.Benchmarks.SimdAvx2.sln") `
    -NoRestore:$NoRestore
