const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'qitgpnugxjameulzhyoq';

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

async function runPolicyCheckAndCreate() {
  console.log('--- 1. EXISTING POLICIES BEFORE UPDATE ---');
  const initialPolicies = await fetchQuery(`
    SELECT policyname, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects';
  `);
  console.log('INITIAL POLICIES:', JSON.stringify(initialPolicies, null, 2));

  console.log('\n--- 2. CREATING OR ENSURING anon_resume_upload POLICY ---');
  const createPolicyResult = await fetchQuery(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'anon_resume_upload'
      ) THEN
        EXECUTE 'CREATE POLICY "anon_resume_upload" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = ''resumes'')';
      END IF;
    END $$;
  `);
  console.log('POLICY EXECUTION RESULT:', JSON.stringify(createPolicyResult, null, 2));

  console.log('\n--- 3. POLICIES AFTER UPDATE ---');
  const finalPolicies = await fetchQuery(`
    SELECT policyname, roles::text[], cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects';
  `);
  console.log('FINAL POLICIES:', JSON.stringify(finalPolicies, null, 2));
}

runPolicyCheckAndCreate().catch(console.error);
