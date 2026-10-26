// Renders ads/video/estrategia.html to ads/estrategia.mp4 (60 s, 1920x1080, 25 fps): node ads/video/render.cjs
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const FPS = 25, SECONDS = 60;
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lcv-frames-'));
  const b = await chromium.launch(), page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(__dirname, 'estrategia.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  for (let i = 0; i < FPS * SECONDS; i++) {
    await page.evaluate(t => render(t), i / FPS);
    await page.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  }
  await b.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', path.join(__dirname, '..', 'estrategia.mp4')]);
  fs.rmSync(dir, { recursive: true });
})();
