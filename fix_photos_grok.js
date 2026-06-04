// HTW Fix — Fotos nach col zuordnen + grok basierend auf echtem Schuhaussehen
const fs = require('fs');
const path = require('path');

const ARCHIVE = 'D:\\ARCHIV\\HEEL_THE_WORLD';
const IMG = 'C:\\Users\\david\\HTW\\img';
const POSTS = 'C:\\Users\\david\\HTW\\posts.js';

// ─── ECHTE SCHUH-BESCHREIBUNGEN (basierend auf tatsächlichen Fotos) ──────────
const shoeDesc = {
  'peacock':
    'a warm red-and-gold exotic fish-scale leather sandal — the scaled surface glows in amber and crimson tones; multiple crossing leather straps form the upper; white piping trim along all strap edges; natural platform base; large square block heel',
  'bordeaux':
    'a deep wine-red exotic fish-scale leather sandal — rich bordeaux crinkled scaled leather surface; structural upper with a large circular cutout in the center; thin straps framing the cutout; black natural rubber platform; dark squared wood block heel; metal buckle at ankle',
  'green white':
    'a pale green-to-ivory salmon-skin leather heel — individual preserved fish scales visible across the entire surface, each scale slightly different in size and angle; the color shifts from celadon green to cream depending on the light; classic heel silhouette',
  'zebra':
    'a caramel-tan suede leather sandal with zebra-stripe animal hair inlays — smooth tan suede upper with multiple crossing straps; genuine zebra-hair trim along the platform edge and lower strap; natural blond wood squared block heel; geometric circular cutout in the center strap; open toe',
  'yellow':
    'a bright warm-yellow exotic fish-scale leather peep-toe pump — vibrant yellow crinkle-scaled leather body; geometric rectangular cutouts framed by white leather piping trim; curved white block heel; the yellow hide has a subtle tactile fish-scale surface across the entire upper',
  'black gold':
    'a two-tone exotic leather heel — upper portion in granular black ray-skin leather, lower portion in smooth warm-gold ostrich leather; both textures clearly distinct and visible; a precise hand-stitched seam joins the two materials along the heel axis',
  'xhigh':
    'a dark forest-green iridescent fish-scale leather slingback sandal — the scaled surface shifts between deep green and metallic sheen; single wide front strap; elastic ankle strap at back; massive squared natural blond wood block heel approximately 14 centimeters tall; white leather interior lining; green piping along all edges'
};

// ─── KAMERA nach Typ (rotierend, 6 Varianten) ────────────────────────────────
const camDetail = [
  'Locked-off extreme macro. {shoe} fills 90% of the frame. A single LED moves very slowly left to right over 8 sec — leather surface and scale texture revealed progressively. Camera still. No body.',
  'Overhead macro, cold LED direct from above. {shoe}. Hard shadows define every surface scale. Camera still. 8 seconds precision. No body.',
  'Ground-level locked macro. {shoe} — camera at base of heel, texture razor-sharp in foreground, column receding to soft blur. 8 sec still. No body.',
  'Slow 30-degree orbital macro. Camera arcs around {shoe} at extreme close distance over 8 sec. Leather texture in continuous sharp focus. No body.',
  'Dual-light macro. {shoe} — warm amber LED from left, cold white LED from right simultaneously. Competing light reveals 3D depth of leather surface. Still. No body.',
  'Focus-pull locked macro. {shoe} — begins with heel tip in focus, shifts slowly to heel base over 8 sec. Scale texture catches both focal planes differently. No body.'
];

const camEditorial = [
  'Low-angle floor shot. {shoe} worn on a woman\'s right foot on {amb}. Camera at floor level, lower leg knee-down in dark tailored trouser. Camera rises 8cm over 4 sec then holds still. No face, no torso.',
  'Dutch tilt floor shot, 12-degree tilt. {shoe} worn on right foot on {amb}. Architectural diagonal tension. Slow push-in 15cm over 8 sec. No face.',
  'Split-focus lateral track. {shoe} on right foot on {amb}. Heel razor-sharp foreground, room blurred behind. Camera tracks 12cm right over 8 sec. No face.',
  'Reverse floor tracking. Camera behind the heel at floor level. Woman wearing {shoe} takes 3 slow steps away on {amb}. Heel always in foreground focus. No face.',
  'Low-angle reveal. Frames only floor and heel base — rises slowly over 6 sec to reveal {shoe} in full. Final 2 sec still. No face.',
  'Slow push low-angle shin height. Continuous push-in over 8 sec toward {shoe} worn on {amb}. Leather surface grows to fill frame. No face, no torso.'
];

const camStory = [
  'Medium close-up slightly above. {shoe} on {amb}. Heel only sharp object in frame, everything behind in warm cinematic blur. 8 sec stillness. No body.',
  'Close-up warm. {shoe} on {amb}. At 4 sec, woman\'s hands enter from left — hold the shoe briefly, examine leather, withdraw. Heel remains. No face.',
  'Cinematic depth close-up. {shoe} foreground on {amb}. Background element out of focus — slow rack-focus from background to heel over 3 sec, holds 5 sec. No body.',
  'Still medium shot, light shift. {shoe} on {amb}. Camera still. Ambient light warms slowly over 8 sec. No body. Cinematic grade.',
  'Fade-in reveal. Near-black start. Single light brightens from left — {shoe} emerges from shadow over 4 sec. Holds 4 sec. No body.',
  'Over-shoulder medium. Blurred shoulder silhouette in extreme foreground. {shoe} on {amb} in middle ground, in focus. 8 sec still. No face.'
];

// ─── AMBIENTE nach Stadt ──────────────────────────────────────────────────────
const amb = {
  'New York': ['dark polished Nero Marquina marble — Upper East Side private hallway','aged herringbone parquet — Manhattan penthouse interior','dark SoHo loft concrete — industrial pendant overhead','pale travertine — midtown atrium, morning glass-ceiling light','dark velvet cloth on mahogany gallery table — amber gallery spot'],
  'Paris': ['aged pale Saint-Germain limestone — interior courtyard, diffused spring light','polished Versailles herringbone parquet — Haussmann apartment, tall French windows','pale veined Calacatta marble — Parisian hotel mantelpiece, evening','worn French oak workshop table — craftsman surface, decades of use','pale stone Parisian windowsill — blurred rooftops in golden evening'],
  'Milan': ['polished Carrara marble — Milanese palazzo entrance','black-and-white geometric terrazzo — Quadrilatero della Moda interior','pale Brera gallery concrete — white walls, clean museum overhead light','dark travertine stone — private Via della Spiga interior, midday','warm Italian walnut surface — private Milan apartment, evening lamp'],
  'Berlin / Zürich': ['raw dark Berliner concrete — Mitte gallery loft, industrial ceiling','polished light Swiss oak parquet — Zürich private apartment, northern light','pale Bauhaus-era stone — Berlin cultural institution floor','aged German workshop oak — worn smooth, manufactory table with decades of craft'],
  'Madrid / Barcelona': ['warm terracotta tiles — Salamanca interior courtyard, afternoon shade','pale Modernista marble — Passeig de Gràcia building entrance','dark aged olive wood — Barcelona private table, evening warm lamp','pale Castilian limestone — Madrid interior, hard afternoon light through shuttered window']
};

const prohibit = 'CRITICAL: Reproduce this exact shoe from the reference photo — match the silhouette, strap count, heel shape, platform, and color precisely. Do NOT invent a different shoe. No kitchen, bedroom, restaurant table or generic domestic space. No monsters, creatures or CGI distortion. No text overlay except HEEL THE WORLD — exact spelling only.';

// ─── FOTOS PRO COL SAMMELN ───────────────────────────────────────────────────
const colFolders = {
  'peacock':     ['peacock','green white'],
  'bordeaux':    ['bordeaux','htw-identity'],
  'green white': ['green white','bordeaux'],
  'zebra':       ['zebra'],
  'yellow':      ['yellow','htw-identity'],
  'xhigh':       ['xhigh','peacock'],
  'black gold':  ['black gold','htw-identity']
};

function getJPGs(folder) {
  const dir = path.join(ARCHIVE, folder);
  try {
    return fs.readdirSync(dir)
      .filter(f => /\.(jpg|jpeg|JPG|JPEG)$/.test(f) && !f.includes('blank') && !f.includes('12x12'))
      .map(f => path.join(dir, f));
  } catch(e) { return []; }
}

const colPhotos = {};
for (const [col, folders] of Object.entries(colFolders)) {
  const all = [];
  for (const folder of folders) all.push(...getJPGs(folder));
  colPhotos[col] = all;
}
Object.entries(colPhotos).forEach(([c,p])=>console.log(c+':', p.length, 'Fotos'));

// ─── POSTS.JS PARSEN ─────────────────────────────────────────────────────────
let src = fs.readFileSync(POSTS, 'utf8');

const colVals  = [...src.matchAll(/col:"([^"]*)"/g)].map(m=>m[1]);
const cityVals = [...src.matchAll(/city:"([^"]*)"/g)].map(m=>m[1]);
const typeVals = [...src.matchAll(/type:"([^"]*)"/g)].map(m=>m[1]);

// Photo positions
const photoRx = /photo:"([^"]*)"/g;
const photoPos = [];
let m;
while((m=photoRx.exec(src))!==null) photoPos.push({start:m.index,end:m.index+m[0].length});

// Grok positions
const grokRx = /grok:"((?:[^"\\]|\\.)*)"/g;
const grokPos = [];
while((m=grokRx.exec(src))!==null) grokPos.push({start:m.index,end:m.index+m[0].length});

console.log(`\nPosts: ${photoPos.length} photos, ${grokPos.length} groks`);

// Index pro col — damit wir rotieren
const colIdx = {};

// Fotos + Groks bauen
const newPhotos = [];
const newGroks  = [];

for (let i = 0; i < 90; i++) {
  const col  = colVals[i]  || 'bordeaux';
  const city = cityVals[i] || 'New York';
  const type = typeVals[i] || 'Detail';

  // ── Foto ──
  if (!colIdx[col]) colIdx[col] = 0;
  const pool = colPhotos[col] || [];
  const srcFile = pool[colIdx[col] % pool.length];
  colIdx[col]++;

  const ext  = path.extname(srcFile).toLowerCase().replace('.jpeg','.jpg');
  const dest = `col_${col.replace(/\s+/g,'_')}_${String(colIdx[col]).padStart(3,'0')}${ext}`;
  const destPath = path.join(IMG, dest);
  try {
    if (!fs.existsSync(destPath)) fs.copyFileSync(srcFile, destPath);
  } catch(e) { console.warn('copy error:', e.message); }
  newPhotos.push(`img/${dest}`);

  // ── Grok ──
  const shoe = shoeDesc[col] || shoeDesc['bordeaux'];
  const ambList = amb[city] || amb['New York'];
  const ambChoice = ambList[i % ambList.length];

  let cam;
  if (type === 'Detail')        cam = camDetail[i % camDetail.length];
  else if (type === 'Editorial') cam = camEditorial[i % camEditorial.length];
  else                           cam = camStory[i % camStory.length];

  cam = cam.replace(/\{shoe\}/g, shoe).replace(/\{amb\}/g, ambChoice);

  const prompt = (`8-sec Reel, 9:16 vertical. ${cam} ${prohibit}`)
    .replace(/"/g,'\\"').replace(/\n/g,'\\n');
  newGroks.push(prompt);
}

// ─── ERSETZEN (von hinten damit Offsets stimmen) ─────────────────────────────
// Kombiniere photo + grok Positionen, sortiere von hinten
const replacements = [];
photoPos.forEach((p,i) => replacements.push({...p, newVal:`photo:"${newPhotos[i]}"`, type:'photo'}));
grokPos.forEach((p,i)  => replacements.push({...p, newVal:`grok:"${newGroks[i]}"`,   type:'grok'}));
replacements.sort((a,b) => b.start - a.start);

let result = src;
for (const r of replacements) {
  result = result.slice(0,r.start) + r.newVal + result.slice(r.end);
}

fs.writeFileSync(POSTS, result, 'utf8');
console.log('\nFertig — 90 Fotos zugeordnet + 90 Grok-Prompts detailtreu geschrieben.');
