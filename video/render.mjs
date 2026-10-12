// Rendu MP4 : node render.mjs [--fps 30] [--out sortie.mp4] [--from s] [--to s] [--still t] [--windows]
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? true : process.argv[i + 1]); };
const require = createRequire(import.meta.url);
let pw;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright', process.env.PLAYWRIGHT_PATH].filter(Boolean)) { try { pw = require(p); break; } catch {} }
if (!pw) throw new Error('Playwright introuvable : npm i -D playwright (ou définir PLAYWRIGHT_PATH)');

const fps = Number(arg('fps', 30)), out = path.resolve(here, arg('out', 'afpi-dunkerque.mp4'));
const port = 5181;
const srv = await startServer(port);
const exe = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH].find(p => p && fs.existsSync(p));
const browser = await pw.chromium.launch({ executablePath: exe && fs.statSync(exe).isFile() ? exe : undefined, args: ['--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('Erreur page :', e.message));
await page.goto(`http://localhost:${port}/?raw=1&play=0&t=0${arg('labels', '1') === '0' ? '&labels=0' : ''}`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
const total = await page.evaluate(() => window.TOTAL());

if (arg('windows', false)) {
  await page.evaluate(() => window.renderAt(1));
  const w = await page.evaluate(() => window.WINDOWS_ABS());
  const tc = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
  const md = ['# Fenêtres vidéo – minutages exacts', '', '| Fenêtre | Scène | Entrée | Sortie | Durée | Position (px) | Taille |', '|---|---|---|---|---|---|---|',
    ...w.map(x => `| \`${x.nom}\` | ${x.scene} | ${tc(x.debut)} | ${tc(x.fin)} | ${(x.fin - x.debut).toFixed(1)} s | ${x.x}, ${x.y} | ${x.l}×${x.h} |`), '',
    'Entrée/sortie : volet de 0,4 à 0,8 s inclus dans ces minutages (le plan est pleinement visible après l’entrée).'].join('\n');
  fs.writeFileSync(path.join(here, 'fenetres-video.md'), md + '\n');
  console.log(md);
}
if (arg('stills', false)) {
  const dir = path.resolve(arg('dir', '.'));
  fs.mkdirSync(dir, { recursive: true });
  for (const t of String(arg('stills')).split(',')) { await page.evaluate(t => window.renderAt(t), Number(t)); await page.screenshot({ path: path.join(dir, `t${String(t).padStart(6, '0')}.png`) }); }
} else if (arg('still', false)) {
  const t = Number(arg('still')); await page.evaluate(t => window.renderAt(t), t);
  const f = path.resolve(here, arg('o', `still-${t}.png`)); await page.screenshot({ path: f }); console.log(f);
} else if (!arg('windows', false) && !arg('stills', false)) {
  const from = Number(arg('from', 0)), to = Math.min(Number(arg('to', total)), total);
  const n = Math.round((to - from) * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.renderAt(t), from + i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (fps * 10) === 0) console.log(`${(from + i / fps).toFixed(0)} s / ${total} s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('Écrit :', out);
}
await browser.close(); srv.close();
