[CmdletBinding()]
param(
    [switch] $List,
    [switch] $NoRestore
)

& (Join-Path $PSScriptRoot "../Shared/Scripts/Invoke-Benchmark.ps1") `
    -Name "serialization-protobuf" `
    -ProjectPath (Join-Path $PSScriptRoot "bench/SSW.Benchmarks.SerializationProtobuf.Benchmarks/SSW.Benchmarks.SerializationProtobuf.Benchmarks.csproj") `
    -Filter "*FrameSerializationBenchmarks*" `
    -List:$List `
    -NoRestore:$NoRestore
