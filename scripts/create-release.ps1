#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    [string]$Message = "Release version $Version"
)

# Validate version format (basic check)
if ($Version -notmatch '^v?\d+\.\d+\.\d+$') {
    Write-Error "Version must be in format 'x.y.z' or 'vx.y.z'"
    exit 1
}

# Ensure version starts with 'v'
if (-not $Version.StartsWith('v')) {
    $Version = "v$Version"
}

# Extract version number without 'v' prefix for package.json
$PackageVersion = $Version.Substring(1)

Write-Host "Creating release $Version..." -ForegroundColor Green

try {
    # Update package.json version
    Write-Host "Updating package.json version to $PackageVersion..." -ForegroundColor Yellow
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    $packageJson.version = $PackageVersion
    $packageJson | ConvertTo-Json -Depth 100 | Set-Content "package.json"
    
    # Stage changes
    Write-Host "Staging changes..." -ForegroundColor Yellow
    git add .
    
    # Commit changes
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m "Bump version to $PackageVersion"
    
    # Create and push tag
    Write-Host "Creating tag $Version..." -ForegroundColor Yellow
    git tag $Version
    
    Write-Host "Pushing changes and tag to GitHub..." -ForegroundColor Yellow
    git push origin HEAD
    git push origin $Version
    
    Write-Host "" -ForegroundColor Green
    Write-Host "✅ Release $Version created successfully!" -ForegroundColor Green
    Write-Host "🚀 GitHub Actions will automatically build and publish the release." -ForegroundColor Green
    Write-Host "📦 Check the Actions tab on GitHub to monitor the build progress." -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    
} catch {
    Write-Error "Failed to create release: $_"
    exit 1
} 