[CmdletBinding()]
param(
    [switch] $List,
    [switch] $NoRestore
)

& (Join-Path $PSScriptRoot "../Shared/Scripts/Invoke-Benchmark.ps1") `
    -Name "duck-typing" `
    -ProjectPath (Join-Path $PSScriptRoot "bench/SSW.Benchmarks.DuckTyping.Benchmarks/SSW.Benchmarks.DuckTyping.Benchmarks.csproj") `
    -Filter "*TokenEnumerationBenchmarks*" `
    -List:$List `
    -NoRestore:$NoRestore
