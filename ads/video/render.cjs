// Renders a scene file in ads/video to ads/<name>.mp4 (1920x1080, 25 fps):
// node ads/video/render.cjs                  -> estrategia, 60 s
// node ads/video/render.cjs estado           -> estado, with the narration in estado.voz.json
// A <name>.voz.json ({ seconds, voice: [{ at, file }] }) sets the length and puts each clip at its second.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const NAME = process.argv[2] || 'estrategia', FPS = 25;
const VOZ = fs.existsSync(path.join(__dirname, NAME + '.voz.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, NAME + '.voz.json'))) : null;
const SECONDS = +(process.argv[3] || (VOZ && VOZ.seconds) || 60);
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
  const args = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg')];
  if (VOZ) {
    for (const v of VOZ.voice) args.push('-i', path.join(__dirname, v.file));
    const mix = VOZ.voice.map((v, i) => `[${i + 1}:a]adelay=${Math.round(v.at * 1000)}:all=1[a${i}]`).join(';');
    args.push('-filter_complex', `${mix};${VOZ.voice.map((_, i) => `[a${i}]`).join('')}amix=inputs=${VOZ.voice.length}:normalize=0[a]`, '-map', '0:v', '-map', '[a]', '-c:a', 'aac', '-b:a', '160k', '-t', String(SECONDS));
  }
  args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', path.join(__dirname, '..', NAME + '.mp4'));
  execFileSync('ffmpeg', args);
  fs.rmSync(dir, { recursive: true });
})();
