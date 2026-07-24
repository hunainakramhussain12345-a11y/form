const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'qitgpnugxjameulzhyoq';
const anonKey = process.env.SUPABASE_ANON_KEY || '';

async function fetchQuery(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  return await res.json();
}

async function runFieldTest() {
  console.log('=== 1. TESTING SUBMISSION FOR A NON-SALES ROLE WITH NEW DROPDOWNS ===');
  const insertResult = await fetchQuery(`
    SET LOCAL ROLE anon;
    INSERT INTO public.sales_applications (
      full_name,
      email,
      phone_number,
      linkedin_url,
      role_applied_for,
      privacy_accepted,
      years_of_sales_experience,
      primary_skills,
      project_description,
      availability
    ) VALUES (
      'Field Test Candidate',
      'muhammadtahasattararain@gmail.com',
      '+15559876543',
      'https://linkedin.com/in/field-test-candidate',
      'Full Stack',
      true,
      'Professional',
      'React, Node.js, TypeScript, Supabase',
      'Building modern web applications with automated email workflows.',
      'Full Time'
    ) RETURNING id, full_name, role_applied_for, years_of_sales_experience, availability, created_at;
  `);

  console.log('INSERT RESULT:', JSON.stringify(insertResult, null, 2));

  console.log('\nWaiting 3 seconds for async Edge Function trigger execution...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n=== 2. CHECKING PG_NET TRIGGER LOG IN DATABASE ===');
  const netResponses = await fetchQuery(`
    SELECT id, status_code, content, created
    FROM net._http_response
    ORDER BY created DESC
    LIMIT 2;
  `);
  console.log('PG_NET RESPONSES:', JSON.stringify(netResponses, null, 2));
}

runFieldTest().catch(console.error);
