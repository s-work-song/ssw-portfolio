[CmdletBinding()]
param([switch] $NoRestore)

& (Join-Path $PSScriptRoot "../Shared/Scripts/Invoke-Tests.ps1") `
    -Name "serialization-protobuf" `
    -SolutionPath (Join-Path $PSScriptRoot "SSW.Benchmarks.SerializationProtobuf.sln") `
    -NoRestore:$NoRestore
