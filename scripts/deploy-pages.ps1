# Cloudflare Pages Automated Production Build & Deploy Script for LedgerLoom
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Building & Deploying LedgerLoom to Cloudflare Pages " -ForegroundColor Cyan
Write-Host " Target URL: https://ledgerloom-cfo.pages.dev       " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

$workspaceRoot = $PSScriptRoot + "\.."
Set-Location $workspaceRoot

try {
    # 1. Temporarily move server API routes aside for static HTML/JS export
    if (Test-Path "src\app\api") {
        Write-Host "--> Moving server API routes aside temporarily..." -ForegroundColor Yellow
        Move-Item -Path "src\app\api" -Destination "src\api_routes_backup" -Force
    }

    # 2. Configure next.config.mjs for static export
    $originalConfig = Get-Content "next.config.mjs" -Raw
    $exportConfig = @"
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  serverExternalPackages: ['xlsx'],
  allowedDevOrigins: ['*.trycloudflare.com', '*.cfargotunnel.com'],
};

export default nextConfig;
"@
    Set-Content -Path "next.config.mjs" -Value $exportConfig

    # 3. Clean stale build caches
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    }
    if (Test-Path "out") {
        Remove-Item -Recurse -Force "out" -ErrorAction SilentlyContinue
    }

    # 4. Run Next.js static production build
    Write-Host "--> Compiling optimized production bundle with Next.js Turbopack..." -ForegroundColor Green
    npx next build
    if ($LASTEXITCODE -ne 0) {
        throw "Next.js build failed!"
    }

    # 5. Restore server API routes and original config
    if (Test-Path "src\api_routes_backup") {
        Write-Host "--> Restoring server API routes..." -ForegroundColor Yellow
        Move-Item -Path "src\api_routes_backup" -Destination "src\app\api" -Force
    }
    Set-Content -Path "next.config.mjs" -Value $originalConfig

    # 6. Deploy to Cloudflare Pages Production
    Write-Host "--> Uploading production bundle to Cloudflare Global Edge..." -ForegroundColor Green
    npx wrangler pages deploy out --project-name ledgerloom-cfo --branch main --commit-dirty=true
    if ($LASTEXITCODE -ne 0) {
        throw "Cloudflare Pages deployment failed!"
    }

    Write-Host "`n✨ SUCCESS! LedgerLoom is LIVE on Cloudflare Pages:" -ForegroundColor Cyan
    Write-Host "👉 https://ledgerloom-cfo.pages.dev" -ForegroundColor Green
}
catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
    # Safeguard: always restore files if anything failed
    if (Test-Path "src\api_routes_backup") {
        Move-Item -Path "src\api_routes_backup" -Destination "src\app\api" -Force -ErrorAction SilentlyContinue
    }
    if ($originalConfig) {
        Set-Content -Path "next.config.mjs" -Value $originalConfig -ErrorAction SilentlyContinue
    }
    exit 1
}
finally {
    if (Test-Path "src\api_routes_backup") {
        Move-Item -Path "src\api_routes_backup" -Destination "src\app\api" -Force -ErrorAction SilentlyContinue
    }
}
