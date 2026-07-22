# PowerShell script to test Supabase connection and submit form payload
$SUPABASE_URL = "https://qitgpnugxjameulzhyoq.supabase.co"
$SUPABASE_ANON_KEY = "sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM"
$tableUrl = "$SUPABASE_URL/rest/v1/sales_applications"

$headers = @{
    'apikey'        = $SUPABASE_ANON_KEY
    'Authorization' = "Bearer $SUPABASE_ANON_KEY"
    'Content-Type'  = 'application/json'
    'Prefer'        = 'return=representation'
}

$testCandidate = @{
    full_name                 = 'Test Candidate PowerShell'
    email                     = "candidate_ps_$((Get-Date).Ticks)@example.com"
    phone_number              = '+1-555-9876'
    linkedin_url              = 'https://www.linkedin.com/in/testcandidate-ps'
    current_role_company      = 'Sales Manager at Acme'
    years_of_sales_experience = '5+'
    relevant_experience       = 'Multi-context'
    why_fit                   = 'Demonstrated record in scaling enterprise accounts.'
    expected_compensation     = '$150k base + bonus'
    availability              = '2 weeks'
    resume_file_name          = 'candidate_cv.pdf'
} | ConvertTo-Json

Write-Host "=== 1. Testing POST request to $tableUrl ==="
try {
    $postResponse = Invoke-RestMethod -Uri $tableUrl -Method Post -Headers $headers -Body $testCandidate
    Write-Host "SUCCESS: POST application inserted standard candidate row!" -ForegroundColor Green
    $postResponse | Format-List
} catch {
    Write-Host "FAILED: POST request failed." -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Response Body:" $reader.ReadToEnd() -ForegroundColor Yellow
    }
}

Write-Host "`n=== 2. Testing GET request to query sales_applications ==="
try {
    $getHeaders = @{
        'apikey'        = $SUPABASE_ANON_KEY
        'Authorization' = "Bearer $SUPABASE_ANON_KEY"
    }
    $rows = Invoke-RestMethod -Uri "$tableUrl`?select=*&order=created_at.desc&limit=5" -Method Get -Headers $getHeaders
    Write-Host "SUCCESS: Retreived $($rows.Count) recent records from database:" -ForegroundColor Green
    $rows | Format-Table -Property id, full_name, email, current_role_company, availability, created_at
} catch {
    Write-Host "FAILED: GET request failed." -ForegroundColor Red
    Write-Host $_.Exception.Message
}
