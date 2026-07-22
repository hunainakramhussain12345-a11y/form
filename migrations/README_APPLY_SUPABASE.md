# How to apply the migration to Supabase

### 1. Confirm target project
- Open your Supabase Dashboard: [https://app.supabase.com/project/qitgpnugxjameulzhyoq](https://app.supabase.com/project/qitgpnugxjameulzhyoq).
- Click on **SQL Editor** in the left menu.

### 2. Run the SQL Migration
- Open [`migrations/001_create_sales_applications.sql`](file:///c:/Users/ZEESHAN/alpha-orbit-careers-form/migrations/001_create_sales_applications.sql).
- Copy and paste the entire content into the SQL Editor and click **Run**.
- The script is idempotent (`IF NOT EXISTS` & `ADD COLUMN IF NOT EXISTS`), making it completely safe to run against an existing table.

### 3. Verify in SQL Editor
Run the following query in the SQL Editor to check that all columns exist:

```sql
SELECT id, full_name, email, phone_number, linkedin_url, current_role_company, years_of_sales_experience, relevant_experience, why_fit, expected_compensation, availability, resume_file_name, created_at 
FROM public.sales_applications 
ORDER BY created_at DESC 
LIMIT 10;
```

### 4. Test API Connectivity
Run the PowerShell test script:
```powershell
powershell -ExecutionPolicy Bypass -File tests/run_test.ps1
```
If configured correctly, this script will return `SUCCESS: POST application inserted standard candidate row!`.