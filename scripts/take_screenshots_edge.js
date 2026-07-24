const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const puppeteer = require('puppeteer-core');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

let executablePath = edgePaths.find(p => fs.existsSync(p));

if (!executablePath) {
  console.error('No system Edge or Chrome browser found.');
  process.exit(1);
}

console.log('Using browser executable:', executablePath);

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

server.listen(8087, async () => {
  console.log('Static server listening on http://localhost:8087');

  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const breakpoints = [
      { name: 'mobile_375px', width: 375, height: 812 },
      { name: 'tablet_768px', width: 768, height: 1024 },
      { name: 'desktop_1024px', width: 1024, height: 900 },
      { name: 'desktop_1440px', width: 1440, height: 900 },
    ];

    const artifactDir = 'C:\\Users\\ZEESHAN\\.gemini\\antigravity\\brain\\7b71e050-14a1-457b-9e8f-3251d6aecf60';

    for (const bp of breakpoints) {
      await page.setViewport({ width: bp.width, height: bp.height, deviceScaleFactor: 2 });
      await page.goto('http://localhost:8087', { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 600));

      // Step 1 Screenshot
      const step1Path = path.join(artifactDir, `screenshot_${bp.name}_step1.png`);
      await page.screenshot({ path: step1Path, fullPage: true });
      console.log('Saved:', step1Path);

      // Navigate to Step 2 for Sales
      await page.type('#fullName', 'Jane Doe');
      await page.type('#email', 'jane@alphaorbit.site');
      await page.type('#phone', '+15551234567');
      await page.type('#linkedinUrl', 'https://linkedin.com/in/janedoe');
      await page.select('#roleApplied', 'Sales & Business Development');
      await page.click('#next-step-btn');
      await new Promise(r => setTimeout(r, 500));

      const step2SalesPath = path.join(artifactDir, `screenshot_${bp.name}_step2_sales.png`);
      await page.screenshot({ path: step2SalesPath, fullPage: true });
      console.log('Saved:', step2SalesPath);

      // Back to Step 1 & switch to Web Development
      await page.click('#prev-step-btn');
      await page.select('#roleApplied', 'Web Development');
      await page.click('#next-step-btn');
      await new Promise(r => setTimeout(r, 500));

      const step2WebDevPath = path.join(artifactDir, `screenshot_${bp.name}_step2_webdev.png`);
      await page.screenshot({ path: step2WebDevPath, fullPage: true });
      console.log('Saved:', step2WebDevPath);
    }

    // Capture Success State
    await page.type('#primarySkills', 'React, Node.js, Python, AWS');
    await page.type('#portfolioUrl', 'https://jane-portfolio.com');
    await page.type('#projectDescription', 'Built a high-performance web app with full responsiveness and real-time database sync.');
    await page.select('#yearsExperience', 'Professional');
    await page.select('#availability', 'Full Time');
    await page.click('#privacyAccepted');
    await page.click('#submit-btn');
    await new Promise(r => setTimeout(r, 1000));

    const successPath = path.join(artifactDir, `screenshot_desktop_1440px_success.png`);
    await page.screenshot({ path: successPath, fullPage: true });
    console.log('Saved success state screenshot:', successPath);

    await browser.close();
    console.log('All responsive screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    server.close();
  }
});
