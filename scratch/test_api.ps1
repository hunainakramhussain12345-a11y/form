$headers = @{
    'apikey'        = 'sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM'
    'Authorization' = 'Bearer sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM'
    'Content-Type'  = 'application/json'
    'Prefer'        = 'return=representation'
}

$payload = @{
    full_name                 = 'Test Candidate'
    email                     = 'test.candidate@example.com'
    phone_number              = '+1234567890'
    linkedin_url              = 'https://www.linkedin.com/in/testcandidate'
    current_role_company      = 'AE at TechCorp'
    years_of_sales_experience = '3-5'
    relevant_experience       = 'B2B Sales'
    why_fit                   = 'I am passionate about sales strategy.'
    expected_compensation     = '$100k base'
    availability              = 'Immediate'
    resume_file_name          = 'resume_test.pdf'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'https://qitgpnugxjameulzhyoq.supabase.co/rest/v1/sales_applications' -Method Post -Headers $headers -Body $payload
    Write-Host "POST SUCCESSFUL:"
    $response | Format-List
} catch {
    Write-Host "POST FAILED:" $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "RESPONSE BODY:" $reader.ReadToEnd()
    }
}
