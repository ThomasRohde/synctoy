<#
.SYNOPSIS
    Send a URL or text message to your Synctoy inbox via Dexie Cloud REST API.

.DESCRIPTION
    This script reads credentials from dexie-cloud.key and dexie-cloud.json,
    authenticates with Dexie Cloud, and sends items directly to a user's inbox.

.PARAMETER Url
    A URL to send. Mutually exclusive with -Text.

.PARAMETER Text
    A text message to send. Mutually exclusive with -Url.

.PARAMETER Title
    Optional title for the item. Defaults to URL domain or first 50 chars of text.

.PARAMETER To
    Target user email. Required - specifies which user's inbox to send to.

.PARAMETER DeviceName
    Name shown as sender. Defaults to "PowerShell".

.PARAMETER TargetCategory
    Target device category: 'any', 'work', 'personal', 'home'. Defaults to 'any'.

.EXAMPLE
    .\Send-Handoff.ps1 -Url "https://github.com" -To "user@example.com"

.EXAMPLE
    .\Send-Handoff.ps1 -Text "Remember to check the logs" -To "user@example.com" -Title "Reminder"

.EXAMPLE
    .\Send-Handoff.ps1 -Url "https://docs.microsoft.com" -To "user@example.com" -TargetCategory work
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false, ParameterSetName = 'Url')]
    [string]$Url,

    [Parameter(Mandatory = $false, ParameterSetName = 'Text')]
    [string]$Text,

    [Parameter(Mandatory = $true)]
    [string]$To,

    [Parameter(Mandatory = $false)]
    [string]$Title,

    [Parameter(Mandatory = $false)]
    [string]$DeviceName = "PowerShell",

    [Parameter(Mandatory = $false)]
    [ValidateSet('any', 'work', 'personal', 'home')]
    [string]$TargetCategory = "any"
)

# Determine script directory for relative paths
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $ScriptDir) {
    $ScriptDir = Get-Location
}

# Load configuration files
$KeyFile = Join-Path $ScriptDir "dexie-cloud.key"
$ConfigFile = Join-Path $ScriptDir "dexie-cloud.json"

if (-not (Test-Path $KeyFile)) {
    Write-Error "dexie-cloud.key not found at $KeyFile"
    exit 1
}

if (-not (Test-Path $ConfigFile)) {
    Write-Error "dexie-cloud.json not found at $ConfigFile"
    exit 1
}

# Parse configuration
$Config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
$DbUrl = $Config.dbUrl

$KeyData = Get-Content $KeyFile -Raw | ConvertFrom-Json
$Credentials = $KeyData.$DbUrl

if (-not $Credentials) {
    Write-Error "No credentials found for $DbUrl in dexie-cloud.key"
    exit 1
}

$ClientId = $Credentials.clientId
$ClientSecret = $Credentials.clientSecret

# Validate input
if (-not $Url -and -not $Text) {
    Write-Error "Either -Url or -Text must be specified"
    exit 1
}

# Get access token
Write-Verbose "Authenticating with Dexie Cloud..."

$TokenBody = @{
    grant_type = "client_credentials"
    scopes = @("ACCESS_DB", "GLOBAL_READ", "GLOBAL_WRITE")
    client_id = $ClientId
    client_secret = $ClientSecret
} | ConvertTo-Json

try {
    $TokenResponse = Invoke-RestMethod -Uri "$DbUrl/token" -Method POST -ContentType "application/json" -Body $TokenBody
    $Token = $TokenResponse.accessToken
} catch {
    Write-Error "Failed to get access token: $_"
    exit 1
}

if (-not $Token) {
    Write-Error "No access token received"
    exit 1
}

Write-Verbose "Authentication successful"

# Build the item
$Now = [long]([DateTime]::UtcNow - [DateTime]::new(1970, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)).TotalMilliseconds

if ($Url) {
    # URL item
    $Kind = "url"
    $Content = @{ url = $Url }
    
    if (-not $Title) {
        # Extract domain as default title
        try {
            $Uri = [System.Uri]::new($Url)
            $Title = $Uri.Host
        } catch {
            $Title = "Shared Link"
        }
    }
} else {
    # Text item
    $Kind = "text"
    $Content = @{ text = $Text }
    
    if (-not $Title) {
        # Use first 50 chars as title
        if ($Text.Length -gt 50) {
            $Title = $Text.Substring(0, 47) + "..."
        } else {
            $Title = $Text
        }
    }
}

$Item = @{
    kind = $Kind
    status = "new"
    realmId = $To
    owner = $To
    content = $Content
    title = $Title
    senderDeviceName = $DeviceName
    senderCategory = "any"
    targetCategory = $TargetCategory
    isSensitive = $false
    createdAt = $Now
    updatedAt = $Now
}

$ItemJson = $Item | ConvertTo-Json -Depth 5

Write-Verbose "Sending item to $To..."
Write-Verbose $ItemJson

# Send the item
$Headers = @{
    Authorization = "Bearer $Token"
    "Content-Type" = "application/json"
}

try {
    $Response = Invoke-RestMethod -Uri "$DbUrl/all/handoffItems" -Method POST -Headers $Headers -Body $ItemJson
    
    Write-Host "✓ Sent successfully!" -ForegroundColor Green
    Write-Host "  ID: $Response" -ForegroundColor DarkGray
    Write-Host "  To: $To" -ForegroundColor DarkGray
    Write-Host "  Type: $Kind" -ForegroundColor DarkGray
    Write-Host "  Title: $Title" -ForegroundColor DarkGray
} catch {
    Write-Error "Failed to send item: $_"
    exit 1
}
