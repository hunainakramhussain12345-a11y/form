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

async function verifyAll() {
  console.log('====================================================');
  console.log('   SUPABASE VERIFICATION & ADVISOR CHECK REPORT     ');
  console.log('====================================================\n');

  console.log('1. BUCKET CONFIGURATION (storage.buckets):');
  const bucketRes = await fetchQuery(`
    SELECT id, name, public, file_size_limit, file_size_limit / 1048576 AS file_size_mb, allowed_mime_types
    FROM storage.buckets
    WHERE id = 'resumes';
  `);
  console.log(JSON.stringify(bucketRes, null, 2));

  console.log('\n2. FUNCTION EXECUTE PERMISSIONS (information_schema.routine_privileges):');
  const privRes = await fetchQuery(`
    SELECT routine_schema, routine_name, grantee, privilege_type
    FROM information_schema.routine_privileges
    WHERE routine_name = 'notify_resend_on_application_insert';
  `);
  console.log(JSON.stringify(privRes, null, 2));

  console.log('\n3. FUNCTION SEARCH_PATH (pg_proc):');
  const pathRes = await fetchQuery(`
    SELECT proname, proconfig
    FROM pg_proc
    WHERE proname = 'notify_resend_on_application_insert';
  `);
  console.log(JSON.stringify(pathRes, null, 2));

  console.log('\n4. EXTENSION SCHEMA LOCATION (pg_extension):');
  const extRes = await fetchQuery(`
    SELECT extname, nspname AS schema_name
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE extname = 'pg_net';
  `);
  console.log(JSON.stringify(extRes, null, 2));

  console.log('\n5. SECURITY ADVISOR / LINTER AUDIT CHECKS:');
  
  // Check A: Extensions in public schema
  const extPublicCheck = await fetchQuery(`
    SELECT e.extname, n.nspname AS schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE n.nspname = 'public';
  `);
  console.log('- Extensions remaining in public schema (should be empty for pg_net):', JSON.stringify(extPublicCheck));

  // Check B: Functions in public schema with mutable search_path
  const searchPathCheck = await fetchQuery(`
    SELECT proname, proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (proconfig IS NULL OR NOT ('search_path=public, extensions, pg_temp' = ANY(proconfig) OR 'search_path=public, pg_temp' = ANY(proconfig)));
  `);
  console.log('- Functions with default/mutable search_path:', JSON.stringify(searchPathCheck));

  // Check C: Public RPC permissions on trigger function
  const publicRpcCheck = await fetchQuery(`
    SELECT routine_name, grantee, privilege_type
    FROM information_schema.routine_privileges
    WHERE routine_schema = 'public'
      AND routine_name = 'notify_resend_on_application_insert'
      AND grantee IN ('PUBLIC', 'anon', 'authenticated');
  `);
  console.log('- Public RPC permissions for notify_resend_on_application_insert (should be 0 rows):', JSON.stringify(publicRpcCheck));
}

verifyAll().catch(console.error);



