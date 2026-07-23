# 🚀 Alpha Orbit Careers Application Form

A modern, high-conversion multi-step candidate application portal built for **Alpha Orbit**. Supports dynamic role-based application workflows, PDF resume uploads to Supabase Storage, and automated email notifications via Supabase Edge Functions & Resend API.

🌐 **Live Application**: [https://alpha-orbit-form.vercel.app/](https://alpha-orbit-form.vercel.app/)  
📂 **GitHub Repository**: [https://github.com/hunainakramhussain12345-a11y/form](https://github.com/hunainakramhussain12345-a11y/form)

---

## ✨ Features

- **Dynamic Multi-Role Support**: Custom fields for:
  - 💼 Sales & Business Development
  - `</>` Full Stack / Web Development
  - 📈 SEO & Marketing
  - 🎨 Graphic Design & Video Editing
  - 🌐 WordPress Development
  - ✨ Custom / "Other" Roles (with custom title input)
- **Interactive Multi-Step Stepper**: Smooth two-step progression with client-side form validation.
- **Resume / CV Storage**: Direct PDF file uploads to Supabase Storage (`resumes` bucket) capped at **5MB** max file size.
- **Automated Email Workflows**: Powered by Supabase Edge Functions (`send-application-email`) and Resend:
  - 📩 **Team Notification**: Sent from `notifications@career.alphaorbit.site` to `muhammadtahasattararain@gmail.com` on application submission.
  - 📨 **Candidate Confirmation**: Automated receipt confirmation sent to the applicant's email.
- **Security & Privacy Hardening**:
  - Row Level Security (RLS) on `sales_applications` and `storage.objects`.
  - RPC trigger function `public.notify_resend_on_application_insert()` restricted from public API access (no `anon`/`authenticated` execute privileges).
  - Explicit fixed `search_path = public, extensions, pg_temp` to prevent SQL injection vulnerabilities.
  - Extension `pg_net` isolated in `extensions` schema.
- **Spam & Abuse Protection**:
  - Hidden honeypot field detection for bot mitigation.
  - Client-side 60-second submission rate limiting.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Vanilla HTML5, Modern CSS (Glassmorphism & Dark Palette), JavaScript (ES6+).
- **Backend / DB**: Supabase PostgreSQL (`sales_applications` table, RLS, DB triggers).
- **Storage**: Supabase Storage (`resumes` public bucket, 5MB PDF limit).
- **Serverless / Edge**: Supabase Edge Functions (`send-application-email` on Deno runtime).
- **Email Service**: Resend API (`notifications@career.alphaorbit.site`).
- **Deployment**: Vercel.

---

## 📁 Repository Structure

```text
├── index.html                 # Main application UI & stepper layout
├── styles.css                 # Dark theme styling, glassmorphism, animations
├── app.js                     # Step controller, dynamic role renderer, form handler
├── config.js                  # Supabase public project configuration
├── supabase-client.js         # Supabase Storage upload & REST submission client
├── vercel.json                # Vercel deployment & routing configuration
├── migrations/                # Database migrations & SQL security patches
│   ├── 001_create_sales_applications.sql
│   ├── 003_update_schema_and_storage.sql
│   ├── 005_add_privacy_accepted.sql
│   └── 009_security_hardening_and_storage_limit.sql
├── scripts/                   # Automated deployment & verification scripts
│   ├── execute_security_and_storage_migration.js
│   ├── revert_storage_policies_and_test.js
│   ├── deploy_edge_function.js
│   └── security_audit.js
└── supabase/
    └── functions/
        └── send-application-email/
            └── index.ts       # Deno Edge Function for Resend email dispatch
```

---

## ⚙️ Setup & Configuration

### 1. Client Configuration (`config.js`)
Ensure `config.js` points to your active Supabase project:
```javascript
window.ALPHA_ORBIT_CONFIG = {
  supabaseUrl: 'https://qitgpnugxjameulzhyoq.supabase.co',
  supabaseAnonKey: 'sb_publishable_...',
};
```

### 2. Database Schema (`public.sales_applications`)
```sql
CREATE TABLE public.sales_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  linkedin_url text NOT NULL,
  role_applied_for text NOT NULL,
  role_other_text text,
  privacy_accepted boolean NOT NULL DEFAULT true,
  years_of_sales_experience text,
  relevant_experience text,
  why_fit text,
  expected_compensation text,
  availability text,
  primary_skills text,
  project_description text,
  portfolio_url text,
  resume_file_name text,
  resume_url text,
  created_at timestamptz DEFAULT now()
);
```

### 3. Storage Bucket Setup (`resumes`)
```sql
UPDATE storage.buckets 
SET file_size_limit = 5242880, -- 5MB limit
    allowed_mime_types = ARRAY['application/pdf']::text[],
    public = true
WHERE id = 'resumes';

CREATE POLICY "anon_resume_upload"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'resumes');
```

---

## 🔒 Security Audit & Compliance

Run the automated security scanner to audit working tree files and git history for credential leaks:
```bash
node scripts/security_audit.js
```

---

## 📄 License

Copyright © 2026 **Alpha Orbit**. All rights reserved.
