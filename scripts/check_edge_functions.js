const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'qitgpnugxjameulzhyoq';

async function checkEdgeFunctions() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log('FUNCTIONS LIST STATUS:', res.status);
  const data = await res.json();
  console.log('FUNCTIONS LIST:', JSON.stringify(data, null, 2));
}

checkEdgeFunctions().catch(console.error);
