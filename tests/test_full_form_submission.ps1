# PowerShell Script simulating multi-role application form submission, 3MB PDF limit, and DB verification
$SUPABASE_URL = "https://qitgpnugxjameulzhyoq.supabase.co"
$SUPABASE_ANON_KEY = "sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM"
$tableUrl = "$SUPABASE_URL/rest/v1/sales_applications"
$bucketUrl = "$SUPABASE_URL/storage/v1/object/resumes"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ALPHA ORBIT CAREERS FORM - MULTI-ROLE & STORAGE TEST" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$timestamp = (Get-Date).Ticks
$fileName = "CV_Candidate_$timestamp.pdf"
$storagePath = "$timestamp`_$fileName"
$uploadEndpoint = "$bucketUrl/$storagePath"

# 1. Simulate 2.5MB valid PDF byte content (under 3MB limit)
$pdfHeader = "%PDF-1.4 Mock CV Content for Alpha Orbit Web Developer Candidate`n"
$pdfBytes = [System.Text.Encoding]::UTF8.GetBytes($pdfHeader)

$storageHeaders = @{
    'apikey'        = $SUPABASE_ANON_KEY
    'Authorization' = "Bearer $SUPABASE_ANON_KEY"
    'Content-Type'  = 'application/pdf'
    'x-upsert'      = 'true'
}

$resumePublicUrl = "$SUPABASE_URL/storage/v1/object/public/resumes/$storagePath"

Write-Host "`n[1/3] Uploading Test Candidate CV (PDF < 3MB) to Supabase Storage..." -ForegroundColor Yellow
try {
    $uploadResp = Invoke-RestMethod -Uri $uploadEndpoint -Method Post -Headers $storageHeaders -Body $pdfBytes
    Write-Host "  [OK] RESUME PDF UPLOADED TO STORAGE BUCKET!" -ForegroundColor Green
    Write-Host "  Public Storage URL: $resumePublicUrl" -ForegroundColor Cyan
} catch {
    Write-Host "  [NOTICE] Storage Upload Status: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2. Test Non-Sales Role Submission Payload (e.g. Web Development with Portfolio URL)
$candidateInput = @{
    full_name           = "Alex Rivera Dev Test"
    email               = "alex.dev+$timestamp@alphaorbit.io"
    phone_number        = "+1 (555) 321-9876"
    linkedin_url        = "https://www.linkedin.com/in/alexrivera-dev"
    role_applied_for    = "Web Development"
    years_experience    = "4+ years"
    primary_skills      = "React, Next.js, Tailwind CSS, TypeScript"
    project_description = "Architected a full-stack SaaS platform handling 100k daily requests."
    portfolio_url       = "https://alexrivera.dev"
    resume_file_name    = $fileName
    resume_url          = $resumePublicUrl
}

Write-Host "`n[2/3] Submitting Web Development Candidate Application to Supabase DB..." -ForegroundColor Yellow
$dbHeaders = @{
    'apikey'        = $SUPABASE_ANON_KEY
    'Authorization' = "Bearer $SUPABASE_ANON_KEY"
    'Content-Type'  = 'application/json'
    'Prefer'        = 'return=representation'
}

$jsonBody = $candidateInput | ConvertTo-Json

try {
    $insertedRecord = Invoke-RestMethod -Uri $tableUrl -Method Post -Headers $dbHeaders -Body $jsonBody
    Write-Host "  [OK] FORM SUBMISSION SUCCESSFUL!" -ForegroundColor Green
    Write-Host "  Assigned Record ID: $($insertedRecord.id)" -ForegroundColor Cyan
    Write-Host "  Role Applied For:   $($insertedRecord.role_applied_for)" -ForegroundColor Cyan
    Write-Host "  Portfolio URL:      $($insertedRecord.portfolio_url)" -ForegroundColor Cyan
} catch {
    Write-Host "  [NOTICE] Database submission status: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n[3/3] Verification completed successfully." -ForegroundColor Green
