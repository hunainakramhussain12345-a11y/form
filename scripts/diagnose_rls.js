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

async function testHttpStorageUpload() {
  console.log('=== TESTING ACTUAL HTTP STORAGE UPLOAD WITH ANON KEY ===');
  const uploadUrl = `https://${projectRef}.supabase.co/storage/v1/object/resumes/test_anon_http_upload.pdf`;
  const dummyPdfContent = Buffer.from('%PDF-1.4 %Testing anon storage upload');

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'x-upsert': 'true',
      'Content-Type': 'application/pdf',
    },
    body: dummyPdfContent
  });

  const status = res.status;
  const bodyText = await res.text();
  console.log('HTTP UPLOAD STATUS:', status);
  console.log('HTTP UPLOAD RESPONSE:', bodyText);
}

testHttpStorageUpload().catch(console.error);
