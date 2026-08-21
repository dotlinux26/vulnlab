'use strict';
/**
 * CyberShop review-moderation bot.
 * Logs in with a FAKE shop-admin account (scoped to this lab only) and visits
 * /admin/reviews periodically so stored XSS payloads execute against an admin session.
 * Network-isolated: no Internet access, no host FS, no Docker socket.
 */
const { chromium } = require('playwright');

const WEB_URL = process.env.WEB_URL || 'http://web:3000';
const EMAIL = process.env.BOT_ADMIN_EMAIL || 'admin@cybershop.vn';
const PASS = process.env.BOT_ADMIN_PASS || 'Admin#1337';
const INTERVAL_MS = Number(process.env.BOT_INTERVAL_MS || 30000);

async function visit() {
  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox'] });
    const ctx = await browser.newContext(); // ephemeral profile every run
    const page = await ctx.newPage();

    await page.goto(`${WEB_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name=email]', EMAIL);
    await page.fill('input[name=password]', PASS);
    await Promise.all([
      page.waitForURL('**/catalog', { timeout: 15000 }).catch(() => {}),
      page.click('button[type=submit]'),
    ]);

    await page.goto(`${WEB_URL}/admin/reviews`, { waitUntil: 'networkidle', timeout: 20000 });
    console.log(`[bot] visited /admin/reviews at ${new Date().toISOString()}`);
    await page.waitForTimeout(8000); // give async XSS payloads time to fire
  } catch (e) {
    console.error('[bot] error:', e.message);
  } finally {
    await browser.close().catch(() => {});
  }
}

(async () => {
  console.log(`[bot] starting — target ${WEB_URL}, interval ${INTERVAL_MS}ms`);
  while (true) {
    await visit();
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
})();
