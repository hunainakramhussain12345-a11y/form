# Alpha Orbit Careers Application Form

This is a polished single-page candidate application form for a sales/business development role.

## Setup

1. Replace the placeholder Supabase values in `config.js` with your project URL and anon public key.
2. Create a table in Supabase with the following shape:

```sql
create table public.sales_applications (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null,
  phone_number text not null,
  linkedin_url text not null,
  current_role_company text not null,
  years_of_sales_experience text not null,
  relevant_experience text not null,
  why_fit text not null,
  expected_compensation text not null,
  availability text not null,
  resume_file_name text,
  created_at timestamptz default now()
);
```

3. Serve the folder locally and open `index.html` in your browser.
