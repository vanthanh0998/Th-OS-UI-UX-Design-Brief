import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function capture() {
  const outputDir = path.resolve(process.cwd(), 'docs/reviews/screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // 1. Desktop 1280x800 - Customers
  console.log('Capturing Desktop Customers (1280x800)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({
    path: path.join(outputDir, 'customers-desktop-1280.png'),
    fullPage: false,
  });

  // 2. Mobile 390x844 - Customers
  console.log('Capturing Mobile Customers (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({
    path: path.join(outputDir, 'customers-mobile-390.png'),
    fullPage: false,
  });

  // 3. Mobile 390x844 - Technician Dashboard
  console.log('Capturing Mobile Technician Dashboard (390x844)...');
  const navBtn = mobilePage.locator('nav[aria-label="Thanh điều hướng di động"] button').nth(1);
  await navBtn.click();
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({
    path: path.join(outputDir, 'technician-dashboard-mobile-390.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('All screenshots captured successfully in', outputDir);
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
