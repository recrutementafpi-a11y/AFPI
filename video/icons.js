// Pictogrammes plats, trait uniforme (viewBox 100×100, stroke = currentColor).
const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
function gearPath(cx, cy, ro, ri, n) {
  let d = ''; const st = Math.PI * 2 / n;
  for (let i = 0; i < n; i++) {
    const a = i * st;
    [[ri, a - st * .28], [ro, a - st * .16], [ro, a + st * .16], [ri, a + st * .28]].forEach(([r, an], j) => {
      d += (i === 0 && j === 0 ? 'M' : 'L') + (cx + r * Math.cos(an)).toFixed(1) + ' ' + (cy + r * Math.sin(an)).toFixed(1);
    });
  }
  return d + 'Z';
}
const ICONS = {
  gear: [gearPath(50, 50, 40, 31, 8), circ(50, 50, 12)],
  weld: ['M16 84L48 52', 'M48 52L60 40L72 50L60 62Z', 'M80 18V32M73 25H87', 'M84 48L94 44', 'M68 18L64 8', 'M90 62L96 66'],
  helmet: ['M16 66C16 40 32 24 50 24C68 24 84 40 84 66Z', 'M8 66H92V76H8Z', 'M50 24V48'],
  laptop: ['M22 26H78V64H22Z', 'M8 76H92L82 64H18Z', 'M44 70H56'],
  factory: ['M10 88V44L34 58V44L58 58V44L82 58V16H92V88Z', 'M26 74H34M46 74H54M66 74H74'],
  person: [circ(50, 30, 15), 'M20 90C20 62 80 62 80 90Z'],
  search: [circ(42, 42, 25), 'M60 60L86 86', 'M30 42H54'],
  cap: ['M50 18L94 40L50 62L6 40Z', 'M24 52V72C38 86 62 86 76 72V52', 'M94 40V66'],
  euro: [circ(50, 50, 40), 'M64 34A20 20 0 1 0 64 66', 'M28 44H56M28 56H56'],
  fork: ['M24 12V38M37 12V38M50 12V38', 'M24 38C24 54 50 54 50 38', 'M37 54V90', 'M72 90V12C88 24 88 54 72 58'],
  bus: ['M10 22H76C86 22 92 30 92 40V74H10Z', 'M18 34H38V52H18ZM46 34H66V52H46ZM74 34H84V52H74Z', 'M10 62H92', circ(30, 78, 9), circ(72, 78, 9)],
  clock: [circ(50, 50, 40), 'M50 24V50L68 62'],
  car: ['M6 62L16 44C19 40 23 38 29 38H62C68 38 73 41 77 46L88 56C93 58 94 62 94 66V72H6Z', circ(28, 74, 9), circ(72, 74, 9)],
  carTop: ['M32 10H68C80 10 82 18 82 28V74C82 86 78 92 68 92H32C22 92 18 86 18 74V28C18 18 20 10 32 10Z', 'M26 32L30 24H70L74 32Z', 'M26 74H74'],
  glasses: [circ(28, 58, 17), circ(72, 58, 17), 'M45 56H55', 'M12 50L6 38', 'M88 50L94 38'],
  gloves: ['M30 90V52L24 36C22 28 32 26 35 33L40 46V22C40 14 50 14 50 22V42V18C50 10 60 10 60 18V42V24C60 16 70 16 70 24V50V36C70 30 78 30 78 36V62C78 78 70 90 62 90Z'],
  boots: ['M28 10H56V50L86 64V88H16V70L28 66Z', 'M28 70H16'],
  alert: ['M50 10L94 88H6Z', 'M50 38V60', 'M50 72V74'],
  order: ['M20 12H80V90H20Z', 'M32 34H68M32 52H68M32 70H54', 'M60 68L66 74L76 62'],
  clean: ['M50 8L59 41L92 50L59 59L50 92L41 59L8 50L41 41Z', 'M80 12V24M74 18H86'],
  shelf: ['M10 18H90V44H10Z', 'M10 56H90V82H10Z', 'M38 31H62M38 69H62'],
  door: ['M22 12H62V88H22Z', 'M52 52V52.5'],
  exit: ['M14 12H56V88H14Z', 'M44 50H92M78 34L94 50L78 66'],
  window: ['M16 12H84V88H16Z', 'M50 12V88', 'M16 50H84'],
  smoke: ['M8 66H64V80H8Z', 'M70 66V80', 'M80 62C72 50 92 48 82 34', 'M90 64C84 56 96 54 92 46'],
  alarm: ['M16 16H84V84H16Z', circ(50, 50, 20), 'M50 38V50'],
  check: ['M18 54L40 76L84 26'],
  cross: ['M22 22L78 78M78 22L22 78'],
  arrow: ['M10 50H88M68 28L90 50L68 72'],
  pin: ['M50 92C26 62 22 48 22 36A28 28 0 0 1 78 36C78 48 74 62 50 92Z', circ(50, 36, 10)],
  group: [circ(34, 32, 12), 'M10 80C10 58 58 58 58 80Z', circ(70, 36, 11), 'M62 66C70 60 92 62 92 80H66'],
  gather: [circ(50, 50, 12), 'M50 8V30M41 20L50 30L59 20', 'M50 92V70M41 80L50 70L59 80', 'M8 50H30M20 41L30 50L20 59', 'M92 50H70M80 41L70 50L80 59'],
  doc: ['M24 8H62L80 26V92H24Z', 'M62 8V26H80', 'M36 46H68M36 60H68M36 74H56'],
  lockBody: ['M22 46H78V90H22Z', circ(50, 66, 6)],
  hand: ['M26 56V30C26 24 36 24 36 30V50V16C36 10 46 10 46 16V48V20C46 14 56 14 56 20V50V30C56 24 66 24 66 30V66C66 82 58 92 46 92C34 92 26 84 26 70Z'],
};
function ic(name, size, extra = '') {
  const ps = ICONS[name].map(d => `<path class="dr" pathLength="1" d="${d}"/>`).join('');
  return `<svg class="ic" viewBox="0 0 100 100" width="${size}" height="${size}" ${extra}>${ps}</svg>`;
}
// Dessin progressif d'un élément contenant des .dr (p de 0 à 1), léger décalage entre tracés
function drawIc(el, p, stagger = .5) {
  const ps = el.querySelectorAll('.dr'), n = ps.length;
  ps.forEach((s, i) => {
    const q = Math.min(1, Math.max(0, p * (1 + stagger * (n - 1)) - stagger * i));
    s.style.strokeDashoffset = (1 - q).toFixed(4);
  });
}
