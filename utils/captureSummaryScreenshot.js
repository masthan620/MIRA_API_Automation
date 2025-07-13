import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { red, green, yellow, reset } from './apiClient.js';

// Load configuration from environment variables
const JENKINS_URL = process.env.JENKINS_URL;
const REPORT_URL = process.env.JENKINS_REPORT_URL;
const USERNAME = process.env.JENKINS_USERNAME;
const PASSWORD = process.env.JENKINS_PASSWORD;
const screenshotPath = process.env.SCREENSHOT_PATH;

// Validate required environment variables
function validateEnvironment() {
  const missing = [];
  if (!USERNAME) missing.push('JENKINS_USERNAME');
  if (!PASSWORD) missing.push('JENKINS_PASSWORD');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please set these environment variables in your .env file before running the script.');
    process.exit(1);
  }

  console.log('✅ All required environment variables are present');
}

(async () => {
  // Validate environment variables before proceeding
  validateEnvironment();

  const timeout = setTimeout(() => {
    console.error('⏱ Script timeout! Force exiting...');
    process.exit(1);
  }, 60000); // 1-minute max runtime safeguard

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--start-maximized'],
      defaultViewport: null,
    });

    const page = await browser.newPage();

    console.log('🔐 Logging into Jenkins...');
    await page.goto(JENKINS_URL, { waitUntil: 'networkidle2' });

    await page.type('input[name="j_username"]', USERNAME);
    await page.type('input[name="j_password"]', PASSWORD);

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    console.log('📊 Opening Allure Report...');
    await page.goto(REPORT_URL, { waitUntil: 'networkidle2' });

    await page.waitForSelector('.widget__title', { timeout: 10000 });

    console.log('📜 Scrolling to load all content...');
    await autoScroll(page);

    // ⏲ 5-second delay to ensure all content is fully loaded
    console.log('⏳ Waiting 5 seconds for content to fully load...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const fullHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
    });

    await page.setViewport({ width: 1920, height: fullHeight });

    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

    console.log('📸 Capturing full-page screenshot...');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`✅ Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.error('❌ Failed to capture screenshot:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
    clearTimeout(timeout); // Clear timeout guard
  }
})();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const delay = 50;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
  });
}