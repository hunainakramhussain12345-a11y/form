const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// Simple static HTTP server
const server = http.createServer((req, res) => {
  let filePath = path.join(rootDir, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  let contentType = 'text/html';
  if (ext === '.css') contentType = 'text/css';
  if (ext === '.js') contentType = 'text/javascript';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  if (ext === '.svg') contentType = 'image/svg+xml';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(8085, async () => {
  console.log('Static server listening on http://localhost:8085');

  try {
    // Install puppeteer if needed and capture screenshots
    console.log('Capturing screenshots via puppeteer script...');
    const runnerScript = `
      const puppeteer = require('puppeteer');
      const path = require('path');

      (async () => {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        const breakpoints = [
          { name: 'mobile_375px', width: 375, height: 812 },
          { name: 'tablet_768px', width: 768, height: 1024 },
          { name: 'desktop_1024px', width: 1024, height: 900 },
          { name: 'desktop_1440px', width: 1440, height: 900 },
        ];

        for (const bp of breakpoints) {
          await page.setViewport({ width: bp.width, height: bp.height, deviceScaleFactor: 2 });
          await page.goto('http://localhost:8085', { waitUntil: 'networkidle0' });
          
          // Capture Step 1
          await page.screenshot({ path: path.join('${rootDir.replace(/\\/g, '/')}', 'screenshot_' + bp.name + '_step1.png'), fullPage: true });

          // Navigate to Step 2 for Sales
          await page.type('#fullName', 'Test Candidate');
          await page.type('#email', 'candidate@alphaorbit.site');
          await page.type('#phone', '+15551234567');
          await page.type('#linkedinUrl', 'https://linkedin.com/in/testcandidate');
          await page.select('#roleApplied', 'Sales & Business Development');
          await page.click('#next-step-btn');
          await new Promise(r => setTimeout(r, 500));
          await page.screenshot({ path: path.join('${rootDir.replace(/\\/g, '/')}', 'screenshot_' + bp.name + '_step2_sales.png'), fullPage: true });

          // Go back to Step 1 & switch role to Web Development
          await page.click('#prev-step-btn');
          await page.select('#roleApplied', 'Web Development');
          await page.click('#next-step-btn');
          await new Promise(r => setTimeout(r, 500));
          await page.screenshot({ path: path.join('${rootDir.replace(/\\/g, '/')}', 'screenshot_' + bp.name + '_step2_webdev.png'), fullPage: true });
        }

        await browser.close();
        console.log('Screenshots generated successfully!');
      })();
    `;

    fs.writeFileSync(path.join(__dirname, 'run_puppeteer.js'), runnerScript);

    try {
      execSync('node scripts/run_puppeteer.js', { cwd: rootDir, stdio: 'inherit' });
    } catch (e) {
      console.log('Puppeteer not installed locally, installing puppeteer...');
      execSync('npm install puppeteer --save-dev', { cwd: rootDir, stdio: 'inherit' });
      execSync('node scripts/run_puppeteer.js', { cwd: rootDir, stdio: 'inherit' });
    }
  } catch (err) {
    console.error('Error generating screenshots:', err);
  } finally {
    server.close();
  }
});
