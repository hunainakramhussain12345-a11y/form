$headers = @{
    'apikey'        = "sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM"
    'Authorization' = "Bearer sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM"
    'Content-Type'  = 'application/json'
}
$payload = @{
    full_name                 = "Test Candidate"
    email                     = "test@example.com"
    phone_number              = "+123456"
    linkedin_url              = "https://www.linkedin.com/in/test"
    current_role_company      = "AE"
    years_of_sales_experience = "1-3"
    relevant_experience       = "Startup"
    why_fit                   = "Great fit"
    expected_compensation     = "100k"
    availability              = "Immediate"
    resume_file_name          = "cv.pdf"
    resume_url                = "https://example.com/cv.pdf"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "https://qitgpnugxjameulzhyoq.supabase.co/rest/v1/sales_applications" -Method Post -Headers $headers -Body $payload
    Write-Host "SUCCESS!"
} catch {
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "RESPONSE BODY:" $reader.ReadToEnd()
    } else {
        Write-Host "ERROR:" $_.Exception.Message
    }
}
