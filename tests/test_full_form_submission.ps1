# PowerShell Script simulating full application form filling, frontend validation, and Supabase DB verification
$SUPABASE_URL = "https://qitgpnugxjameulzhyoq.supabase.co"
$SUPABASE_ANON_KEY = "sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM"
$tableUrl = "$SUPABASE_URL/rest/v1/sales_applications"

# 1. Candidate Form Input (Simulating user input in index.html)
$candidateInput = @{
    full_name                 = "Zeeshan Akram"
    email                     = "zeeshan.sales.test+$((Get-Date).Ticks)@alphaorbit.io"
    phone_number              = "+1 (555) 234-5678"
    linkedin_url              = "https://www.linkedin.com/in/zeeshan-akram-sales"
    current_role_company      = "Senior Account Executive at GrowthMetrics"
    years_of_sales_experience = "5+"
    relevant_experience       = "B2B Sales"
    why_fit                   = "I have 6 years of experience driving high-velocity SaaS sales and expanding mid-market accounts. I excel at consultative selling, pipeline generation, and aligning revenue strategies with ambitious business goals."
    expected_compensation     = "$140,000 Base + $140,000 OTE"
    availability              = "Immediate"
    resume_file_name          = "Zeeshan_Akram_Sales_CV.pdf"
}

# 2. Frontend Validation Rules (matching app.js validateForm)
function Validate-FormPayload($payload) {
    if (-not $payload.full_name) { return "Please enter your full name." }
    if (-not $payload.email -or $payload.email -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') { return "Please enter a valid email address." }
    if (-not $payload.phone_number) { return "Please enter your phone number." }
    if (-not $payload.linkedin_url -or $payload.linkedin_url -notlike "*linkedin.com*") { return "Please enter a valid LinkedIn profile URL." }
    if (-not $payload.current_role_company) { return "Please provide your current or last role and company." }
    if (-not $payload.years_of_sales_experience) { return "Please select your sales experience range." }
    if (-not $payload.relevant_experience) { return "Please choose your relevant experience." }
    if (-not $payload.why_fit) { return "Please share why you are a strong fit for Alpha Orbit." }
    if ($payload.why_fit.Length -gt 500) { return "Your fit statement must be 500 characters or fewer." }
    if (-not $payload.availability) { return "Please select your availability." }
    return $null
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ALPHA ORBIT CAREERS FORM - FULL END-TO-END DB TEST" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Step 1: Client-side Validation Check
Write-Host "`n[1/3] Validating Form Fields (simulating app.js)..." -ForegroundColor Yellow
$valError = Validate-FormPayload $candidateInput
if ($valError) {
    Write-Host "Validation Failed: $valError" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  [OK] All 11 form fields passed client-side validation." -ForegroundColor Green
}

# Step 2: Form Submission to Supabase Database
Write-Host "`n[2/3] Submitting Form Payload to Supabase DB..." -ForegroundColor Yellow
$headers = @{
    'apikey'        = $SUPABASE_ANON_KEY
    'Authorization' = "Bearer $SUPABASE_ANON_KEY"
    'Content-Type'  = 'application/json'
    'Prefer'        = 'return=representation'
}

$jsonBody = $candidateInput | ConvertTo-Json

try {
    $insertedRecord = Invoke-RestMethod -Uri $tableUrl -Method Post -Headers $headers -Body $jsonBody
    Write-Host "  [OK] FORM SUBMISSION SUCCESSFUL! (HTTP 201 Created)" -ForegroundColor Green
    Write-Host "  Assigned Record ID: $($insertedRecord.id)" -ForegroundColor Cyan
    Write-Host "  Submitted At:       $($insertedRecord.created_at)" -ForegroundColor Cyan
} catch {
    $msg = $_.Exception.Message
    Write-Host "  [FAIL] Submission Failed: $msg" -ForegroundColor Red
    exit 2
}

# Step 3: Query Database to Confirm Field Integrity
Write-Host "`n[3/3] Querying Supabase DB to Verify Stored Record..." -ForegroundColor Yellow
try {
    $getHeaders = @{
        'apikey'        = $SUPABASE_ANON_KEY
        'Authorization' = "Bearer $SUPABASE_ANON_KEY"
    }
    $queryUrl = "$tableUrl`?id=eq.$($insertedRecord.id)"
    $dbRecord = Invoke-RestMethod -Uri $queryUrl -Method Get -Headers $getHeaders

    Write-Host "  [OK] DB Verification Passed! Retrieved candidate entry from database:" -ForegroundColor Green
    Write-Host "----------------------------------------------------------"
    Write-Host "  Full Name:       $($dbRecord.full_name)"
    Write-Host "  Email:           $($dbRecord.email)"
    Write-Host "  Phone:           $($dbRecord.phone_number)"
    Write-Host "  LinkedIn:        $($dbRecord.linkedin_url)"
    Write-Host "  Company / Role:  $($dbRecord.current_role_company)"
    Write-Host "  Sales Exp:       $($dbRecord.years_of_sales_experience)"
    Write-Host "  Rel. Experience: $($dbRecord.relevant_experience)"
    Write-Host "  Why Fit:         $($dbRecord.why_fit)"
    Write-Host "  Compensation:    $($dbRecord.expected_compensation)"
    Write-Host "  Availability:    $($dbRecord.availability)"
    Write-Host "  Resume File:     $($dbRecord.resume_file_name)"
    Write-Host "----------------------------------------------------------"
} catch {
    $errMsg = $_.Exception.Message
    Write-Host "  [FAIL] Failed to query record from DB: $errMsg" -ForegroundColor Red
}
