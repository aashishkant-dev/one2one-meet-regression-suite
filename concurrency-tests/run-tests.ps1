# Concurrency Test Suite - Execution Script
# Run this script: .\run-tests.ps1

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     One2One Meet - Concurrency Test Suite Executor            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Display menu
Write-Host "Select test category to run:" -ForegroundColor Cyan
Write-Host "  1) Full Suite (all tests - ~30 min)" -ForegroundColor White
Write-Host "  2) Case 1 & 2 Only (basic and sponsor races - ~5 min)" -ForegroundColor White
Write-Host "  3) Session Races (idempotency tests - ~10 min)" -ForegroundColor White
Write-Host "  4) Event Setup (configuration races - ~8 min)" -ForegroundColor White
Write-Host "  5) Single Test (interactive selection)" -ForegroundColor White
Write-Host "  6) Headed Mode - Full Suite with browser visible" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

Write-Host ""
Write-Host "🚀 Starting tests..." -ForegroundColor Green
Write-Host ""

$startTime = Get-Date

switch ($choice) {
    "1" {
        Write-Host "Running: FULL TEST SUITE" -ForegroundColor Yellow
        npm test
    }
    "2" {
        Write-Host "Running: Case 1 & 2 Tests" -ForegroundColor Yellow
        npx playwright test 01-case1-basic-race 02-case1-nway-race 03-case2-sponsor-race 04-case3-isolation
    }
    "3" {
        Write-Host "Running: Session & Idempotency Races" -ForegroundColor Yellow
        npx playwright test 05-idempotency-session-races 06-advanced-races
    }
    "4" {
        Write-Host "Running: Event Setup Races" -ForegroundColor Yellow
        npx playwright test 07-event-setup-races
    }
    "5" {
        Write-Host "Available test files:" -ForegroundColor Yellow
        Get-ChildItem "tests/*.spec.ts" | ForEach-Object { Write-Host "  - $($_.BaseName)" }
        $testFile = Read-Host "Enter test file name (without .spec.ts)"
        npx playwright test $testFile
    }
    "6" {
        Write-Host "Running: FULL TEST SUITE (headed mode)" -ForegroundColor Yellow
        npm run test:headed
    }
    default {
        Write-Host "Invalid choice. Running full suite..." -ForegroundColor Yellow
        npm test
    }
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ Test execution completed in $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Results saved to:" -ForegroundColor Cyan
Write-Host "   • CSV: test-reports/concurrency-test-results.csv" -ForegroundColor White
Write-Host "   • TSV: test-reports/concurrency-test-results.tsv (for Excel)" -ForegroundColor White
Write-Host "   • JSON: test-reports/concurrency-test-results.json" -ForegroundColor White
Write-Host ""

Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Open: test-reports/concurrency-test-results.tsv" -ForegroundColor White
Write-Host "   2. Copy all (Ctrl+A)" -ForegroundColor White
Write-Host "   3. Paste into your Excel sheet's 'Actual Result' column" -ForegroundColor White
Write-Host ""

# Ask if user wants to view HTML report
$showReport = Read-Host "View detailed HTML report? (y/n)"
if ($showReport -eq "y" -or $showReport -eq "yes") {
    Write-Host "Opening HTML report..." -ForegroundColor Yellow
    npm run test:report
}

Write-Host "Done! ✓" -ForegroundColor Green
