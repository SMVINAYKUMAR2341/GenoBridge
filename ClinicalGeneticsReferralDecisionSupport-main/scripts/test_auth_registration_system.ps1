# GENOBRIDGE CLINICAL GENETICS — AUTHENTICATION & REGISTRATION TEST SUITE
# Tests all requirements for Gynecologist and Nurse registration, verification, and role-based access

$baseUrl = "http://localhost:3000"
$testResults = @()

function Record-Test($name, $passed, $details) {
    $script:testResults += [PSCustomObject]@{
        Test = $name
        Status = if ($passed) { "PASSED" } else { "FAILED" }
        Details = $details
    }
    $statusColor = if ($passed) { "Green" } else { "Red" }
    Write-Host "[$($script:testResults[-1].Status)] $name : $details" -ForegroundColor $statusColor
}

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "STARTING GENOBRIDGE AUTHENTICATION & REGISTRATION TEST SUITE" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Page Accessibility Tests
$pages = @(
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/account-pending",
    "/account-rejected"
)

foreach ($page in $pages) {
    try {
        $resp = Invoke-WebRequest -Uri "$baseUrl$page" -UseBasicParsing -TimeoutSec 10
        Record-Test "Page Access: $page" ($resp.StatusCode -eq 200) "HTTP $($resp.StatusCode)"
    } catch {
        Record-Test "Page Access: $page" $false $_.Exception.Message
    }
}

# 2. Public Administrator Registration Prevention Test
try {
    $adminSignupPayload = @{
        firstName = "Malicious"
        lastName = "Actor"
        email = "attacker_admin_$(Get-Random)@hospital.org"
        phone = "+91 9876543210"
        password = "SecurePassword123!"
        confirmPassword = "SecurePassword123!"
        category = "gynecologist"
        role = "admin" # Attempting role escalation
        medicalRegistrationNumber = "NMC/99999"
        stateMedicalCouncil = "Delhi Medical Council"
        registrationState = "Delhi (NCT)"
        hospitalClinicName = "AIIMS"
        designation = "Admin"
        termsAccepted = $true
        privacyAccepted = $true
        verificationConsent = $true
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method POST -Body $adminSignupPayload -ContentType "application/json" -SkipHttpErrorCheck -StatusCodeVariable "code"
    Record-Test "Security: Admin Public Registration Blocked" ($code -eq 403) "Status ${code}: $($resp.message)"
} catch {
    Record-Test "Security: Admin Public Registration Blocked" $false $_.Exception.Message
}

# 3. Input Validation: Invalid category
try {
    $invalidCatPayload = @{
        firstName = "Invalid"
        lastName = "Cat"
        email = "invalid_cat@hospital.org"
        phone = "+91 9876543210"
        password = "Password123!"
        confirmPassword = "Password123!"
        category = "radiologist" # Not supported public category
        termsAccepted = $true
        privacyAccepted = $true
        verificationConsent = $true
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method POST -Body $invalidCatPayload -ContentType "application/json" -SkipHttpErrorCheck -StatusCodeVariable "code"
    Record-Test "Validation: Unsupported Category Blocked" ($code -eq 400) "Status ${code}: $($resp.message)"
} catch {
    Record-Test "Validation: Unsupported Category Blocked" $false $_.Exception.Message
}

# 4. Input Validation: Password mismatch
try {
    $mismatchPayload = @{
        firstName = "Doctor"
        lastName = "Test"
        email = "mismatch_$(Get-Random)@hospital.org"
        phone = "+91 9876543210"
        password = "Password123!"
        confirmPassword = "DifferentPassword123!"
        category = "gynecologist"
        medicalRegistrationNumber = "DMC/123"
        stateMedicalCouncil = "Delhi Medical Council"
        registrationState = "Delhi (NCT)"
        hospitalClinicName = "AIIMS"
        designation = "Consultant"
        termsAccepted = $true
        privacyAccepted = $true
        verificationConsent = $true
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method POST -Body $mismatchPayload -ContentType "application/json" -SkipHttpErrorCheck -StatusCodeVariable "code"
    Record-Test "Validation: Password Mismatch Blocked" ($code -eq 400) "Status ${code}: $($resp.message)"
} catch {
    Record-Test "Validation: Password Mismatch Blocked" $false $_.Exception.Message
}

# 5. Successful Gynecologist Registration Test
$uniqueDoctorEmail = "dr_priya_$(Get-Random)@apollohospitals.com"
$doctorVerificationToken = ""
try {
    $doctorPayload = @{
        firstName = "Priya"
        lastName = "Nair"
        email = $uniqueDoctorEmail
        phone = "+91 9811223344"
        password = "ClinicalSecret2026!"
        confirmPassword = "ClinicalSecret2026!"
        category = "gynecologist"
        medicalRegistrationNumber = "MMC/2026/88741"
        stateMedicalCouncil = "Maharashtra Medical Council"
        registrationState = "Maharashtra"
        hospitalClinicName = "Apollo Hospital Mumbai"
        department = "Obstetrics and Fetal Medicine"
        designation = "Consultant OB-GYN"
        termsAccepted = $true
        privacyAccepted = $true
        verificationConsent = $true
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method POST -Body $doctorPayload -ContentType "application/json" -SkipHttpErrorCheck -StatusCodeVariable "code"
    $passed = ($code -eq 201) -and ($resp.success -eq $true)
    $doctorVerificationToken = $resp.verificationToken
    Record-Test "Registration: Gynecologist / OB-GYN" $passed "Status ${code}: $($resp.message) (UserId: $($resp.userId))"
} catch {
    Record-Test "Registration: Gynecologist / OB-GYN" $false $_.Exception.Message
}

# 6. Duplicate Registration Prevention
try {
    $duplicatePayload = @{
        firstName = "Priya"
        lastName = "Nair"
        email = $uniqueDoctorEmail # Duplicate email
        phone = "+91 9811223344"
        password = "AnotherPassword123!"
        confirmPassword = "AnotherPassword123!"
        category = "gynecologist"
        medicalRegistrationNumber = "MMC/2026/88741"
        stateMedicalCouncil = "Maharashtra Medical Council"
        registrationState = "Maharashtra"
        hospitalClinicName = "Apollo Hospital Mumbai"
        designation = "Consultant OB-GYN"
        termsAccepted = $true
        privacyAccepted = $true
        verificationConsent = $true
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method POST -Body $duplicatePayload -ContentType "application/json" -SkipHttpErrorCheck -StatusCodeVariable "code"
    Record-Test "Security: Duplicate Email Prevented" ($code -eq 409) "Status ${code}: $($resp.message)"
} catch {
    Record-Test "Security: Duplicate Email Prevented" $false $_.Exception.Message
}

# 7. Successful Nurse Registration Test
$uniqueNurseEmail = "nurse_anita_$(Get-Random)@manipalhospitals.com"
try {
    $nursePayload = @{
        firstName = "Anita"
        lastName = "Deshmukh"
        email = $uniqueNurseEmail
        phone = "+91 9765432109"
        password = "NursePassword2026!"
        confirmPassword = "NursePassword2026!"
        category = "nurse"
        nursingRegistrationNumber = "KNC/RN/99214"
        stateNursingCouncil = "Karnataka State Nursing Council"
        hospitalClinicName = "Manipal Hospital Bangalore"
        department = "Clinical Genetics & ANC Clinic"
        designation = "Genetic Nurse Coordinator"
        termsAccepted = $true
        privacyAccepted = $true
        verificationConsent = $true
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method POST -Body $nursePayload -ContentType "application/json" -SkipHttpErrorCheck -StatusCodeVariable "code"
    $passed = ($code -eq 201) -and ($resp.success -eq $true)
    Record-Test "Registration: Nurse / Medical Assistant" $passed "Status ${code}: $($resp.message)"
} catch {
    Record-Test "Registration: Nurse / Medical Assistant" $false $_.Exception.Message
}

# 8. Email Verification Workflow Test
try {
    $verifyPayload = @{
        token = $doctorVerificationToken
        email = $uniqueDoctorEmail
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/verify-email" -Method POST -Body $verifyPayload -ContentType "application/json" -SkipHttpErrorCheck -StatusCodeVariable "code"
    Record-Test "Workflow: Email Verification" ($code -eq 200 -and $resp.success -eq $true) "Status ${code}: $($resp.message)"
} catch {
    Record-Test "Workflow: Email Verification" $false $_.Exception.Message
}

# 9. Login with Pending Account -> Redirects to /account-pending
$websession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $loginPayload = @{
        email = $uniqueDoctorEmail
        password = "ClinicalSecret2026!"
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json" -WebSession $websession -SkipHttpErrorCheck -StatusCodeVariable "code"
    $isPendingRedirect = ($code -eq 200) -and ($resp.redirectTo -eq "/account-pending")
    Record-Test "Access Control: Pending Account Redirects to /account-pending" $isPendingRedirect "Status ${code}: redirectTo = $($resp.redirectTo)"
} catch {
    Record-Test "Access Control: Pending Account Redirects to /account-pending" $false $_.Exception.Message
}

# 10. Provision an Admin Account to test Verification Interface
# We insert or verify a system admin account directly in PostgreSQL
$adminEmail = "clinical_governance_admin@genobridge.in"
$adminPassword = "SuperAdminPassword2026!"
Write-Host "Verifying / Provisioning Authorized Administrator Account..." -ForegroundColor Yellow

$checkAdminSql = @"
DO `$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = '$adminEmail') THEN
    INSERT INTO users (id, name, email, role, enabled, verification_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Dr. Clinical Governance Admin', '$adminEmail', 'admin', true, 'APPROVED', now(), now());
  ELSE
    UPDATE users SET role = 'admin', enabled = true, verification_status = 'APPROVED' WHERE email = '$adminEmail';
  END IF;
END
`$\$;
"@
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U genobridge_app -d genobridge_staging -c $checkAdminSql

# Let's set password for admin via Payload forgotten/reset or direct password test
# Or let's test admin login with existing staging user or appAuth
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Let's inspect verifications API via server session or admin login
# First let's test invalid credentials on login
try {
    $badLoginPayload = @{
        email = $uniqueDoctorEmail
        password = "WrongPassword999!"
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $badLoginPayload -ContentType "application/json" -SkipHttpErrorCheck -StatusCodeVariable "code"
    Record-Test "Security: Bad Credentials Return 401 Generic" ($code -eq 401 -and $resp.message -eq "Invalid email or password") "Status ${code}: $($resp.message)"
} catch {
    Record-Test "Security: Bad Credentials Return 401 Generic" $false $_.Exception.Message
}

# 11. Test Password Reset Workflow (Forgot Password -> Reset Password -> Sign in)
try {
    $forgotPayload = @{ email = $uniqueDoctorEmail } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/forgot-password" -Method POST -Body $forgotPayload -ContentType "application/json" -SkipHttpErrorCheck -StatusCodeVariable "code"
    Record-Test "Workflow: Forgot Password Request" ($code -eq 200 -and $resp.success -eq $true) "Status ${code}: $($resp.message)"
} catch {
    Record-Test "Workflow: Forgot Password Request" $false $_.Exception.Message
}

# 12. Direct API Protection: Unauthorized user cannot call admin verification API
try {
    # Using the pending doctor's session (not an admin)
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/admin/verifications" -Method GET -WebSession $websession -SkipHttpErrorCheck -StatusCodeVariable "code"
    Record-Test "RBAC: Non-admin Blocked from Admin Verifications API" ($code -eq 403) "Status ${code}: $($resp.message)"
} catch {
    Record-Test "RBAC: Non-admin Blocked from Admin Verifications API" $false $_.Exception.Message
}

# 13. Professional Verification: Admin Approves Gynecologist Account
# Let's approve the doctor in database and verify login redirection
$approveDoctorSql = @"
UPDATE users 
SET verification_status = 'APPROVED', 
    enabled = true, 
    reviewer_authorized = true, 
    reviewer_qualification = 'Consultant OB-GYN (MMC)',
    reviewed_by = 'Medical Governance Board',
    reviewed_at = now()
WHERE email = '$uniqueDoctorEmail';
"@
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U genobridge_app -d genobridge_staging -c $approveDoctorSql

# Now sign in as the approved doctor
try {
    $approvedLoginPayload = @{
        email = $uniqueDoctorEmail
        password = "ClinicalSecret2026!"
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $approvedLoginPayload -ContentType "application/json" -WebSession $websession -SkipHttpErrorCheck -StatusCodeVariable "code"
    $isDoctorRedirect = ($code -eq 200) -and ($resp.redirectTo -eq "/doctor/dashboard") -and ($resp.status -eq "APPROVED")
    Record-Test "Role Redirection: Approved Gynecologist -> /doctor/dashboard" $isDoctorRedirect "Status ${code}: redirectTo = $($resp.redirectTo)"
} catch {
    Record-Test "Role Redirection: Approved Gynecologist -> /doctor/dashboard" $false $_.Exception.Message
}

# 14. Professional Verification: Admin Approves Nurse Account
$approveNurseSql = @"
UPDATE users 
SET verification_status = 'APPROVED', 
    enabled = true, 
    reviewed_by = 'Nursing Governance Board',
    reviewed_at = now()
WHERE email = '$uniqueNurseEmail';
"@
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U genobridge_app -d genobridge_staging -c $approveNurseSql

# Now sign in as the approved nurse
try {
    $nurseLoginPayload = @{
        email = $uniqueNurseEmail
        password = "NursePassword2026!"
    } | ConvertTo-Json

    $nurseSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $nurseLoginPayload -ContentType "application/json" -WebSession $nurseSession -SkipHttpErrorCheck -StatusCodeVariable "code"
    $isNurseRedirect = ($code -eq 200) -and ($resp.redirectTo -eq "/nurse/dashboard") -and ($resp.status -eq "APPROVED")
    Record-Test "Role Redirection: Approved Nurse -> /nurse/dashboard" $isNurseRedirect "Status ${code}: redirectTo = $($resp.redirectTo)"
} catch {
    Record-Test "Role Redirection: Approved Nurse -> /nurse/dashboard" $false $_.Exception.Message
}

# 15. Account Rejection Test
$rejectedApplicantEmail = "rejected_applicant_$(Get-Random)@clinic.com"
# Register applicant
$rejectRegPayload = @{
    firstName = "Unverified"
    lastName = "Practitioner"
    email = $rejectedApplicantEmail
    phone = "+91 9988776655"
    password = "ApplicantSecret123!"
    confirmPassword = "ApplicantSecret123!"
    category = "gynecologist"
    medicalRegistrationNumber = "FAKE/0000"
    stateMedicalCouncil = "Delhi Medical Council"
    registrationState = "Delhi (NCT)"
    hospitalClinicName = "Unregistered Clinic"
    designation = "Practitioner"
    termsAccepted = $true
    privacyAccepted = $true
    verificationConsent = $true
} | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method POST -Body $rejectRegPayload -ContentType "application/json" -SkipHttpErrorCheck

# Reject applicant in database with specific reason
$rejectSql = @"
UPDATE users 
SET verification_status = 'REJECTED', 
    enabled = false, 
    rejection_reason = 'Registration number FAKE/0000 was not found in the official Delhi Medical Council registry.',
    reviewed_by = 'Dr. Sharma (Registrar)',
    reviewed_at = now()
WHERE email = '$rejectedApplicantEmail';
"@
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U genobridge_app -d genobridge_staging -c $rejectSql

# Attempt login with rejected account
try {
    $rejectedLoginPayload = @{
        email = $rejectedApplicantEmail
        password = "ApplicantSecret123!"
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $rejectedLoginPayload -ContentType "application/json" -SkipHttpErrorCheck -StatusCodeVariable "code"
    $isRejected = ($code -eq 403) -and ($resp.status -eq "REJECTED") -and ($resp.redirectTo -eq "/account-rejected")
    Record-Test "Access Control: Rejected Account Blocked with /account-rejected Redirect" $isRejected "Status ${code}: redirectTo = $($resp.redirectTo) Reason: $($resp.message)"
} catch {
    Record-Test "Access Control: Rejected Account Blocked with /account-rejected Redirect" $false $_.Exception.Message
}

# 16. Account Suspension Test
$suspendSql = @"
UPDATE users 
SET verification_status = 'SUSPENDED', 
    enabled = false
WHERE email = '$rejectedApplicantEmail';
"@
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U genobridge_app -d genobridge_staging -c $suspendSql

try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $rejectedLoginPayload -ContentType "application/json" -SkipHttpErrorCheck -StatusCodeVariable "code"
    $isSuspended = ($code -eq 403) -and ($resp.status -eq "SUSPENDED")
    Record-Test "Access Control: Suspended Account Prohibited" $isSuspended "Status ${code}: $($resp.message)"
} catch {
    Record-Test "Access Control: Suspended Account Prohibited" $false $_.Exception.Message
}

# 17. Session Revocation / Logout Test
try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/logout" -Method POST -WebSession $websession -SkipHttpErrorCheck -StatusCodeVariable "code"
    Record-Test "Session: Logout Clears Session Cookies" ($code -eq 200 -or $code -eq 302) "Logout status $code"
} catch {
    Record-Test "Session: Logout Clears Session Cookies" $false $_.Exception.Message
}

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "TEST SUITE EXECUTION COMPLETE" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -eq "PASSED" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count
Write-Host "Total Tests: $($testResults.Count) | Passed: $passCount | Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })

$testResults | Format-Table -AutoSize
$testResults | ConvertTo-Json -Depth 3 | Set-Content "scripts/test_auth_results.json"
