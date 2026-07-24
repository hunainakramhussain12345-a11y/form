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

async function checkSchemaAndPolicies() {
  console.log('=== COLUMN DEFINITIONS FOR sales_applications ===');
  const cols = await fetchQuery(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_applications';
  `);
  console.log(JSON.stringify(cols, null, 2));

  console.log('\n=== RLS POLICIES FOR sales_applications ===');
  const policies = await fetchQuery(`
    SELECT policyname, roles::text[], cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sales_applications';
  `);
  console.log(JSON.stringify(policies, null, 2));
}

checkSchemaAndPolicies().catch(console.error);
