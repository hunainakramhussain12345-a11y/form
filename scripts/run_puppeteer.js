
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
          await page.screenshot({ path: path.join('C:/Users/ZEESHAN/alpha-orbit-careers-form', 'screenshot_' + bp.name + '_step1.png'), fullPage: true });

          // Navigate to Step 2 for Sales
          await page.type('#fullName', 'Test Candidate');
          await page.type('#email', 'candidate@alphaorbit.site');
          await page.type('#phone', '+15551234567');
          await page.type('#linkedinUrl', 'https://linkedin.com/in/testcandidate');
          await page.select('#roleApplied', 'Sales & Business Development');
          await page.click('#next-step-btn');
          await new Promise(r => setTimeout(r, 500));
          await page.screenshot({ path: path.join('C:/Users/ZEESHAN/alpha-orbit-careers-form', 'screenshot_' + bp.name + '_step2_sales.png'), fullPage: true });

          // Go back to Step 1 & switch role to Web Development
          await page.click('#prev-step-btn');
          await page.select('#roleApplied', 'Web Development');
          await page.click('#next-step-btn');
          await new Promise(r => setTimeout(r, 500));
          await page.screenshot({ path: path.join('C:/Users/ZEESHAN/alpha-orbit-careers-form', 'screenshot_' + bp.name + '_step2_webdev.png'), fullPage: true });
        }

        await browser.close();
        console.log('Screenshots generated successfully!');
      })();
    