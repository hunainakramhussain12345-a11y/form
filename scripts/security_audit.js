const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');

function getFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === '.git' || file === 'node_modules') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function runSecurityAudit() {
  console.log('====================================================');
  console.log('       REPOSITORY CREDENTIAL LEAKAGE AUDIT          ');
  console.log('====================================================\n');

  const files = getFilesRecursively(rootDir);

  // Secret detection patterns
  const secretPatterns = [
    { name: 'Supabase Service Role Key', regex: /service_role[a-zA-Z0-9_-]{20,}/g },
    { name: 'Supabase Secret Token', regex: /sbp_[a-f0-9]{40}/g },
    { name: 'Resend API Key', regex: /re_[A-Za-z0-9_-]{20,}/g },
    { name: 'GitHub Token', regex: /ghp_[A-Za-z0-9]{36}/g }
  ];

  console.log('1. AUDITING WORKING TREE FILES:');
  console.log(`Total files audited: ${files.length}\n`);

  let workingTreeLeaks = [];

  for (const filePath of files) {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue; // Binary file or unreadable
    }

    for (const pattern of secretPatterns) {
      const matches = content.match(pattern.regex);
      if (matches) {
        workingTreeLeaks.push({
          file: relPath,
          pattern: pattern.name,
          matchesCount: matches.length
        });
      }
    }
  }

  if (workingTreeLeaks.length === 0) {
    console.log('✅ WORKING TREE AUDIT CLEAN: No hardcoded secrets found in working tree files.');
  } else {
    console.log('⚠️ WORKING TREE LEAKS DETECTED:', JSON.stringify(workingTreeLeaks, null, 2));
  }

  console.log('\n2. SPECIFIC FILE INSPECTIONS:');

  // Check config.js
  const configPath = path.join(rootDir, 'config.js');
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    console.log('\n--- config.js Contents ---');
    console.log(configContent.trim());
  }

  // Check supabase/functions/send-application-email/index.ts
  const edgeFnPath = path.join(rootDir, 'supabase', 'functions', 'send-application-email', 'index.ts');
  if (fs.existsSync(edgeFnPath)) {
    const fnContent = fs.readFileSync(edgeFnPath, 'utf8');
    const hasResendSecretRef = fnContent.includes("Deno.env.get('RESEND_API_KEY')");
    const hasHardcodedResendKey = /re_[A-Za-z0-9_-]{20,}/.test(fnContent);
    console.log('\n--- Edge Function (send-application-email/index.ts) ---');
    console.log(`- References Deno.env.get('RESEND_API_KEY'): ${hasResendSecretRef}`);
    console.log(`- Contains hardcoded Resend API Key: ${hasHardcodedResendKey}`);
  }

  // Check .env files
  const envFiles = files.filter(f => path.basename(f).startsWith('.env'));
  console.log(`\n--- .env Files in Repository ---`);
  if (envFiles.length === 0) {
    console.log('✅ No .env files committed in working tree.');
  } else {
    console.log('Committed .env files:', envFiles.map(f => path.relative(rootDir, f)));
  }

  console.log('\n3. AUDITING GIT COMMIT HISTORY FOR HISTORICAL SECRET LEAKS:');
  try {
    const gitLogOutput = execSync('git log -p -S "sbp_" -S "re_" -S "ghp_" -S "service_role"', {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });

    let gitLeaksFound = [];

    for (const pattern of secretPatterns) {
      const matches = gitLogOutput.match(pattern.regex);
      if (matches) {
        gitLeaksFound.push({
          pattern: pattern.name,
          uniqueMatches: [...new Set(matches)]
        });
      }
    }

    if (gitLeaksFound.length === 0) {
      console.log('✅ GIT HISTORY CLEAN: No secrets found in git commit diff history.');
    } else {
      console.log('⚠️ HISTORICAL SECRETS FOUND IN GIT COMMITS:');
      console.log(JSON.stringify(gitLeaksFound, null, 2));
      console.log('\nNOTE: If any token was exposed in prior commits, verify it is invalidated/rotated on Supabase/GitHub/Resend dashboards.');
    }
  } catch (err) {
    console.log('Git log check completed with status:', err.message);
  }
}

runSecurityAudit().catch(console.error);
