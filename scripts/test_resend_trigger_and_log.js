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

async function testTriggerAndResend() {
  console.log('=== 1. VERIFY DATABASE TRIGGER ON sales_applications ===');
  const triggerCheck = await fetchQuery(`
    SELECT trigger_name, event_object_table, action_timing, event_manipulation
    FROM information_schema.triggers
    WHERE event_object_table = 'sales_applications';
  `);
  console.log('TRIGGER INFO:', JSON.stringify(triggerCheck, null, 2));

  console.log('\n=== 2. TRIGGERING TEST INSERT ON sales_applications ===');
  const testEmail = 'muhammadtahasattararain@gmail.com';
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
      project_description
    ) VALUES (
      'Resend Test Candidate',
      '${testEmail}',
      '+15550192834',
      'https://linkedin.com/in/resend-test-candidate',
      'Web Development',
      true,
      '3-5 years',
      'React, Node.js, Supabase, Resend',
      'Automated candidate email notification workflow integration.'
    ) RETURNING id, full_name, email, created_at;
  `);
  console.log('INSERT RESULT:', JSON.stringify(insertResult, null, 2));

  console.log('\nWaiting 3 seconds for async pg_net trigger execution...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n=== 3. CHECKING pg_net HTTP RESPONSE IN POSTGRES ===');
  const netResponses = await fetchQuery(`
    SELECT id, status_code, content, created
    FROM net._http_response
    ORDER BY created DESC
    LIMIT 5;
  `);
  console.log('PG_NET HTTP RESPONSES:', JSON.stringify(netResponses, null, 2));

  console.log('\n=== 4. DIRECTLY CALLING EDGE FUNCTION TO VERIFY RESEND API 200 RESPONSE ===');
  const edgeFnRes = await fetch(`https://${projectRef}.supabase.co/functions/v1/send-application-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`
    },
    body: JSON.stringify({
      type: 'INSERT',
      table: 'sales_applications',
      record: {
        full_name: 'Resend Verification Candidate',
        email: testEmail,
        phone_number: '+15550192834',
        linkedin_url: 'https://linkedin.com/in/resend-verification',
        role_applied_for: 'Web Development',
        years_of_sales_experience: '3-5 years',
        primary_skills: 'Node.js, Supabase, Resend',
        project_description: 'Direct verification of Resend API email dispatch.'
      }
    })
  });
  console.log('EDGE FUNCTION HTTP STATUS:', edgeFnRes.status);
  const fnBody = await edgeFnRes.json();
  console.log('EDGE FUNCTION RESPONSE BODY:', JSON.stringify(fnBody, null, 2));
}

testTriggerAndResend().catch(console.error);
