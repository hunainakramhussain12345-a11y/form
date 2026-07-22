// Node 18+ / fetch script to POST a test candidate row to Supabase REST endpoint and verify insertion
// Usage:
// SUPABASE_URL="https://qitgpnugxjameulzhyoq.supabase.co" SUPABASE_ANON_KEY="sb_publishable_..." node tests/test_submit.js

(async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qitgpnugxjameulzhyoq.supabase.co';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    process.exit(1);
  }

  const base = SUPABASE_URL.replace(/\/$/, '');
  const tableUrl = `${base}/rest/v1/sales_applications`;

  const payload = {
    full_name: 'Automated Test Candidate',
    email: `apitest+${Date.now()}@example.com`,
    phone_number: '+1-555-0199',
    linkedin_url: 'https://www.linkedin.com/in/automated-test',
    current_role_company: 'Account Executive at TechCorp',
    years_of_sales_experience: '3-5',
    relevant_experience: 'B2B Sales',
    why_fit: 'Strong track record in SaaS sales growth.',
    expected_compensation: '$120,000 OTE',
    availability: 'Immediate',
    resume_file_name: 'test_resume.pdf',
  };

  try {
    console.log('Sending test candidate payload to Supabase...');
    const postResp = await fetch(tableUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload),
    });

    console.log('POST status:', postResp.status, postResp.statusText);
    const postBody = await postResp.text();
    try { console.log('POST response:', JSON.parse(postBody)); } catch { console.log('POST response text:', postBody); }

    if (!postResp.ok) {
      throw new Error(`POST failed with status ${postResp.status}`);
    }

    const getResp = await fetch(`${tableUrl}?select=*&order=created_at.desc&limit=5`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    const rows = await getResp.json();
    console.log('Latest rows in sales_applications:', rows);
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(2);
  }
})();
