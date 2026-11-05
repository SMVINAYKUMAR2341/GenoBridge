# Authentication Testing Script for Helix PostgreSQL Verification
# Tests signup, login, logout, password reset, role restrictions, and session management

$baseUrl = "http://localhost:3000"
$testResults = @()

function Test-AuthEndpoint {
    param(
        [string]$TestName,
        [string]$Endpoint,
        [string]$Method = "POST",
        [object]$Body,
        [int]$ExpectedStatus,
        [string]$Description
    )
    
    try {
        $result = @{
            TestName = $TestName
            Description = $Description
            Status = "FAIL"
            ExpectedStatus = $ExpectedStatus
            ActualStatus = $null
            Error = $null
            Details = $null
        }
        
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri "$baseUrl$Endpoint" -Method $Method -UseBasicParsing -ErrorAction Stop
            $result.ActualStatus = $response.StatusCode
        } else {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-WebRequest -Uri "$baseUrl$Endpoint" -Method $Method -Body $jsonBody -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
            $result.ActualStatus = $response.StatusCode
            $result.Details = $response.Content
        }
        
        if ($result.ActualStatus -eq $ExpectedStatus) {
            $result.Status = "PASS"
        }
        
    } catch {
        $result.ActualStatus = $_.Exception.Response.StatusCode.Value__
        $result.Error = $_.Exception.Message
        
        if ($result.ActualStatus -eq $ExpectedStatus) {
            $result.Status = "PASS"
        }
    }
    
    return $result
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "HELIX AUTHENTICATION VERIFICATION TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Signup - Valid nurse user
Write-Host "Test 1: Valid Nurse Signup..." -ForegroundColor Yellow
$testResults += Test-AuthEndpoint -TestName "Test 1" `
    -Endpoint "/api/auth/signup" `
    -Body @{
        name = "Test Nurse User"
        email = "test.nurse@helix-verification.local"
        password = "SecurePassword123!"
        clinicalQualification = "Registered Nurse, OB-GYN Specialty"
        role = "nurse"
    } `
    -ExpectedStatus 201 `
    -Description "Create new nurse account (requires admin approval)"

# Test 2: Signup - Duplicate email
Write-Host "Test 2: Duplicate Email Signup..." -ForegroundColor Yellow
$testResults += Test-AuthEndpoint -TestName "Test 2" `
    -Endpoint "/api/auth/signup" `
    -Body @{
        name = "Duplicate Test"
        email = "test.nurse@helix-verification.local"
        password = "SecurePassword123!"
        clinicalQualification = "Nurse"
        role = "nurse"
    } `
    -ExpectedStatus 409 `
    -Description "Attempt to create account with existing email"

# Test 3: Signup - Block admin role selection
Write-Host "Test 3: Block Admin Role Signup..." -ForegroundColor Yellow
$testResults += Test-AuthEndpoint -TestName "Test 3" `
    -Endpoint "/api/auth/signup" `
    -Body @{
        name = "Malicious User"
        email = "malicious@helix-verification.local"
        password = "SecurePassword123!"
        clinicalQualification = "Hacker"
        role = "admin"
    } `
    -ExpectedStatus 403 `
    -Description "Prevent admin role selection during public signup"

# Test 4: Login - Disabled account
Write-Host "Test 4: Login with Disabled Account..." -ForegroundColor Yellow
$testResults += Test-AuthEndpoint -TestName "Test 4" `
    -Endpoint "/api/auth/login" `
    -Body @{
        email = "test.nurse@helix-verification.local"
        password = "SecurePassword123!"
    } `
    -ExpectedStatus 403 `
    -Description "Block login for unapproved (disabled) accounts"

# Test 5: Enable the test user in database (simulate admin approval)
Write-Host "Test 5: Simulating admin approval..." -ForegroundColor Yellow
$env:PGPASSWORD = 'helix_dev_password_2026'
$updateQuery = "UPDATE users SET enabled = true WHERE email = 'test.nurse@helix-verification.local';"
& "D:\PostgreSQL\16\bin\psql.exe" -U helix_app -h localhost -p 5432 -d helix_staging -c $updateQuery | Out-Null
Write-Host "  User enabled in database" -ForegroundColor Green

# Test 6: Login - Valid credentials
Write-Host "Test 6: Valid Login..." -ForegroundColor Yellow
$testResults += Test-AuthEndpoint -TestName "Test 6" `
    -Endpoint "/api/auth/login" `
    -Body @{
        email = "test.nurse@helix-verification.local"
        password = "SecurePassword123!"
    } `
    -ExpectedStatus 200 `
    -Description "Successful login with valid credentials"

# Test 7: Login - Invalid password
Write-Host "Test 7: Invalid Password Login..." -ForegroundColor Yellow
$testResults += Test-AuthEndpoint -TestName "Test 7" `
    -Endpoint "/api/auth/login" `
    -Body @{
        email = "test.nurse@helix-verification.local"
        password = "WrongPassword123!"
    } `
    -ExpectedStatus 401 `
    -Description "Reject login with incorrect password"

# Test 8: Login - Non-existent user
Write-Host "Test 8: Non-Existent User Login..." -ForegroundColor Yellow
$testResults += Test-AuthEndpoint -TestName "Test 8" `
    -Endpoint "/api/auth/login" `
    -Body @{
        email = "nonexistent@helix-verification.local"
        password = "SecurePassword123!"
    } `
    -ExpectedStatus 401 `
    -Description "Reject login for non-existent account"

# Test 9: Forgot password request
Write-Host "Test 9: Forgot Password Request..." -ForegroundColor Yellow
$testResults += Test-AuthEndpoint -TestName "Test 9" `
    -Endpoint "/api/auth/forgot-password" `
    -Body @{
        email = "test.nurse@helix-verification.local"
    } `
    -ExpectedStatus 200 `
    -Description "Request password reset link"

# Test 10: Logout
Write-Host "Test 10: Logout..." -ForegroundColor Yellow
$testResults += Test-AuthEndpoint -TestName "Test 10" `
    -Endpoint "/api/auth/logout" `
    -ExpectedStatus 200 `
    -Description "Successful logout and session termination"

# Test 11: Create provider user for role testing
Write-Host "Test 11: Provider Signup..." -ForegroundColor Yellow
$testResults += Test-AuthEndpoint -TestName "Test 11" `
    -Endpoint "/api/auth/signup" `
    -Body @{
        name = "Dr. Test Provider"
        email = "test.provider@helix-verification.local"
        password = "ProviderPass123!"
        clinicalQualification = "Board Certified OB-GYN"
        role = "provider"
    } `
    -ExpectedStatus 201 `
    -Description "Create provider account"

# Enable provider user
$updateQuery2 = "UPDATE users SET enabled = true WHERE email = 'test.provider@helix-verification.local';"
& "D:\PostgreSQL\16\bin\psql.exe" -U helix_app -h localhost -p 5432 -d helix_staging -c $updateQuery2 | Out-Null

# Test 12: Provider login
Write-Host "Test 12: Provider Login..." -ForegroundColor Yellow
$testResults += Test-AuthEndpoint -TestName "Test 12" `
    -Endpoint "/api/auth/login" `
    -Body @{
        email = "test.provider@helix-verification.local"
        password = "ProviderPass123!"
    } `
    -ExpectedStatus 200 `
    -Description "Provider successful login"

# Display results
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count

foreach ($result in $testResults) {
    $color = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "$($result.Status): $($result.TestName) - $($result.Description)" -ForegroundColor $color
    Write-Host "  Expected: $($result.ExpectedStatus), Actual: $($result.ActualStatus)" -ForegroundColor Gray
    if ($result.Error) {
        Write-Host "  Error: $($result.Error)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PASSED: $passCount | FAILED: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
Write-Host "========================================`n" -ForegroundColor Cyan

# Save results to file
$testResults | ConvertTo-Json -Depth 10 | Out-File -FilePath "authentication_test_results.json" -Encoding utf8
Write-Host "Full results saved to: authentication_test_results.json" -ForegroundColor Cyan
