$headers = @{
    'apikey'        = 'sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM'
    'Authorization' = 'Bearer sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM'
    'Accept'        = 'application/openapi+json'
}

try {
    $swagger = Invoke-RestMethod -Uri 'https://qitgpnugxjameulzhyoq.supabase.co/rest/v1/' -Method Get -Headers $headers
    $properties = $swagger.definitions.sales_applications.properties
    Write-Host "CURRENT SUPABASE COLUMNS FOR sales_applications:"
    $properties.psobject.properties | ForEach-Object { Write-Host "- "$_.Name }
} catch {
    Write-Host "ERROR:" $_.Exception.Message
}
