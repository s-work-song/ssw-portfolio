[CmdletBinding()]
param(
    [switch] $List,
    [switch] $NoRestore
)

& (Join-Path $PSScriptRoot "../Shared/Scripts/Invoke-Benchmark.ps1") `
    -Name "counting-sort" `
    -ProjectPath (Join-Path $PSScriptRoot "bench/SSW.Benchmarks.CountingSort.Benchmarks/SSW.Benchmarks.CountingSort.Benchmarks.csproj") `
    -Filter "*CountingSortBenchmarks*" `
    -List:$List `
    -NoRestore:$NoRestore
