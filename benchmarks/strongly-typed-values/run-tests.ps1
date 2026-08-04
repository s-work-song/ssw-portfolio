[CmdletBinding()]
param([switch] $NoRestore)

& (Join-Path $PSScriptRoot "../Shared/Scripts/Invoke-Tests.ps1") `
    -Name "strongly-typed-values" `
    -SolutionPath (Join-Path $PSScriptRoot "StronglyTypedValues.sln") `
    -NoRestore:$NoRestore
