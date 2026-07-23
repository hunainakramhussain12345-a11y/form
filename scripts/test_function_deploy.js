const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'qitgpnugxjameulzhyoq';

async function testFunctionEndpoints() {
  const getRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions/send-application-email`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('GET FUNCTION STATUS:', getRes.status);
  if (getRes.ok) {
    console.log('GET FUNCTION BODY:', JSON.stringify(await getRes.json(), null, 2));
  } else {
    console.log('GET FUNCTION TEXT:', await getRes.text());
  }
}

testFunctionEndpoints().catch(console.error);
