[CmdletBinding()]
param(
    [switch] $List,
    [switch] $NoRestore
)

& (Join-Path $PSScriptRoot "../Shared/Scripts/Invoke-Benchmark.ps1") `
    -Name "simd-avx2" `
    -ProjectPath (Join-Path $PSScriptRoot "bench/SSW.Benchmarks.SimdAvx2.Benchmarks/SSW.Benchmarks.SimdAvx2.Benchmarks.csproj") `
    -Filter "*RangeSumBenchmarks*" `
    -List:$List `
    -NoRestore:$NoRestore
