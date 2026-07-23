const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'qitgpnugxjameulzhyoq';

const sql = `
BEGIN;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon insert resumes" ON storage.objects;
DROP POLICY IF EXISTS "Anon Upload Resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select resumes" ON storage.objects;
DROP POLICY IF EXISTS "Public Select Resumes" ON storage.objects;

CREATE POLICY "Allow anon upload resumes" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Allow public select resumes" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'resumes');

COMMIT;
`;

async function applyStorageRls() {
  console.log('Applying storage.objects RLS policies via Supabase API...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const text = await res.text();
  console.log('STATUS:', res.status);
  console.log('RESPONSE:', text);
}

applyStorageRls().catch(console.error);
