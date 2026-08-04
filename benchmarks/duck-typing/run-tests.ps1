[CmdletBinding()]
param([switch] $NoRestore)

& (Join-Path $PSScriptRoot "../Shared/Scripts/Invoke-Tests.ps1") `
    -Name "duck-typing" `
    -SolutionPath (Join-Path $PSScriptRoot "DuckTyping.sln") `
    -NoRestore:$NoRestore
