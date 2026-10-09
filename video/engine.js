// Moteur : fonctions utilitaires déterministes (tout est recalculé à partir de t).
const W = 1920, H = 1080;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const E = {
  lin: x => x, out: x => 1 - Math.pow(1 - x, 3), in: x => x * x * x,
  io: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  back: x => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
  soft: x => 1 - Math.pow(1 - x, 2),
};
const P = (u, a, d, e = E.out) => e(clamp((u - a) / d));
const lerp = (a, b, p) => a + (b - a) * p;
const rnd = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

const QS = new URLSearchParams(location.search);
const LABELS = QS.get('labels') !== '0';
if (!LABELS) document.getElementById('stage').classList.add('nolabels');

function h(parent, cls, html = '', style = '', tag = 'div') {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  el.innerHTML = html;
  if (style) el.style.cssText = style;
  parent.appendChild(el);
  return el;
}
const T = (parent, txt, style, cls = 't') => h(parent, cls, txt, style);
function put(el, o = {}) {
  const { o: op = 1, x = 0, y = 0, s = 1, r = 0 } = o;
  el.style.opacity = op;
  el.style.transform = `translate(${x}px,${y}px) rotate(${r}deg) scale(${s})`;
  el.style.visibility = op <= 0.001 ? 'hidden' : 'visible';
}
// apparition simple : fondu + glissé
function rise(el, u, a, d = .6, dy = 40, dx = 0, e = E.out) {
  const p = P(u, a, d, e);
  put(el, { o: P(u, a, d * .7, E.lin), x: (1 - p) * dx, y: (1 - p) * dy });
}
const svg = (parent, w, h_, inner, style = '', cls = 'bp') =>
  h(parent, 'a', `<svg class="${cls}" width="${w}" height="${h_}" viewBox="0 0 ${w} ${h_}">${inner}</svg>`, style);
const dp = (d, extra = '') => `<path class="dr" pathLength="1" d="${d}" ${extra}/>`;
function drawAll(el, p, stagger = .35) { drawIc(el, p, stagger); }
function setDraw(pathEl, p) { pathEl.style.strokeDasharray = '1 2'; pathEl.style.strokeDashoffset = (1 - clamp(p)).toFixed(4); }

// Assets déposés par l'utilisateur
const ASSETS = { photos: [], logos: [] };
const stem = f => f.replace(/\.[^.]+$/, '');
const findPhoto = key => ASSETS.photos.find(f => stem(f).toLowerCase() === key.toLowerCase());
const IMGS = [];

// Cadre photo : découpe chanfreinée + tracé technique + zoom lent + filtre colorimétrique
const CH = 36;
function chamfer(w, h_) { return `polygon(0 0,${w - CH}px 0,${w}px ${CH}px,${w}px ${h_}px,${CH}px ${h_}px,0 ${h_ - CH}px)`; }
function frame(parent, key, x, y, w, h_, o = {}) {
  const el = h(parent, 'frame', '', `left:${x}px;top:${y}px;width:${w}px;height:${h_}px`);
  const cut = h(el, 'cut', '', `clip-path:${chamfer(w, h_)}`);
  const rv = h(cut, 'rv');
  const file = findPhoto(key);
  let img = null;
  if (file) {
    img = h(rv, '', '', '', 'img'); img.src = 'assets/photos/' + file; IMGS.push(img);
    h(rv, 'tint');
  } else {
    h(rv, 'miss', `<b>PHOTO À FOURNIR</b><i>${key}.jpg</i>`);
  }
  const line = svg(el, w + 28, h_ + 28, dp(`M0 0H${w - CH}L${w} ${CH}V${h_}H${CH}L0 ${h_ - CH}Z`, 'transform="translate(0,0)"'), 'left:-14px;top:-14px;pointer-events:none');
  line.querySelector('path').setAttribute('transform', 'translate(14,14) scale(1)');
  return { el, rv, img, line, w, h: h_, dir: o.dir || 'l' };
}
// p : 0..1 entrée ; z : progression du zoom lent (0..1 sur toute la scène)
function frameAnim(f, p, z = 0, out = 0) {
  const q = clamp(p) * (1 - clamp(out));
  f.el.style.visibility = q <= 0.001 ? 'hidden' : 'visible';
  const w = f.w, h_ = f.h;
  const ins = (1 - E.io(clamp(p * 1.15))) * 100;
  f.rv.style.clipPath = f.dir === 'l' ? `inset(0 ${ins}% 0 0)` : f.dir === 'u' ? `inset(0 0 ${ins}% 0)` : `inset(${ins}% 0 0 0)`;
  f.el.style.opacity = clamp(1 - out * 1.2);
  const path = f.line.querySelector('path');
  setDraw(path, clamp(p * 1.6));
  path.style.opacity = clamp(1 - Math.max(0, p - .85) * 3 * 0.4);
  if (f.img) f.img.style.transform = `scale(${1.04 + z * .09})`;
}

// Fenêtre vidéo : fond neutre uni identifié par le nom de scène
const WINDOWS = [];
function vwin(sc, parent, name, x, y, w, h_, a, b, o = {}) {
  const el = h(parent, 'vwin', '', `left:${x}px;top:${y}px;width:${w}px;height:${h_}px`);
  const cut = h(el, 'cut', '', `clip-path:${chamfer(w, h_)}`);
  const vi = h(cut, 'vi');
  h(vi, 'vl', `<b>FENÊTRE VIDÉO</b><span>${name}</span><small data-tc></small>`);
  const line = svg(el, w + 28, h_ + 28, dp(`M0 0H${w - CH}L${w} ${CH}V${h_}H${CH}L0 ${h_ - CH}Z`), 'left:-14px;top:-14px;pointer-events:none');
  line.querySelector('path').setAttribute('transform', 'translate(14,14)');
  const rec = { name, sc, a, b, x, y, w, h: h_, note: o.note || '', el, vi, line, tc: vi.querySelector('[data-tc]') };
  WINDOWS.push(rec);
  return rec;
}
// Entrée par volet gauche→droite, sortie par volet vers la droite ; renvoie true si visible
function winAnim(wn, u, calm = false) {
  const din = calm ? .8 : .5, dout = calm ? .6 : .4;
  const pin = P(u, wn.a, din, E.io), pout = P(u, wn.b - dout, dout, E.io);
  const vis = u >= wn.a && u <= wn.b;
  wn.el.style.visibility = vis ? 'visible' : 'hidden';
  wn.vi.style.clipPath = pout > 0 ? `inset(0 0 0 ${pout * 100}%)` : `inset(0 ${(1 - pin) * 100}% 0 0)`;
  const path = wn.line.querySelector('path');
  setDraw(path, pout > 0 ? 1 - pout : clamp(pin * 1.4));
  return vis;
}
