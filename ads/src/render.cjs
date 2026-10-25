// Renders every page in ads/src/html/ to a PNG in ads/, at its own size: node ads/src/render.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'html'), out = path.join(__dirname, '..');
(async () => {
  const b = await chromium.launch(), page = await b.newPage();
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort()) {
    await page.goto('file://' + path.join(dir, f));
    await page.evaluate(() => document.fonts.ready);
    const box = await page.$eval('.c', e => ({ w: e.offsetWidth, h: e.offsetHeight }));
    await page.setViewportSize({ width: box.w, height: box.h });
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(out, f.replace('.html', '.png')) });
  }
  await b.close();
})();
