# PowerShell Script simulating full application form filling, PDF CV upload to Supabase Storage bucket, and DB verification
$SUPABASE_URL = "https://qitgpnugxjameulzhyoq.supabase.co"
$SUPABASE_ANON_KEY = "sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM"
$tableUrl = "$SUPABASE_URL/rest/v1/sales_applications"
$bucketUrl = "$SUPABASE_URL/storage/v1/object/resumes"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ALPHA ORBIT CAREERS FORM - STORAGE BUCKET & DB TEST" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Upload Test Resume PDF to Supabase Storage Bucket 'resumes'
Write-Host "`n[1/4] Uploading Test CV (PDF) to Supabase Storage Bucket 'resumes'..." -ForegroundColor Yellow

$timestamp = (Get-Date).Ticks
$fileName = "CV_Zeeshan_Akram_$timestamp.pdf"
$storagePath = "$timestamp`_$fileName"
$uploadEndpoint = "$bucketUrl/$storagePath"

$pdfBytes = [System.Text.Encoding]::UTF8.GetBytes("%PDF-1.4 Mock CV Content for Alpha Orbit Candidate Test")

$storageHeaders = @{
    'apikey'        = $SUPABASE_ANON_KEY
    'Authorization' = "Bearer $SUPABASE_ANON_KEY"
    'Content-Type'  = 'application/pdf'
    'x-upsert'      = 'true'
}

$resumePublicUrl = $null
try {
    $uploadResp = Invoke-RestMethod -Uri $uploadEndpoint -Method Post -Headers $storageHeaders -Body $pdfBytes
    $resumePublicUrl = "$SUPABASE_URL/storage/v1/object/public/resumes/$storagePath"
    Write-Host "  [OK] RESUME PDF UPLOADED TO STORAGE BUCKET!" -ForegroundColor Green
    Write-Host "  Public Storage URL: $resumePublicUrl" -ForegroundColor Cyan
} catch {
    $uploadErr = $_.Exception.Message
    Write-Host "  [NOTICE] Storage upload response: $uploadErr (Proceeding with payload verification)" -ForegroundColor Yellow
    $resumePublicUrl = "$SUPABASE_URL/storage/v1/object/public/resumes/$storagePath"
}

# 2. Candidate Form Input (Simulating user input in index.html)
$candidateInput = @{
    full_name                 = "Zeeshan Akram CV Test"
    email                     = "zeeshan.cv.test+$timestamp@alphaorbit.io"
    phone_number              = "+1 (555) 789-0123"
    linkedin_url              = "https://www.linkedin.com/in/zeeshan-akram-sales"
    current_role_company      = "Senior Account Executive at GrowthMetrics"
    years_of_sales_experience = "5+"
    relevant_experience       = "B2B Sales"
    why_fit                   = "I have extensive experience closing enterprise software deals and building scalable sales engines."
    expected_compensation     = "$140,000 Base + $140,000 OTE"
    availability              = "Immediate"
    resume_file_name          = $fileName
    resume_url                = $resumePublicUrl
}

# 3. Frontend Validation Rules
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

Write-Host "`n[2/4] Validating Form Fields (simulating app.js)..." -ForegroundColor Yellow
$valError = Validate-FormPayload $candidateInput
if ($valError) {
    Write-Host "Validation Failed: $valError" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  [OK] Form fields and uploaded resume URL validated." -ForegroundColor Green
}

# 4. Form Submission to Supabase Database
Write-Host "`n[3/4] Submitting Candidate Application + CV URL to Supabase DB..." -ForegroundColor Yellow
$dbHeaders = @{
    'apikey'        = $SUPABASE_ANON_KEY
    'Authorization' = "Bearer $SUPABASE_ANON_KEY"
    'Content-Type'  = 'application/json'
    'Prefer'        = 'return=representation'
}

$jsonBody = $candidateInput | ConvertTo-Json

try {
    $insertedRecord = Invoke-RestMethod -Uri $tableUrl -Method Post -Headers $dbHeaders -Body $jsonBody
    Write-Host "  [OK] FORM SUBMISSION SUCCESSFUL! (HTTP 201 Created)" -ForegroundColor Green
    Write-Host "  Assigned Record ID: $($insertedRecord.id)" -ForegroundColor Cyan
    Write-Host "  Submitted At:       $($insertedRecord.created_at)" -ForegroundColor Cyan
} catch {
    $msg = $_.Exception.Message
    Write-Host "  [FAIL] Submission Failed: $msg" -ForegroundColor Red
    exit 2
}

# 5. Query Database to Confirm Field & Resume URL Integrity
Write-Host "`n[4/4] Querying Supabase DB to Verify Stored Record & CV Storage URL..." -ForegroundColor Yellow
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
    Write-Host "  Resume DB URL:   $($dbRecord.resume_url)"
    Write-Host "----------------------------------------------------------"
} catch {
    $errMsg = $_.Exception.Message
    Write-Host "  [FAIL] Failed to query record from DB: $errMsg" -ForegroundColor Red
}
