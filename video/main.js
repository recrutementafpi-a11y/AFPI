// Orchestration : chargement des assets/timings, montage des scènes, renderAt(t).
const TOTAL_DEFAULT = 184;
const CHAPTERS = { 1: ['1', 'Découvrir l’AFPI'], 2: ['2', 'Votre accueil'] };
let TIMING = null, TOTAL = TOTAL_DEFAULT;
const stage = document.getElementById('stage');
const rootScenes = document.getElementById('scenes');
const band = document.getElementById('band');
const titleEl = document.getElementById('title');
const wipeEl = document.getElementById('wipe');
const bg = document.getElementById('bg');

function fit() { const s = Math.min(innerWidth / W, innerHeight / H); if (QS.get('raw') !== '1') stage.style.transform = `scale(${s})`; }
addEventListener('resize', fit);

async function boot() {
  const [tm, man] = await Promise.all([fetch('timing.json').then(r => r.json()), fetch('manifest.json').then(r => r.json()).catch(() => ({ photos: [], logos: [] }))]);
  TIMING = tm; ASSETS.photos = man.photos; ASSETS.logos = man.logos;
  SCENES.forEach(sc => {
    const tm_ = TIMING.scenes[sc.id]; sc.start = tm_.start; sc.end = tm_.end;
    sc.root = h(rootScenes, 'scene'); sc.S = sc.build(sc.root, sc);
  });
  TOTAL = Math.max(...SCENES.map(s => s.end));
  // wipes : 8 volets géométriques
  window.bars = Array.from({ length: 9 }, (_, i) => h(wipeEl, '', '', `left:${i * 240 - 120}px;width:260px;background:${['#1E4E98', '#17A3DD', '#0F2F63', '#1E4E98', '#10567A', '#17A3DD', '#0F2F63', '#1E4E98', '#17A3DD'][i]};transform:skewX(-14deg) scaleY(0)`));
  // titre d'intertitre
  [1, 2].forEach(c => {
    const el = h(titleEl, 'a', '', 'inset:0;width:1920px;height:1080px;visibility:hidden');
    const g = svg(el, W, H, dp(gearPath(1500, 560, 520, 450, 20), 'style="stroke:rgba(255,255,255,.18)"') + dp(circ(1500, 560, 280), 'style="stroke:rgba(255,255,255,.18)"'), 'left:0;top:0');
    g.querySelectorAll('path').forEach(p => p.style.strokeWidth = '4');
    const n = T(el, CHAPTERS[c][0] + '.', 'left:180px;top:130px;font-size:380px;color:var(--cyan);line-height:1');
    const t = T(el, CHAPTERS[c][1], 'left:180px;top:640px;font-size:150px');
    const bar = h(el, 'a', '', 'left:180px;top:610px;width:500px;height:10px;background:var(--orange)');
    el._parts = { g, n, t, bar };
    CHAPTERS[c].el = el;
  });
  fit();
  await Promise.all(IMGS.map(i => i.decode().catch(() => {})));
  if (document.fonts) await document.fonts.ready;
  window.renderAt(QS.get('t') ? parseFloat(QS.get('t')) : 0);
  window.READY = true;
  if (QS.get('t') === null && QS.get('play') !== '0') play();
}

let startWall = null;
function play() { startWall = performance.now(); const loop = () => { const t = (performance.now() - startWall) / 1000; window.renderAt(Math.min(t, TOTAL)); if (t < TOTAL) requestAnimationFrame(loop); }; requestAnimationFrame(loop); }

window.renderAt = function (t) {
  // scènes
  let current = null;
  SCENES.forEach(sc => {
    const vis = t >= sc.start && t < sc.end;
    sc.root.style.display = vis ? 'block' : 'none';
    if (vis) { current = sc; const k = sc.D / (sc.end - sc.start); sc.update((t - sc.start) * k, sc.S, sc); }
  });
  // fenêtres : minutages absolus affichés dans le gabarit
  WINDOWS.forEach(w => { const sc = w.sc; const k = (sc.end - sc.start) / sc.D; w._abs = [sc.start + w.a * k, sc.start + Math.min(w.b, sc.D) * k]; if (w.tc) w.tc.textContent = `${tcFmt(w._abs[0])} → ${tcFmt(w._abs[1])}`; });
  // fond : lente dérive de la grille
  bg.style.transform = `translate(${(t * 6) % 80}px,${(t * 3) % 80}px)`;
  // bandeau de chapitre
  const showBand = current && current.ch > 0 && current.id !== 's1' && !(inTitle(t));
  band.style.display = showBand ? 'flex' : 'none';
  if (showBand) band.innerHTML = `<span class="n">${CHAPTERS[current.ch][0]}</span>${CHAPTERS[current.ch][1]}<span class="r">AFPI Région Dunkerquoise</span>`;
  // intertitres
  let tv = false;
  [1, 2].forEach(c => {
    const iv = TIMING.intertitres['ch' + c], el = CHAPTERS[c].el;
    const on = t >= iv.start && t < iv.end;
    el.style.visibility = on ? 'visible' : 'hidden';
    if (on) {
      tv = true;
      const u = t - iv.start, calm = c === 2, d = iv.end - iv.start;
      const p = el._parts;
      drawAll(p.g, P(u, .2, 1.4, E.io), .1);
      p.g.style.transform = `rotate(${u * (calm ? 8 : 16)}deg)`; p.g.style.transformOrigin = '1500px 560px';
      rise(p.n, u, .35, calm ? .8 : .5, 0, -120);
      rise(p.t, u, .55, calm ? .9 : .6, 0, 160);
      p.bar.style.transform = `scaleX(${P(u, .5, .6, E.io)})`; p.bar.style.transformOrigin = '0 50%';
      // sortie : volet géométrique vers la droite
      const q = P(u, d - .4, .4, E.io);
      el.style.clipPath = `polygon(0 0,${100 - q * 100 + 14 * (1 - q)}% 0,${100 - q * 100}% 100%,0 100%)`;
      if (q >= 1) el.style.visibility = 'hidden';
    }
  });
  titleEl.style.display = tv ? 'block' : 'none';
  // volets de transition entre scènes (autour de chaque début de scène sauf s1 et fin)
  let wv = null;
  SCENES.forEach((sc, i) => {
    if (i === 0) return;
    const calm = sc.ch === 2 && sc.id !== 'fin' ? true : false;
    const d = calm ? .5 : .32;
    if (t >= sc.start - d && t < sc.start + d) wv = { b: sc.start, d, calm };
  });
  bars.forEach((b, i) => {
    if (!wv) { b.style.display = 'none'; return; }
    b.style.display = 'block';
    const delay = i * (wv.calm ? .035 : .02), dd = wv.d - 0.2 * wv.d;
    if (t < wv.b) { b.style.transformOrigin = '50% 0'; b.style.transform = `skewX(-14deg) scaleY(${P(t, wv.b - wv.d + delay, dd, E.io)})`; }
    else { b.style.transformOrigin = '50% 100%'; b.style.transform = `skewX(-14deg) scaleY(${1 - P(t, wv.b + delay, dd, E.io)})`; }
  });
};
function inTitle(t) { return Object.values(TIMING.intertitres).some(iv => t >= iv.start && t < iv.end); }
window.TOTAL = () => TOTAL;
window.WINDOWS_ABS = () => WINDOWS.map(w => ({ nom: w.name, scene: w.sc.id, debut: +w._abs[0].toFixed(2), fin: +w._abs[1].toFixed(2), x: w.x, y: w.y, l: w.w, h: w.h }));
boot();
