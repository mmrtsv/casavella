// Renders a scene file in ads/video to ads/<name>.mp4 (1920x1080, 25 fps):
// node ads/video/render.cjs                  -> estrategia, 60 s
// node ads/video/render.cjs estado 113       -> estado, 113 s
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const NAME = process.argv[2] || 'estrategia', SECONDS = +(process.argv[3] || 60), FPS = 25;
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lcv-frames-'));
  const b = await chromium.launch(), page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(__dirname, NAME + '.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  for (let i = 0; i < FPS * SECONDS; i++) {
    await page.evaluate(t => render(t), i / FPS);
    await page.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  }
  await b.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', path.join(__dirname, '..', NAME + '.mp4')]);
  fs.rmSync(dir, { recursive: true });
})();
