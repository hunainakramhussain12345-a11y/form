const fs = require('fs');
const path = require('path');

const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'qitgpnugxjameulzhyoq';
const slug = 'send-application-email';

async function deployFunction() {
  const filePath = path.join(__dirname, '..', 'supabase', 'functions', slug, 'index.ts');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  console.log(`Deploying function ${slug} to project ${projectRef}...`);
  
  // Test POST / PATCH with multipart / raw file
  const resPatch = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions/${slug}?verify_jwt=true`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      body: fileContent,
      verify_jwt: true
    })
  });

  console.log('PATCH JSON STATUS:', resPatch.status);
  console.log('PATCH JSON RESPONSE:', await resPatch.text());
}

deployFunction().catch(console.error);
