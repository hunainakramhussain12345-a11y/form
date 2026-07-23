const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'qitgpnugxjameulzhyoq';
const anonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM';

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

async function runRevertAndTest() {
  console.log('=== 1. DROPPING UPDATE & SELECT POLICIES FOR anon ON storage.objects ===');
  const dropResult = await fetchQuery(`
    DROP POLICY IF EXISTS "Allow anon update resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Allow anon select resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Allow anon upload resumes" ON storage.objects;
  `);
  console.log('DROP RESULT:', JSON.stringify(dropResult, null, 2));

  console.log('\n=== 2. CURRENT POLICIES ON storage.objects ===');
  const policies = await fetchQuery(`
    SELECT policyname, roles::text[], cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects';
  `);
  console.log('REMAINING POLICIES:', JSON.stringify(policies, null, 2));

  console.log('\n=== 3. TESTING HTTP UPLOAD WITHOUT X-UPSERT HEADER WITH ONLY INSERT POLICY ===');
  const uploadUrl = `https://${projectRef}.supabase.co/storage/v1/object/resumes/test_no_upsert_${Date.now()}.pdf`;
  const dummyPdfContent = Buffer.from('%PDF-1.4 %Testing clean insert without upsert header');

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/pdf',
    },
    body: dummyPdfContent
  });

  const status = res.status;
  const bodyText = await res.text();
  console.log('HTTP UPLOAD STATUS CODE:', status);
  console.log('HTTP UPLOAD RESPONSE BODY:', bodyText);
}

runRevertAndTest().catch(console.error);
