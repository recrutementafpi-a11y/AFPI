// Scènes : build(root) crée le DOM une fois ; update(u, S) le positionne pour le temps local u (s nominales).
const SCENES = [];
const def = (id, ch, D, build, update) => SCENES.push({ id, ch, D, build, update });
const ORANGE = 'var(--orange)', CYAN = 'var(--cyan)';

// pièce industrielle (engrenage + bride) en tracé de plan
const GX = 960, GY = 500;
function sparks(root, n, seed = 0) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(h(root, 'a', '', `width:${6 + rnd(i + seed) * 8}px;height:3px;border-radius:2px;background:${i % 3 ? '#ffb347' : '#fff'};box-shadow:0 0 10px 2px rgba(255,140,0,.9);left:0;top:0;visibility:hidden`));
  return arr;
}
function sparkBurst(arr, u, t0, t1, y0, seed = 0, spread = 1) {
  const head = clamp((u - t0) / (t1 - t0));
  arr.forEach((el, i) => {
    const born = t0 + (t1 - t0) * (i / arr.length) * .98;
    const age = u - born;
    if (age < 0 || age > .9) { el.style.visibility = 'hidden'; return; }
    const x0 = lerp(-120, W + 120, E.io(clamp((born - t0) / (t1 - t0))));
    const vx = (rnd(i * 3 + seed) - .3) * 420 * spread, vy = (rnd(i * 7 + seed) - .75) * 520 * spread;
    const x = x0 + vx * age, y = y0 + Math.sin(born * 5) * 40 + vy * age + 900 * age * age;
    const ang = Math.atan2(vy + 1800 * age, vx) * 180 / Math.PI;
    el.style.visibility = 'visible';
    el.style.opacity = 1 - age / .9;
    el.style.transform = `translate(${x}px,${y}px) rotate(${ang}deg)`;
  });
}

def('s1', 1, 7, (root) => {
  const S = {};
  const gp = gearPath(GX, GY, 300, 252, 14);
  S.fill = svg(root, W, H, `<path d="${gp}" fill="#1E4E98" stroke="none"/><circle cx="${GX}" cy="${GY}" r="120" fill="#0A2347" stroke="none"/><circle cx="${GX}" cy="${GY}" r="52" fill="#1E4E98" stroke="none"/>`, 'left:0;top:0', '');
  S.bp = svg(root, W, H,
    dp(gp) + dp(circ(GX, GY, 120)) + dp(circ(GX, GY, 52)) + dp(circ(GX, GY, 205), 'stroke-dasharray="1 2"') +
    dp(`M${GX - 400} ${GY}H${GX + 400}`) + dp(`M${GX} ${GY - 380}V${GY + 380}`) +
    dp(`M${GX - 300} 905H${GX + 300}`) + dp(`M${GX - 300} 885V925M${GX + 300} 885V925`) +
    dp(`M${GX + 210} ${GY - 210}L${GX + 420} ${GY - 330}H${GX + 620}`) + dp(`M${GX - 52} ${GY + 52}L${GX - 330} ${GY + 330}H${GX - 560}`),
    'left:0;top:0');
  S.bp.querySelectorAll('path').forEach((p, i) => { if (i === 3) p.style.stroke = 'rgba(23,163,221,.6)'; });
  S.t1 = T(root, 'Ø 600', `left:${GX - 90}px;top:850px;font-size:34px;color:${CYAN};font-weight:600`);
  S.t2 = T(root, 'M12 × 14 dents', `left:${GX + 430}px;top:${GY - 395}px;font-size:30px;color:${CYAN};font-weight:600`);
  S.t3 = T(root, 'Ø 104', `left:${GX - 760}px;top:${GY + 280}px;font-size:30px;color:${CYAN};font-weight:600`);
  S.logoBox = h(root, 'a', '', `left:${GX - 500}px;top:${GY - 230}px;width:1000px;height:460px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 20px 60px rgba(0,0,0,.4)`);
  S.logo = h(S.logoBox, '', '', 'width:900px;height:394px;background:url(assets/logos/logo-afpi.png) center/contain no-repeat');
  S.sp = sparks(root, 40);
  S.head = h(root, 'a', '', 'left:0;top:0;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;background:radial-gradient(#fff 0,#ffb347 25%,rgba(255,107,0,.6) 45%,transparent 70%)');
  S.tag = h(root, 'a', '', `left:0;top:790px;width:1920px;text-align:center;font-size:76px;font-weight:800`);
  S.words = 'Les talents de l’industrie de demain'.split(' ').map(w => h(S.tag, '', w, 'display:inline-block;margin:0 .22em'));
  S.ul = svg(root, 900, 12, dp('M6 6H894', `stroke="${ORANGE}" stroke-width="0"`), `left:${GX - 450}px;top:895px`);
  S.ul.querySelector('path').setAttribute('stroke', 'var(--cyan)'); S.ul.querySelector('path').setAttribute('stroke-width', '6');
  return S;
}, (u, S) => {
  // tracé 0.2→2.8, remplissage 2.6→3.4, étincelle 3.4→4.3
  const pd = P(u, .2, 2.6, E.io);
  drawAll(S.bp, pd, .12);
  S.bp.style.transform = `rotate(0deg)`;
  [S.t1, S.t2, S.t3].forEach((t, i) => rise(t, u, 1.4 + i * .35, .5, 12));
  const fo = P(u, 2.6, .8, E.io);
  S.fill.style.opacity = fo * (1 - .8 * P(u, 4.0, .6));
  S.bp.style.opacity = 1 - .75 * P(u, 4.0, .6);
  [S.t1, S.t2, S.t3].forEach(t => { t.style.opacity = u > 3.2 ? Math.max(0, 1 - (u - 3.2) * 2) : t.style.opacity; });
  const sx = lerp(-150, W + 150, E.io(clamp((u - 3.4) / .9)));
  S.head.style.visibility = (u > 3.4 && u < 4.35) ? 'visible' : 'hidden';
  S.head.style.transform = `translate(${sx}px,${GY + Math.sin(u * 5) * 0}px)`;
  sparkBurst(S.sp, u, 3.4, 4.3, GY);
  const rp = clamp((sx - (GX - 500)) / 1000);
  S.logoBox.style.visibility = u > 3.4 ? 'visible' : 'hidden';
  S.logoBox.style.clipPath = `inset(0 ${(1 - rp) * 100}% 0 0)`;
  S.logoBox.style.transform = `translateY(${-70 * P(u, 4.3, .8, E.io)}px)`;
  S.tag.style.transform = 'translateY(0)';
  S.words.forEach((w, i) => { const p = P(u, 4.9 + i * .12, .55); w.style.opacity = p; w.style.transform = `translateY(${(1 - p) * 40}px)`; });
  setDraw(S.ul.querySelector('path'), P(u, 5.7, .9, E.io));
  S.ul.style.opacity = u > 5.7 ? 1 : 0;
  S.tag.style.top = '800px';
  S.ul.style.top = '895px';
});

// ---------- Scène 2 : Qui sommes-nous ----------
def('s2', 1, 14, (root) => {
  const S = {};
  // littoral stylisé (mer en haut), fleuves / canaux, repères
  S.coast = svg(root, W, H,
    dp('M-20 760C180 740 320 700 470 690C640 680 700 640 860 620C1020 600 1100 560 1250 570C1420 580 1520 520 1700 480C1800 458 1880 440 1960 420') +
    dp('M-20 800C200 782 330 742 480 732C650 722 710 684 870 664C1030 644 1110 604 1260 614C1430 624 1530 566 1710 524C1810 502 1890 484 1960 464', 'stroke-opacity=".4"') +
    dp('M470 690C470 790 480 900 500 1100') + dp('M1250 570C1270 700 1240 900 1260 1100') +
    dp('M-20 120H1960', 'stroke-opacity=".0"'), 'left:0;top:0');
  S.coast.querySelectorAll('path').forEach(p => p.style.strokeWidth = '3');
  S.sea = T(root, 'MER DU NORD', `left:1180px;top:960px;font-size:26px;color:${CYAN};letter-spacing:.4em;font-weight:600;opacity:.5;display:none`);
  S.sea2 = T(root, 'MER DU NORD', `left:760px;top:600px;font-size:24px;color:${CYAN};letter-spacing:.5em;font-weight:600;opacity:.55;transform:rotate(-9deg)`);
  const pins = [
    { key: 'S02_gravelines', name: 'Gravelines', sub: 'Antenne des Rives de l’Aa', px: 470, py: 690, fx: 140, side: 'l' },
    { key: 'S02_dunkerque', name: 'Dunkerque', sub: 'Centre Jacques Balloy', px: 1300, py: 570, fx: 1000, side: 'r' },
  ];
  S.pins = pins.map(o => {
    const fw = 660, fh = 330, fy = 130;
    const f = frame(root, o.key, o.fx, fy, fw, fh, { dir: 'u' });
    const f2 = o.key === 'S02_dunkerque' ? frame(root, 'S02_cantine', o.fx, fy, fw, fh, { dir: 'd' }) : null;
    const con = svg(root, W, H, dp(`M${o.fx + fw / 2} ${fy + fh}V${o.py - 24}`, 'stroke-dasharray="1 2"'), 'left:0;top:0');
    const dot = h(root, 'a', '', `left:${o.px - 20}px;top:${o.py - 20}px;width:40px;height:40px;border-radius:50%;background:${CYAN};box-shadow:0 0 0 8px rgba(23,163,221,.25)`);
    const ring = h(root, 'a', '', `left:${o.px - 20}px;top:${o.py - 20}px;width:40px;height:40px;border-radius:50%;border:4px solid ${CYAN}`);
    const lab = h(root, 'a', `<div style="font-size:60px;font-weight:800">${o.name}</div><div style="font-size:34px;font-weight:600;color:#bcd9f3;margin-top:6px">${o.sub}</div>`, `left:${o.fx}px;top:${o.py + 56}px;width:${fw}px;text-align:center`);
    return { o, f, f2, con, dot, ring, lab, fw, fh, fy };
  });
  const P1 = S.pins[1];
  S.chip = h(root, 'chip', `<span style="display:inline-block;vertical-align:middle;margin-right:14px">${ic('fork', 44)}</span>Cantine sur place`, `left:${P1.o.fx + 90}px;top:${P1.o.py + 215}px;font-size:36px`);
  S.net = h(root, 'a', `<div style="display:inline-block;background:rgba(255,255,255,.10);border:2px solid var(--cyan);padding:18px 44px;border-radius:6px;font-size:36px;font-weight:700"><span style="color:${CYAN}">Réseau</span> Pôle Formation des Industries Technologiques</div>`, 'left:0;top:925px;width:1920px;text-align:center');
  return S;
}, (u, S) => {
  const p = P(u, 2.3, 2.4, E.io);
  drawAll(S.coast, p, .15);
  rise(S.sea2, u, 3.4, .8, 0);
  const cue = [4.4, 7.4];
  S.pins.forEach((pn, i) => {
    const a = cue[i];
    const pdot = P(u, a, .5, E.back);
    put(pn.dot, { s: pdot, o: pdot > 0 ? 1 : 0 });
    const pr = (u - a) % 1.6, on = u > a && pr >= 0;
    put(pn.ring, { s: 1 + 2.6 * (on ? pr / 1.6 : 0), o: on ? (1 - pr / 1.6) * .9 : 0 });
    setDraw(pn.con.querySelector('path'), P(u, a + .2, .7, E.io));
    const open = P(u, a + .6, .8, E.io);
    const swap = i === 1 ? P(u, 10.8, .8, E.io) : 0;
    frameAnim(pn.f, open, P(u, a, 8), 0);
    if (pn.f2) { frameAnim(pn.f2, swap, P(u, 10.8, 3.2)); pn.f2.el.style.zIndex = 5; }
    rise(pn.lab, u, a + 1.1, .6, 24);
  });
  rise(S.chip, u, 10.4, .6, 26);
  rise(S.net, u, 12.0, .7, 30);
});

// ---------- Scène 3 : Nos domaines ----------
const DOMAINES = [
  { id: 'maintenance', icon: 'gear', title: 'Maintenance', size: 58, kw: ['Mécanique', 'Hydraulique', 'Automatisme'], media: 'video', win: 'V03a_maintenance' },
  { id: 'chaudronnerie', icon: 'weld', title: 'Chaudronnerie<br>Tuyauterie<br>Soudage', size: 44, kw: ['Acier', 'Inox', 'Thermoplastique'], media: 'photo', key: 'S03_soudage' },
  { id: 'securite', icon: 'helmet', title: 'Sécurité', size: 58, kw: ['SST', 'Travaux en hauteur', 'CACES®', 'Amiante', 'Espaces confinés'], media: 'video', win: 'V03b_securite' },
  { id: 'tertiaire', icon: 'laptop', title: 'Tertiaire', size: 58, kw: ['Management', 'RH', 'Bureautique', 'Langues'], media: 'photo', key: 'S03_tertiaire' },
];
def('s3', 1, 25, (root, sc) => {
  const S = { cols: [] };
  const cw = 400, ch = 880, gap = 50, x0 = (W - (4 * cw + 3 * gap)) / 2, y0 = 70;
  DOMAINES.forEach((d, i) => {
    const x = x0 + i * (cw + gap);
    const ghost = svg(root, cw + 4, ch + 4, dp(`M2 2H${cw + 2}V${ch + 2}H2Z`, 'stroke-dasharray="1 2" style="stroke:rgba(23,163,221,.45)"'), `left:${x - 2}px;top:${y0 - 2}px`);
    const col = h(root, 'a', '', `left:${x}px;top:${y0}px;width:${cw}px;height:${ch}px`);
    const bg = h(col, 'a', '', `inset:0;width:${cw}px;height:${ch}px;background:linear-gradient(180deg,rgba(30,78,152,.55),rgba(10,35,71,.85));border:2px solid ${CYAN}`);
    let media;
    if (d.media === 'photo') media = frame(col, d.key, 0, 0, cw, 320, { dir: 'u' });
    else { media = vwin(sc, col, d.win, 0, 0, cw, 320, 1.5 + i * 5.1, 25); media.x = x; media.y = y0; }
    const ico = h(col, 'a', `<div style="width:110px;height:110px;border-radius:50%;background:${CYAN};color:var(--navy);display:flex;align-items:center;justify-content:center">${ic(d.icon, 66)}</div>`, `left:30px;top:350px`);
    const tt = T(col, d.title, `left:30px;top:480px;font-size:${d.size}px;line-height:1.08;white-space:normal;width:${cw - 50}px`);
    const kwTop = d.id === 'chaudronnerie' ? 650 : 570;
    const chips = d.kw.map(k => h(col, 'chip', k, `left:0;top:0;font-size:${d.kw.length > 4 ? 26 : 30}px;padding:5px 18px`));
    // placement des pastilles en flux
    let cx = 30, cy = kwTop;
    chips.forEach(c => { c.style.position = 'absolute'; });
    S.cols.push({ d, x, y0, cw, ch, ghost, col, bg, media, ico, tt, chips, kwTop });
  });
  // mise en page des pastilles (après insertion pour mesurer)
  S.layout = false;
  return S;
}, (u, S, sc) => {
  if (!S.layout) {
    S.cols.forEach(c => {
      let cx = 30, cy = c.kwTop; const maxW = c.cw - 30;
      c.chips.forEach(ch => {
        const w = ch.offsetWidth, hh = ch.offsetHeight;
        if (cx + w > maxW && cx > 30) { cx = 30; cy += hh + 14; }
        ch.style.left = cx + 'px'; ch.style.top = cy + 'px'; cx += w + 14;
      });
    });
    S.layout = true;
  }
  const join = P(u, 21.6, 1.6, E.io);
  S.cols.forEach((c, i) => {
    const a = 1.2 + i * 5.1;
    setDraw(c.ghost.querySelector('path'), P(u, .3 + i * .15, 1, E.io));
    c.ghost.style.opacity = 1 - P(u, a, .3);
    const open = P(u, a, .9, E.io);
    c.col.style.clipPath = `inset(0 0 ${(1 - open) * 100}% 0)`;
    c.col.style.visibility = open > 0 ? 'visible' : 'hidden';
    const dx = (i - 1.5) * -40 * join; // les tuiles se rapprochent
    c.col.style.transform = `translateX(${dx}px)`;
    c.ghost.style.transform = `translateX(${dx}px)`;
    // média
    if (c.media.rv) frameAnim(c.media, P(u, a + .3, .9, E.io), P(u, a, 16));
    else winAnim(c.media, u);
    c.ico.style.opacity = P(u, a + .7, .4); put(c.ico, { o: P(u, a + .7, .4), s: .6 + .4 * P(u, a + .7, .5, E.back) });
    drawAll(c.ico, P(u, a + .7, .8));
    rise(c.tt, u, a + 1.0, .6, 24);
    c.chips.forEach((ch, k) => { const q = P(u, a + 1.7 + k * .35, .5, E.back); put(ch, { s: .6 + .4 * q, o: q > 0 ? 1 : 0 }); ch.style.transformOrigin = '0 50%'; });
    const dim = i * 5.1 + 1.2 > u ? 1 : 1;
    c.bg.style.boxShadow = `0 0 ${24 * (1 - join) + 14 * join}px rgba(23,163,221,${.28 + .25 * join})`;
    c.bg.style.opacity = 1;
  });
  // en fin de scène : les 4 tuiles réunies, léger pulse
  S.cols.forEach(c => { c.bg.style.borderColor = join > 0 ? `rgba(23,163,221,${.7 + .3 * Math.sin(u * 4)})` : CYAN; });
});

// ---------- Scène 4 : Pour qui ----------
const PUBLICS = [
  { icon: 'factory', t: 'Entreprises' }, { icon: 'person', t: 'Salariés' },
  { icon: 'search', t: 'Demandeurs<br>d’emploi' }, { icon: 'cap', t: 'Jeunes /<br>Alternance' },
];
def('s4', 1, 12, (root) => {
  const S = { cards: [] };
  const cw = 360, gap = 60, x0 = (W - (4 * cw + 3 * gap)) / 2;
  PUBLICS.forEach((p, i) => {
    const x = x0 + i * (cw + gap);
    const el = h(root, 'card', '', `left:${x}px;top:110px;width:${cw}px;height:340px;background:rgba(30,78,152,.5)`);
    const ico = h(el, 'a', ic(p.icon, 130), `left:${(cw - 130) / 2}px;top:34px;color:#fff`);
    const tx = T(el, p.t, `left:0;top:200px;width:${cw}px;text-align:center;font-size:42px;white-space:normal;line-height:1.1`);
    S.cards.push({ el, ico, tx, x });
  });
  // convergence vers un parcours commun
  const hx = 960, hy = 660;
  S.lines = svg(root, W, H, S.cards.map(c => dp(`M${c.x + cw / 2} 450C${c.x + cw / 2} 560 ${hx} 540 ${hx} ${hy - 70}`, `stroke-width="4"`)).join(''), 'left:0;top:0');
  S.lines.querySelectorAll('path').forEach(p => p.style.strokeWidth = '4');
  S.hub = h(root, 'a', `<div style="width:140px;height:140px;border-radius:50%;background:${CYAN};color:var(--navy);display:flex;align-items:center;justify-content:center">${ic('gear', 90)}</div>`, `left:${hx - 70}px;top:${hy - 70}px`);
  S.road = svg(root, 1100, 60, dp('M10 30H1060', 'stroke-width="8"') + `<path d="M1040 8L1086 30L1040 52" class="dr" pathLength="1" stroke-width="8"/>`, `left:${hx - 550}px;top:${hy + 85}px`);
  S.road.querySelectorAll('path').forEach(p => { p.style.strokeWidth = '8'; p.style.stroke = '#fff'; });
  S.par = T(root, 'Un parcours commun', `left:0;top:${hy + 20}px;width:${hx * 2 - 0}px;text-align:center;font-size:0px`);
  S.badge = h(root, 'a', `<span style="display:inline-block;vertical-align:middle;margin-right:22px">${ic('euro', 76)}</span><span style="vertical-align:middle">Financement possible</span>`, `left:0;top:840px;width:1920px;text-align:center;font-size:68px;font-weight:800;color:#fff`);
  S.badgeBox = h(root, 'a', '', `left:${hx - 480}px;top:820px;width:960px;height:120px;border:3px solid ${CYAN};background:rgba(23,163,221,.16);border-radius:70px`);
  return S;
}, (u, S) => {
  S.cards.forEach((c, i) => {
    const a = .4 + i * 1.1, p = P(u, a, .7, E.back);
    put(c.el, { o: P(u, a, .3), y: (1 - p) * 90 });
    drawAll(c.ico, P(u, a + .3, .9));
    rise(c.tx, u, a + .6, .5, 20);
  });
  drawAll(S.lines, P(u, 5.0, 1.8, E.io), .1);
  put(S.hub, { s: P(u, 6.4, .7, E.back), o: u > 6.4 ? 1 : 0 });
  S.hub.firstChild.firstChild.style.transform = `rotate(${u * 40}deg)`;
  drawAll(S.road, P(u, 7.3, 1.3, E.io), .15);
  put(S.badgeBox, { o: P(u, 8.7, .4), s: .9 + .1 * P(u, 8.7, .6, E.back) });
  rise(S.badge, u, 8.9, .6, 24);
});

// ---------- Scène 5 : Qualité et résultats ----------
def('s5', 1, 18, (root) => {
  const S = { certs: [] };
  const logos = ASSETS.logos.filter(f => /^cert_/i.test(f));
  const names = logos.length ? logos : ['Qualiopi', 'CQPM', 'TOSA', 'TOEIC'];
  const n = names.length, cw = Math.min(330, (1680 - (n - 1) * 36) / n), chh = 180, x0 = (W - (n * cw + (n - 1) * 36)) / 2;
  names.forEach((nm, i) => {
    const real = logos.length > 0;
    const el = h(root, 'a', real ? '' : `<div style="font-size:34px;font-weight:800;color:#33507d">${nm}</div><div style="font-size:18px;color:#7d92b5;font-weight:600">LOGO À FOURNIR : cert_${nm.toLowerCase()}.png</div>`,
      `left:${x0 + i * (cw + 36)}px;top:90px;width:${cw}px;height:${chh}px;background:#fff;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 14px 40px rgba(0,0,0,.35);padding:22px;text-align:center`);
    if (real) h(el, '', '', `width:100%;height:100%;background:url(assets/logos/${encodeURIComponent(nm)}) center/contain no-repeat`);
    S.certs.push(el);
  });
  S.cnt = [0, 1].map(i => {
    const cx = 510 + i * 900, cy = 600, r = 215;
    const ring = svg(root, 2 * r + 40, 2 * r + 40, `<path class="dr" pathLength="1" d="${circ(r + 20, r + 20, r)}" transform="rotate(-90 ${r + 20} ${r + 20})" style="stroke:var(--orange);stroke-width:18"/><circle cx="${r + 20}" cy="${r + 20}" r="${r}" style="stroke:rgba(255,255,255,.14);stroke-width:18"/>`, `left:${cx - r - 20}px;top:${cy - r - 20}px`);
    const num = h(root, 'a', `<span data-n>0</span><span style="font-size:96px;margin-left:6px">%</span>`, `left:${cx - r}px;top:${cy - 100}px;width:${2 * r}px;text-align:center;font-size:210px;font-weight:800;color:${ORANGE};line-height:1;display:flex;align-items:baseline;justify-content:center`);
    const lab = T(root, i ? 'de réussite<br>aux examens' : 'de satisfaction', `left:${cx - 330}px;top:810px;width:660px;text-align:center;font-size:56px;white-space:normal;line-height:1.1`);
    return { ring, num, lab, a: 6 + i * 3.4, n: num.querySelector('[data-n]') };
  });
  S.src = h(root, 'a', `Données 2025`, `left:0;top:980px;width:1920px;text-align:center;font-size:28px;font-weight:600;color:#9bb7d9;letter-spacing:.06em`);
  return S;
}, (u, S) => {
  S.certs.forEach((c, i) => { const a = .5 + i * .5, p = P(u, a, .8, E.back); put(c, { o: P(u, a, .3), y: -200 * (1 - p), r: (1 - p) * -8 }); });
  S.cnt.forEach((c, i) => {
    const p = P(u, c.a, 2.2, E.io);
    drawAll(c.ring, p, 0);
    c.n.textContent = Math.round(95 * p);
    put(c.num, { o: P(u, c.a - .3, .4), s: 1 });
    rise(c.lab, u, c.a + 1.6, .6, 24);
    c.ring.style.opacity = P(u, c.a - .3, .4);
  });
  rise(S.src, u, 10.5, .6, 0);
});

// ============ CHAPITRE 2 : rythme plus posé ============
const sgn = (parent, kind, icon, size, style = '') => {
  const isz = Math.round(size * (kind === 'int' ? .5 : .56));
  const el = h(parent, `sign ${kind}`, ic(icon, isz) + (kind === 'int' ? `<div class="bar" style="width:${size * .98}px;transform:translate(-50%,-50%) rotate(-45deg) scaleX(1)"></div>` : ''), `width:${size}px;height:${size}px;${style}`);
  if (kind === 'int') el.querySelector('.bar').style.display = 'block';
  return el;
};
const tcFmt = s => { const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r.toFixed(1).padStart(4, '0')}`; };

// ---------- Scène 6 : Votre arrivée ----------
def('s6', 2, 28, (root, sc) => {
  const S = {};
  S.A = h(root, 'a', '', 'left:0;top:0;width:1920px;height:1080px');
  S.busc = h(S.A, 'a', `<div style="width:420px;height:420px;border-radius:50%;background:rgba(23,163,221,.16);border:4px solid ${CYAN};display:flex;align-items:center;justify-content:center;color:#fff">${ic('bus', 250)}</div>`, 'left:200px;top:230px');
  S.road = svg(S.A, 760, 20, dp('M0 10H760', 'stroke-dasharray="1 2"'), `left:100px;top:710px`);
  S.road.querySelector('path').style.strokeWidth = '8';
  S.l1 = T(S.A, 'Arrêt Pont Loby', 'left:780px;top:230px;font-size:104px');
  S.l2 = T(S.A, '100 m', `left:780px;top:370px;font-size:230px;color:${ORANGE}`);
  S.walk = svg(S.A, 520, 40, dp('M4 20H500', 'stroke-dasharray="0.02 0.03" '), 'left:1220px;top:480px');
  S.walk.querySelector('path').style.strokeWidth = '10'; S.walk.querySelector('path').style.stroke = '#fff';
  S.chip = h(S.A, 'chip', `<span style="display:inline-block;vertical-align:middle;margin-right:18px">${ic('bus', 54)}</span><span style="vertical-align:middle">DK Bus <b style="color:#7fe3b0">gratuit</b></span>`, 'left:780px;top:690px;font-size:62px;padding:12px 38px');
  // fenêtre parking
  S.B = h(root, 'a', '', 'left:0;top:0;width:1920px;height:1080px');
  const wx = 200, wy = 90, ww = 1520, wh = 770;
  S.win = vwin(sc, S.B, 'V06_parking', wx, wy, ww, wh, 9.6, 21.2);
  S.ov = svg(S.B, ww, wh, `<defs><marker id="ah" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#fff"/></marker></defs>
    <path id="route0" d="M110 700C400 700 520 520 780 520S1120 330 1360 330" style="stroke:rgba(0,0,0,.45);stroke-width:26;stroke-linecap:round"/>
    <path id="route" d="M110 700C400 700 520 520 780 520S1120 330 1360 330" marker-end="url(#ah)" style="stroke:#fff;stroke-width:12;stroke-dasharray:44 30;stroke-linecap:butt"/>
    <path d="M1000 470H1290V690H1000Z" style="stroke:var(--cyan);stroke-width:8;stroke-dasharray:22 14"/>`, `left:${wx}px;top:${wy}px;pointer-events:none`, 'k');
  S.car = h(S.B, 'a', `<div style="background:rgba(10,35,71,.55);border-radius:30px;padding:8px;color:#fff;width:150px;height:200px">${ic('carTop', 134)}</div><div style="position:absolute;left:-14px;top:-14px;width:44px;height:44px;border-radius:50%;background:${ORANGE};color:#fff;font-size:28px;font-weight:800;display:flex;align-items:center;justify-content:center">R</div>`, `left:${wx + 1060}px;top:${wy + 60}px`);
  S.cap1 = h(S.B, 'chip', `<span style="vertical-align:middle;display:inline-block;margin-right:14px">${ic('arrow', 44)}</span><span style="vertical-align:middle">Sens de circulation</span>`, `left:${wx}px;top:900px;font-size:42px`);
  S.cap2 = h(S.B, 'chip o', `<span style="vertical-align:middle;display:inline-block;margin-right:14px">${ic('car', 52)}</span><span style="vertical-align:middle">Stationnement en marche arrière</span>`, `left:${wx + 560}px;top:900px;font-size:42px`);
  // horaires
  S.C = h(root, 'a', '', 'left:0;top:0;width:1920px;height:1080px');
  S.clocks = [{ cx: 560, a: [8, 12], t: '8h00 – 12h00' }, { cx: 1360, a: [13, 16], t: '13h00 – 16h00' }].map(c => {
    const r = 170, cy = 390;
    const ticks = Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `M${r + 20 + Math.sin(a) * (r - 8)} ${r + 20 - Math.cos(a) * (r - 8)}L${r + 20 + Math.sin(a) * (r - 28)} ${r + 20 - Math.cos(a) * (r - 28)}`; }).join('');
    const face = svg(S.C, 2 * r + 40, 2 * r + 40, `<circle cx="${r + 20}" cy="${r + 20}" r="${r}" style="stroke:#fff;stroke-width:8"/><path d="${ticks}" style="stroke:#fff;stroke-width:6"/><path id="arc" d="" style="stroke:${CYAN};stroke-width:16;stroke-linecap:butt"/><path class="hh" d="M${r + 20} ${r + 20}V${r + 20 - 90}" style="stroke:#fff;stroke-width:12"/><path class="mm" d="M${r + 20} ${r + 20}V${r + 20 - 135}" style="stroke:var(--cyan);stroke-width:8"/><circle cx="${r + 20}" cy="${r + 20}" r="10" style="fill:#fff;stroke:none"/>`, `left:${c.cx - r - 20}px;top:${cy - r - 20}px`, 'k');
    const txt = T(S.C, c.t, `left:${c.cx - 400}px;top:640px;width:800px;text-align:center;font-size:96px`);
    return { c, face, txt, r, arc: face.querySelector('#arc'), hh: face.querySelector('.hh'), mm: face.querySelector('.mm') };
  });
  return S;
}, (u, S) => {
  // A : bus
  const aVis = u < 9.4;
  S.A.style.display = aVis ? 'block' : 'none';
  S.A.style.clipPath = `inset(0 ${P(u, 8.7, .7, E.io) * 100}% 0 0)`;
  const pb = P(u, 2.6, .9, E.out);
  put(S.busc, { o: pb, s: .7 + .3 * pb });
  drawAll(S.busc, P(u, 2.9, 1.4, E.io));
  S.busc.style.color = '#fff';
  setDraw(S.road.querySelector('path'), P(u, 2.8, 1.4, E.io));
  rise(S.l1, u, 4.0, .9, 36);
  rise(S.l2, u, 4.7, .9, 36);
  setDraw(S.walk.querySelector('path'), P(u, 5.8, 1.6, E.io));
  rise(S.chip, u, 6.8, .8, 30);
  // B : fenêtre parking
  const vis = winAnim(S.win, u, true);
  S.B.style.display = (u > 9.2 && u < 21.4) ? 'block' : 'none';
  const pv = P(u, 11.0, 1, E.io);
  S.ov.style.opacity = pv * (1 - P(u, 20.4, .7));
  const route = S.ov.querySelector('#route');
  route.style.strokeDashoffset = -(u * 60);
  // voiture : arrive en marche arrière dans la place (de haut en bas, nez vers le haut)
  const cp = P(u, 13.0, 4.0, E.io);
  put(S.car, { o: P(u, 12.6, .6) * (1 - P(u, 20.4, .7)), x: 0, y: cp * 340, r: 0 });
  S.car.style.left = '1270px'; S.car.style.top = '230px';
  rise(S.cap1, u, 12.0, .7, 24); rise(S.cap2, u, 15.6, .7, 24);
  S.cap1.style.opacity *= 1 - P(u, 20.6, .5); S.cap2.style.opacity *= 1 - P(u, 20.6, .5);
  // C : horaires
  S.C.style.display = u > 21.4 ? 'block' : 'none';
  S.C.style.clipPath = `inset(0 0 0 ${(1 - P(u, 21.4, .9, E.io)) * 100}%)`;
  S.clocks.forEach((k, i) => {
    const a = 22.2 + i * 2.4, p = P(u, a, 2.2, E.io), r = k.r, c0 = r + 20;
    const h0 = k.c.a[0], h1 = k.c.a[1], hrs = lerp(h0, h1, p);
    k.hh.setAttribute('transform', `rotate(${(hrs % 12) * 30} ${c0} ${c0})`);
    k.mm.setAttribute('transform', `rotate(${(hrs % 1) * 360} ${c0} ${c0})`);
    const a0 = (h0 % 12) * 30, a1 = (hrs % 12 || (hrs >= 12 ? 12 : 0)) * 30; let sweep = a1 - a0; if (sweep < 0) sweep += 360;
    const pt = (ang, rr) => `${c0 + Math.sin(ang * Math.PI / 180) * rr} ${c0 - Math.cos(ang * Math.PI / 180) * rr}`;
    k.arc.setAttribute('d', sweep > 1 ? `M${pt(a0, r + 22)}A${r + 22} ${r + 22} 0 ${sweep > 180 ? 1 : 0} 1 ${pt(a0 + sweep, r + 22)}` : '');
    put(k.face, { o: P(u, a - .5, .6), s: .85 + .15 * P(u, a - .5, .8, E.back) });
    rise(k.txt, u, a + 1.6, .8, 30);
  });
});

// ---------- Scène 7 : Sécurité en atelier ----------
const EPI = [{ i: 'helmet', t: 'Casque' }, { i: 'glasses', t: 'Lunettes' }, { i: 'gloves', t: 'Gants' }, { i: 'boots', t: 'Chaussures' }];
def('s7', 2, 22, (root, sc) => {
  const S = {};
  S.A = h(root, 'a', '', 'left:0;top:0;width:1920px;height:1080px');
  const wx = 140, wy = 80, ww = 1640, wh = 790;
  S.win = vwin(sc, S.A, 'V07_epi', wx, wy, ww, wh, .4, 7.0);
  S.strip = h(S.A, 'a', '', `left:${wx + 40}px;top:${wy + wh - 230}px;width:${ww - 80}px;height:200px;background:rgba(10,35,71,.82);border:2px solid ${CYAN};border-radius:8px`);
  S.epi = EPI.map((e, i) => {
    const x = 60 + i * 380;
    const sg = sgn(S.strip, 'obl', e.i, 140, `left:${x}px;top:30px`);
    const lb = T(S.strip, e.t, `left:${x + 170}px;top:70px;font-size:42px;font-weight:700`);
    const ck = h(S.strip, 'a', ic('check', 56), `left:${x + 170}px;top:128px;width:56px;height:56px;border-radius:50%;background:var(--eva);color:#fff;display:flex;align-items:center;justify-content:center;padding:8px`);
    ck.style.top = '12px'; ck.style.left = (x + 100) + 'px';
    return { sg, lb, ck };
  });
  S.ok = h(S.A, 'a', `<span style="display:inline-block;vertical-align:middle;margin-right:16px;color:#7fe3b0">${ic('check', 52)}</span><span style="vertical-align:middle">EPI contrôlés</span>`, `left:${wx + 40}px;top:${wy + 36}px;background:rgba(10,35,71,.85);border:3px solid var(--eva);border-radius:100px;padding:12px 34px;font-size:50px;font-weight:800`);
  // B : machine + cadenas
  S.B = h(root, 'a', '', 'left:0;top:0;width:1920px;height:1080px');
  S.machine = svg(S.B, 640, 520, dp('M20 500V230H500V500Z') + dp('M60 230V120H300V230') + dp(gearPath(180, 340, 70, 55, 10).replace(/(\d+\.?\d*) (\d+\.?\d*)/g, (m, a, b) => m)) + dp('M360 290H460M360 340H460M360 390H430') + dp('M300 120L360 60H470'), 'left:330px;top:150px');
  S.machine.querySelectorAll('path').forEach(p => p.style.strokeWidth = '5');
  S.lockG = h(S.B, 'a', '', 'left:520px;top:330px;width:200px;height:240px');
  S.shackle = svg(S.lockG, 200, 240, `<path d="M52 110V76A48 48 0 0 1 148 76V110" style="stroke:#fff;stroke-width:12"/>`, 'left:0;top:0', 'k');
  S.lockBody = h(S.lockG, 'a', `<svg viewBox="0 0 100 100" class="ic" width="200" height="200" style="stroke-width:6">${ICONS.lockBody.map(d => `<path d="${d}"/>`).join('')}</svg>`, 'left:0;top:100px;color:#fff');
  S.light = h(S.B, 'a', '', `left:790px;top:215px;width:46px;height:46px;border-radius:50%;background:var(--red);box-shadow:0 0 30px var(--red)`);
  S.trainer = h(S.B, 'a', `<div style="display:flex;flex-direction:column;align-items:center;color:#fff"><div style="width:190px;height:190px;border-radius:50%;background:${CYAN};color:var(--navy);display:flex;align-items:center;justify-content:center">${ic('person', 120)}</div><div style="margin-top:12px;font-size:36px;font-weight:700">Formateur</div></div>`, 'left:0;top:520px');
  S.tx = h(S.B, 'a', `<span>Formation</span> <span style="color:${CYAN};margin:0 .25em">+</span> <span>autorisation du formateur</span>`, 'left:0;top:790px;width:1920px;text-align:center;font-size:72px;font-weight:800');
  // C : alerte
  S.C = h(root, 'a', '', 'left:0;top:0;width:1920px;height:1080px');
  S.al = h(S.C, 'a', `<div style="color:${ORANGE}">${ic('alert', 360)}</div>`, 'left:300px;top:260px');
  S.al1 = T(S.C, 'Accident ?', 'left:800px;top:290px;font-size:150px');
  S.al2 = T(S.C, 'Prévenez un responsable', `left:800px;top:480px;font-size:86px;color:${ORANGE}`);
  // D : trio
  S.D = h(root, 'a', '', 'left:0;top:0;width:1920px;height:1080px');
  S.trio = [['order', 'Ordre'], ['clean', 'Propreté'], ['shelf', 'Rangement']].map(([i, t], k) => {
    const cx = 360 + k * 600;
    const c = h(S.D, 'a', `<div style="width:330px;height:330px;border-radius:50%;background:rgba(23,163,221,.16);border:4px solid ${CYAN};display:flex;align-items:center;justify-content:center">${ic(i, 200)}</div>`, `left:${cx - 165}px;top:250px`);
    const tx = T(S.D, t, `left:${cx - 250}px;top:640px;width:500px;text-align:center;font-size:84px`);
    return { c, tx };
  });
  return S;
}, (u, S) => {
  S.A.style.display = u < 7.4 ? 'block' : 'none';
  winAnim(S.win, u, true);
  S.strip.style.opacity = P(u, 1.2, .8); S.strip.style.transform = `translateY(${(1 - P(u, 1.2, .8)) * 60}px)`;
  S.epi.forEach((e, i) => {
    const a = 2.2 + i * 1.0;
    put(e.sg, { s: .7 + .3 * P(u, a - .5, .6, E.back), o: P(u, 1.6, .6) });
    drawAll(e.sg, P(u, a - .5, .7));
    rise(e.lb, u, a - .3, .5, 12);
    const q = P(u, a + .4, .45, E.back); put(e.ck, { s: q, o: q > 0 ? 1 : 0 });
  });
  rise(S.ok, u, 6.0 - 0, .0, 0); // visible dès la dernière coche
  { const q = P(u, 5.5, .6, E.back); put(S.ok, { s: .7 + .3 * q, o: q > 0 ? 1 : 0 }); S.ok.style.transformOrigin = '0 0'; }
  S.A.style.clipPath = `inset(0 ${P(u, 6.9, .5, E.io) * 100}% 0 0)`;
  // B
  S.B.style.display = (u > 7.2 && u < 13.6) ? 'block' : 'none';
  S.B.style.clipPath = `inset(0 0 0 ${(1 - P(u, 7.2, .8, E.io)) * 100}%) `;
  drawAll(S.machine, P(u, 7.6, 1.6, E.io), .12);
  const tp = P(u, 9.0, 1.6, E.io);
  put(S.trainer, { o: P(u, 8.8, .4), x: lerp(100, 720, tp) });
  S.trainer.style.left = '0';
  const op = P(u, 10.8, .7, E.back);
  S.shackle.style.transformOrigin = '148px 110px';
  S.shackle.style.transform = `translate(${-0}px,${-46 * op}px) rotate(${-38 * op}deg)`;
  S.lockG.style.opacity = P(u, 8.0, .5);
  S.light.style.background = op > .5 ? 'var(--eva)' : 'var(--red)';
  S.light.style.boxShadow = `0 0 30px ${op > .5 ? 'var(--eva)' : 'var(--red)'}`;
  rise(S.tx, u, 11.4, .8, 30);
  // C
  S.C.style.display = (u > 13.4 && u < 18.2) ? 'block' : 'none';
  S.C.style.clipPath = `inset(0 0 0 ${(1 - P(u, 13.4, .8, E.io)) * 100}%)`;
  drawAll(S.al, P(u, 13.8, 1.0, E.io));
  S.al.style.transform = `scale(${1 + .05 * Math.sin((u - 14.8) * 7) * (u > 14.8 ? 1 : 0)})`;
  rise(S.al1, u, 14.6, .7, 30); rise(S.al2, u, 15.4, .7, 30);
  // D
  S.D.style.display = u > 18.0 ? 'block' : 'none';
  S.D.style.clipPath = `inset(0 0 0 ${(1 - P(u, 18.0, .8, E.io)) * 100}%)`;
  S.trio.forEach((t, k) => { const a = 18.6 + k * .9; put(t.c, { s: .6 + .4 * P(u, a, .7, E.back), o: P(u, a, .3) }); drawAll(t.c, P(u, a, 1.0)); rise(t.tx, u, a + .5, .6, 24); });
});

// ---------- Scène 8 : Règles de vie ----------
def('s8', 2, 16, (root) => {
  const S = {};
  S.ph = frame(root, 'S08_hall', 120, 100, 780, 850, { dir: 'l' });
  S.plaque = h(root, 'a', `<span style="display:inline-block;vertical-align:middle;margin-right:18px;color:${CYAN}">${ic('doc', 56)}</span><span style="vertical-align:middle">Règlement intérieur</span>`, `left:170px;top:800px;background:rgba(10,35,71,.9);border:3px solid ${CYAN};border-left:14px solid ${CYAN};padding:22px 34px;font-size:50px;font-weight:800`);
  const rows = [
    { i: 'exit', t: 'Pas de sortie<br>pendant les pauses' },
    { i: 'fork', t: 'Pas de nourriture en salle<br>et en atelier' },
    { i: 'smoke', t: 'Pas de cigarette' },
  ];
  S.rows = rows.map((r, k) => {
    const y = 100 + k * 300;
    const sg = sgn(root, 'int', r.i, 220, `left:1000px;top:${y}px`);
    const tx = T(root, r.t, `left:1260px;top:${y + 48}px;font-size:54px;line-height:1.12;white-space:normal;width:600px`);
    return { sg, tx, bar: sg.querySelector('.bar'), y };
  });
  S.zf = h(root, 'a', `<span style="display:inline-block;vertical-align:middle;margin-right:14px">${ic('arrow', 54)}</span><span style="vertical-align:middle">Zones fumeurs</span>`, `left:1260px;top:${100 + 600 + 140}px;font-size:46px;font-weight:800;color:#fff;background:rgba(23,163,221,.2);border:3px solid ${CYAN};border-radius:100px;padding:6px 30px`);
  S.zf.style.top = '885px'; S.zf.style.left = '1260px';
  return S;
}, (u, S) => {
  frameAnim(S.ph, P(u, .5, 1.2, E.io), P(u, 0, 16));
  rise(S.plaque, u, 2.0, .9, 0, -60);
  S.rows.forEach((r, k) => {
    const a = 4.6 + k * 3.0;
    put(r.sg, { s: .6 + .4 * P(u, a, .9, E.back), o: P(u, a, .4) });
    drawAll(r.sg, P(u, a, 1.0));
    r.bar.style.transform = `translate(-50%,-50%) rotate(-45deg) scaleX(${P(u, a + .8, .6, E.io)})`;
    rise(r.tx, u, a + .5, .8, 0, 50);
  });
  rise(S.zf, u, 12.4, .8, 0, 50);
});

// ---------- Scène 9 : Incendie et évacuation ----------
def('s9', 2, 19, (root, sc) => {
  const S = {};
  S.flash = h(root, 'a', '', `left:0;top:0;width:1920px;height:1080px;background:radial-gradient(ellipse at center,transparent 50%,rgba(226,7,27,.55))`);
  S.A = h(root, 'a', '', 'left:0;top:0;width:1920px;height:1080px');
  S.plate = h(S.A, 'a', `<div style="width:380px;height:380px;background:var(--red);border-radius:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 20px 50px rgba(0,0,0,.4)"><div data-btn style="width:230px;height:230px;border-radius:50%;background:#fff;border:14px solid #8a0410;display:flex;align-items:center;justify-content:center;color:var(--red);font-size:48px;font-weight:800">ALARME</div></div>`, 'left:240px;top:160px');
  S.btn = S.plate.querySelector('[data-btn]');
  S.rip = [0, 1, 2].map(() => h(S.A, 'a', '', `left:${240 + 190 - 115}px;top:${160 + 190 - 115}px;width:230px;height:230px;border-radius:50%;border:6px solid var(--red)`));
  S.obj = [['door', 'Portes'], ['window', 'Fenêtres']].map(([i, t], k) => {
    const x = 940 + k * 380;
    const el = h(S.A, 'a', `<div style="color:#fff">${ic(i, 240)}</div>`, `left:${x}px;top:200px`);
    const x1 = svg(S.A, 240, 240, dp('M20 20L220 220M220 20L20 220', 'style="stroke:var(--red);stroke-width:18"'), `left:${x}px;top:200px`);
    x1.querySelector('path').style.strokeWidth = '20'; x1.querySelector('path').style.stroke = 'var(--red)';
    return { el, x1 };
  });
  S.risk = T(S.A, 'Ne prenez aucun risque', `left:0;top:690px;width:1920px;text-align:center;font-size:110px;color:${ORANGE}`);
  // B fenêtre exercice
  S.B = h(root, 'a', '', 'left:0;top:0;width:1920px;height:1080px');
  S.win = vwin(sc, S.B, 'V09_evacuation', 200, 100, 1520, 770, 5.9, 11.8);
  S.evb = sgn(S.B, 'eva', 'exit', 130, 'left:230px;top:130px');
  // C plan d'évacuation
  S.C = h(root, 'a', '', 'left:0;top:0;width:1920px;height:1080px');
  const route = 'M290 300V440H870C960 440 1010 520 1040 620';
  S.plan = svg(S.C, 1200, 900, `
    ${dp('M140 180H860V680H140Z')}
    ${dp('M140 440H860', 'stroke-opacity=".0"')}
    ${dp('M140 380H860M140 500H860')}
    ${dp('M400 180V380M640 180V380M400 500V680M640 500V680')}
    <path class="gp" pathLength="1" d="${route}" style="stroke:#fff;stroke-width:0"/>`, 'left:0;top:0');
  S.plan.querySelectorAll('path').forEach(p => p.style.strokeWidth = '4');
  S.gp = svg(S.C, 1200, 900, `<path id="gpath" pathLength="1" d="${route}" style="stroke:#34d27b;stroke-width:16;stroke-linecap:round"/>`, 'left:0;top:0', 'k');
  S.walker = h(S.C, 'a', '', 'left:0;top:0;width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;background:#fff;border:8px solid #34d27b');
  S.exitSgn = sgn(S.C, 'eva', 'exit', 96, 'left:812px;top:394px');
  S.exitLab = T(S.C, 'Issue la plus proche', 'left:610px;top:306px;font-size:36px;color:#7fe3b0;font-weight:700');
  S.far = svg(S.C, 70, 70, dp('M10 10L60 60M60 10L10 60'), 'left:105px;top:405px');
  S.far.querySelector('path').style.stroke = 'rgba(255,255,255,.35)'; S.far.querySelector('path').style.strokeWidth = '8';
  S.rass = h(S.C, 'a', `<div style="width:150px;height:150px;border-radius:22%;background:var(--eva);color:#fff;display:flex;align-items:center;justify-content:center">${ic('gather', 100)}</div>`, 'left:965px;top:640px');
  S.rassLab = T(S.C, 'Point de rassemblement', 'left:700px;top:810px;width:700px;text-align:center;font-size:44px;font-weight:800');
  S.cons = h(S.C, 'a', `<div style="color:${CYAN};margin-bottom:24px">${ic('group', 140)}</div>Suivez les consignes de l’équipe pédagogique`, 'left:1260px;top:260px;width:560px;font-size:68px;font-weight:800;line-height:1.1');
  S.cons.style.whiteSpace = 'normal';
  return S;
}, (u, S) => {
  // A
  S.A.style.display = u < 6.2 ? 'block' : 'none';
  S.A.style.clipPath = `inset(0 ${P(u, 5.6, .6, E.io) * 100}% 0 0)`;
  put(S.plate, { o: P(u, .5, .6), y: (1 - P(u, .5, .8)) * 60 });
  const press = P(u, 1.8, .25, E.in) - P(u, 2.1, .4, E.out);
  S.btn.style.transform = `scale(${1 - .14 * press})`;
  S.btn.style.background = u > 1.9 ? '#ffd8dc' : '#fff';
  S.rip.forEach((r, i) => { const q = clamp((u - 2.0 - i * .45) / 1.6); put(r, { o: u > 2 ? (1 - q) * .8 : 0, s: 1 + q * 2.4 }); });
  S.flash.style.opacity = (u > 2.0 && u < 6.2) ? .35 + .35 * Math.sin((u - 2) * 9) : 0;
  S.obj.forEach((o, k) => { const a = 3.0 + k * .5; put(o.el, { o: P(u, a, .5), y: (1 - P(u, a, .6)) * 40 }); setDraw(o.x1.querySelector('path'), P(u, a + .9, .5, E.io)); });
  rise(S.risk, u, 3.8, .7, 30);
  // B
  S.B.style.display = (u > 5.8 && u < 12.0) ? 'block' : 'none';
  winAnim(S.win, u, true);
  put(S.evb, { o: P(u, 6.6, .5) * (u < 11.2 ? 1 : 0), s: .7 + .3 * P(u, 6.6, .6, E.back) });
  // C
  S.C.style.display = u > 11.8 ? 'block' : 'none';
  S.C.style.clipPath = `inset(0 0 0 ${(1 - P(u, 11.8, .8, E.io)) * 100}%)`;
  drawAll(S.plan, P(u, 12.0, 1.8, E.io), .2);
  const gp = S.gp.querySelector('#gpath'); const pp = P(u, 14.2, 3.4, E.io);
  setDraw(gp, pp);
  S.gp.style.opacity = u > 14.2 ? 1 : 0;
  const L = gp.getTotalLength(); const pt = gp.getPointAtLength(L * pp);
  S.walker.style.visibility = u > 14.2 ? 'visible' : 'hidden'; S.walker.style.transform = `translate(${pt.x}px,${pt.y}px)`;
  put(S.exitSgn, { o: P(u, 13.4, .5), s: .6 + .4 * P(u, 13.4, .7, E.back) });
  rise(S.exitLab, u, 13.6, .6, 12);
  put(S.far, { o: P(u, 13.4, .5) });
  put(S.rass, { o: P(u, 16.2, .5), s: .6 + .4 * P(u, 16.2, .7, E.back) });
  rise(S.rassLab, u, 16.6, .6, 12);
  rise(S.cons, u, 14.0, .9, 0, 60);
});

// ---------- Scène 10 : Conclusion ----------
def('s10', 2, 18, (root) => {
  const S = { tiles: [] };
  const cw = 480, chh = 270;
  const cells = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!((r === 1 || r === 2) && (c === 1 || c === 2))) cells.push([c, r]);
  const files = ASSETS.photos.filter(f => /^S10_/i.test(f));
  cells.forEach(([c, r], i) => {
    const key = files.length ? stem(files[i % files.length]) : `S10_${String(i + 1).padStart(2, '0')}`;
    const f = frame(root, key, c * cw + 6, r * chh + 6, cw - 12, chh - 12, { dir: 'l' });
    f.cx = c * cw + cw / 2; f.cy = r * chh + chh / 2; f.i = i;
    S.tiles.push(f);
  });
  S.core = h(root, 'a', '', `left:${cw}px;top:${chh}px;width:${2 * cw}px;height:${2 * chh}px;background:#fff;border-radius:6px;box-shadow:0 20px 70px rgba(0,0,0,.5)`);
  S.logo = h(S.core, '', '', `position:absolute;left:${(2 * cw - 760) / 2}px;top:40px;width:760px;height:333px;background:url(assets/logos/logo-afpi.png) center/contain no-repeat`);
  S.msg = T(S.core, 'Excellente formation<br>à toutes et à tous !', `left:0;top:395px;width:${2 * cw}px;text-align:center;font-size:54px;color:var(--blue);white-space:normal;line-height:1.1`);
  return S;
}, (u, S) => {
  S.tiles.forEach((f, i) => {
    const a = .3 + (i * 0.37 % 3.4), p = P(u, a, 1.0, E.io);
    // arrivent depuis l'extérieur, en rotation, et se rassemblent
    const dx = (f.cx < 960 ? -1 : 1) * 700 * (1 - p), dy = (f.cy < 540 ? -1 : 1) * 400 * (1 - p);
    frameAnim(f, p, P(u, a, 14));
    f.el.style.transform = `translate(${dx}px,${dy}px) rotate(${(rnd(i) - .5) * 40 * (1 - p)}deg)`;
  });
  const cp = P(u, 4.6, 1.0, E.back);
  put(S.core, { o: P(u, 4.6, .4), s: .7 + .3 * cp });
  rise(S.msg, u, 6.4, .9, 30);
  S.logo.style.opacity = P(u, 5.0, .6);
});

// ---------- Écran de fin ----------
def('fin', 0, 5, (root) => {
  const S = {};
  S.g = svg(root, W, H, dp(gearPath(1560, 330, 420, 360, 18), 'style="stroke:rgba(23,163,221,.25)"') + dp(circ(1560, 330, 230), 'style="stroke:rgba(23,163,221,.25)"') + dp(gearPath(260, 860, 280, 240, 14), 'style="stroke:rgba(23,163,221,.2)"'), 'left:0;top:0');
  S.g.querySelectorAll('path').forEach(p => { p.style.strokeWidth = '3'; });
  S.box = h(root, 'a', '', `left:${960 - 440}px;top:90px;width:880px;height:386px;background:#fff;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.4)`);
  h(S.box, '', '', 'position:absolute;inset:36px 40px;background:url(assets/logos/logo-afpi.png) center/contain no-repeat');
  S.tag = T(root, 'Former les talents de l’industrie de demain', 'left:0;top:520px;width:1920px;text-align:center;font-size:68px');
  S.url = T(root, 'www.afpi-formation.com', `left:0;top:638px;width:1920px;text-align:center;font-size:62px;color:${CYAN}`);
  S.tel = T(root, '03 28 60 80 30', 'left:0;top:730px;width:1920px;text-align:center;font-size:62px');
  S.adr = h(root, 'a', `<div><b>Centre Jacques Balloy</b> – Z.A.E. du Pont Loby, Rue de Rome, 59640 Dunkerque</div><div style="margin-top:10px"><b>Antenne des Rives de l’Aa</b> – Zone de la Leurette, Route du développement, 59820 Gravelines</div>`, 'left:0;top:880px;width:1920px;text-align:center;font-size:30px;color:#cfe3f7;font-weight:500');
  return S;
}, (u, S) => {
  // écran fixe : simple fondu d'entrée de 0,4 s puis image stable
  const o = P(u, 0, .4, E.lin);
  [S.g, S.box, S.tag, S.url, S.tel, S.adr].forEach(e => e.style.opacity = o);
  drawAll(S.g, 1, 0);
});
