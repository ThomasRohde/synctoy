<#
.SYNOPSIS
    Send a URL or text message to your Synctoy inbox via Dexie Cloud REST API.

.DESCRIPTION
    This script authenticates with Dexie Cloud and sends items directly to a user's inbox.
    
    Credentials are read from environment variables:
      - DEXIE_CLOUD_URL: The database URL (e.g., https://zw1o9u4na.dexie.cloud)
      - DEXIE_CLIENT_ID: Client ID from dexie-cloud.key
      - DEXIE_CLIENT_SECRET: Client secret from dexie-cloud.key

    To set these permanently (run once in PowerShell as admin or user):
      [Environment]::SetEnvironmentVariable("DEXIE_CLOUD_URL", "https://xxx.dexie.cloud", "User")
      [Environment]::SetEnvironmentVariable("DEXIE_CLIENT_ID", "your-client-id", "User")
      [Environment]::SetEnvironmentVariable("DEXIE_CLIENT_SECRET", "your-client-secret", "User")

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

# Read credentials from environment variables
$DbUrl = $env:DEXIE_CLOUD_URL
$ClientId = $env:DEXIE_CLIENT_ID
$ClientSecret = $env:DEXIE_CLIENT_SECRET

if (-not $DbUrl -or -not $ClientId -or -not $ClientSecret) {
    Write-Error @"
Missing environment variables. Please set:
  DEXIE_CLOUD_URL     - Database URL (e.g., https://xxx.dexie.cloud)
  DEXIE_CLIENT_ID     - Client ID from dexie-cloud.key
  DEXIE_CLIENT_SECRET - Client secret from dexie-cloud.key

To set permanently (run in PowerShell):
  [Environment]::SetEnvironmentVariable("DEXIE_CLOUD_URL", "https://xxx.dexie.cloud", "User")
  [Environment]::SetEnvironmentVariable("DEXIE_CLIENT_ID", "your-client-id", "User")
  [Environment]::SetEnvironmentVariable("DEXIE_CLIENT_SECRET", "your-client-secret", "User")

Then restart your terminal.
"@
    exit 1
}

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
