[CmdletBinding()]
param(
    [switch] $List,
    [switch] $NoRestore
)

& (Join-Path $PSScriptRoot "../Shared/Scripts/Invoke-Benchmark.ps1") `
    -Name "strongly-typed-values" `
    -ProjectPath (Join-Path $PSScriptRoot "bench/SSW.Benchmarks.StronglyTypedValues.Benchmarks/SSW.Benchmarks.StronglyTypedValues.Benchmarks.csproj") `
    -Filter "*OrderValueBenchmarks*" `
    -List:$List `
    -NoRestore:$NoRestore
