// HTW Grok Rewrite — alle 90 Prompts neu, detailtrue + Luxus-Ambiente + innovative Kamera
const fs = require('fs');

const POSTS_FILE = 'C:\\Users\\david\\HTW\\posts.js';

// ─── LEDER-BESCHREIBUNGEN (exakt für Grok) ────────────────────────────────────
const leather = {
  'peacock':     'iridescent exotic leather heel — structural color shifts from deep green to electric blue to warm gold depending on light angle; individual fish-scale texture visible at surface level; no dye, no coating — the color is in the microscopic architecture of the hide itself',
  'bordeaux':    'deep wine-bordeaux exotic leather heel — rich, slightly matte surface with subtle organic hide grain; the color is natural, from chrome-free vegetable tanning, not paint; smooth yet textural under close light',
  'green white': 'pale green-white Atlantic salmon leather heel — every individual scale is preserved intact and visible, each one slightly different in dimension, angle and how it catches light; the surface is biological, not manufactured',
  'zebra':       'genuine zebra-skin leather heel — natural black-and-white stripe pattern; stripe widths vary organically from one end of the heel to the other, no two stripes identical in width or edge; this is the actual animal hide, not a print',
  'yellow':      'warm amber-yellow puffer-fish leather heel — irregular bubble-like surface geometry across the entire hide; organic and deeply tactile; no two adjacent patches identical in shape or depth; a surface that cannot be manufactured',
  'black gold':  'two-tone heel combining granular black ray-skin leather on the upper portion with smooth golden ostrich leather below — a precise hand-stitched seam joins both materials; the ray-skin has a mineral, granular quality; the ostrich shows circular quill follicle marks',
  'xhigh':       '14-centimeter extreme high heel — a hand-turned solid-wood column entirely wrapped in continuous exotic leather with no visible seam at base or tip; the column tapers with mathematical precision; the leather continues uninterrupted from the platform edge to the heel tip'
};

// ─── AMBIENTE (Luxus, nie Küche/Schlafzimmer/generischer Raum) ────────────────
const ambiancePool = {
  'New York': [
    'dark polished Nero Marquina marble — an Upper East Side private hallway, pre-war architecture',
    'aged herringbone parquet — a Manhattan penthouse interior, floor-to-ceiling glass behind',
    'dark SoHo loft concrete — raw and architectural, a single industrial pendant above',
    'pale travertine stone — a midtown atrium floor, late morning light from a glass ceiling',
    'brushed steel and dark oak surface — a Fifth Avenue private office interior',
    'deep charcoal velvet cloth on a mahogany gallery table — amber gallery spot from above'
  ],
  'Paris': [
    'aged pale Saint-Germain limestone — an interior courtyard, afternoon spring light diffused from above',
    'polished Versailles herringbone parquet — a Haussmann apartment, tall French windows off-screen',
    'pale veined Calacatta marble — a Parisian hotel mantelpiece, evening firelight',
    'rough-cut Palais Royal stone — a private garden passage, the arcades barely visible behind',
    'worn French oak workshop table — aged grain, a craftsman\'s surface with decades of use',
    'pale stone Parisian windowsill — blurred rooftops and chimney pots behind in golden evening blur'
  ],
  'Milan': [
    'polished Carrara marble floor — a Milanese palazzo entrance, architectural and serious',
    'black-and-white geometric terrazzo — a Quadrilatero della Moda building interior',
    'pale Brera gallery concrete — white walls, clean cool museum light from overhead',
    'dark travertine stone surface — a private Via della Spiga interior, midday light',
    'warm Italian walnut surface — a private Milan apartment, evening warm lamp from the left'
  ],
  'Berlin / Zürich': [
    'raw dark Berliner concrete — a Mitte gallery loft, industrial ceiling height and precision',
    'polished light Swiss oak parquet — a Zürich private apartment, clean northern European light',
    'pale Bauhaus-era stone — a Berlin cultural institution floor, utilitarian and serious',
    'dark Corten steel and glass — a contemporary Berlin atelier surface, precise and cold',
    'aged German workshop oak — worn smooth, a manufactory table with decades of craft on it'
  ],
  'Madrid / Barcelona': [
    'warm hand-laid terracotta tiles — a Salamanca interior courtyard, afternoon shade and golden edge light',
    'pale Modernista marble — a Passeig de Gràcia building entrance floor, cool and precise',
    'dark aged olive wood surface — a Barcelona private table, evening warm lamp',
    'pale Castilian limestone — a Madrid private interior, hard afternoon light from a shuttered window',
    'aged Eixample encaustic ceramic tile — Barcelona interior, cool geometric pattern beneath'
  ]
};

// ─── KAMERABEWEGUNGEN (nach Post-Typ) ─────────────────────────────────────────
const cameraDetail = [
  'Locked-off extreme macro. The {leather} fills 90% of the frame. A single LED light source moves very slowly from left to right over 8 seconds — the surface texture and color revealed progressively. The camera does not move. No human body in frame.',
  'Overhead locked-off macro. {leather} under a single cold LED from directly above — hard shadows define every surface variation. The camera does not move. 8 seconds of total precision. No human body.',
  'Low locked-off macro, ground-level angle. {leather} — camera positioned at heel-base level, the texture razor-sharp in foreground, the column receding into soft blur. 8 seconds still. No human body.',
  'Slow orbital macro. Camera arcs 30 degrees around the heel at extreme close distance over 8 seconds — the {leather} texture continuously in sharp focus throughout the move. No human body.',
  'Dual-light locked-off macro. {leather} lit from two sources simultaneously: warm amber from the left, cold blue-white from the right — the competing light reveals the three-dimensional depth of the surface. Still. No human body.',
  'Locked-off macro with focus pull. Shot begins with the heel tip in focus — over 8 seconds, focus shifts slowly to the heel base. The {leather} surface catches both focal planes differently. No human body.'
];

const cameraEditorial = [
  'Low-angle floor-level shot. The {leather} heel is worn on a woman\'s right foot on {ambiance}. Camera at floor level, lower leg visible from knee down in a dark tailored trouser. Camera begins at heel level and rises 8cm over 4 seconds, then holds. No face, no torso.',
  'Dutch tilt floor shot. Camera at 12-degree tilt, floor level. {leather} heel worn on a woman\'s right foot on {ambiance}. Slightly diagonal framing gives the shot architectural tension. Slow push-in over 8 seconds — 15cm forward. No face.',
  'Split-focus lateral track. {leather} heel worn on a woman\'s right foot on {ambiance}. Heel in razor-sharp foreground focus, the room architecturally legible but blurred behind. Camera tracks 12cm laterally to the right over 8 seconds. No face.',
  'Reverse low-angle tracking. Camera positioned directly behind the heel at floor level. The woman wearing the {leather} heel takes 3 slow deliberate steps away — on {ambiance}. Heel always in foreground focus. No face visible.',
  'Low-angle reveal. Shot starts framing only the floor and the heel base. Over 6 seconds the camera rises slowly from floor level — the full {leather} heel comes into view. Final 2 seconds: still. No face.',
  'Slow push low-angle. Camera at shin level, slow continuous push-in over entire 8 seconds toward the {leather} heel worn on {ambiance}. The leather surface grows to fill the frame. No face, no torso.'
];

const cameraStory = [
  'Medium close-up, slightly above. {leather} heel resting on {ambiance}. The heel is the only sharp object in the frame — everything behind registers in warm cinematic blur. 8 seconds of complete stillness. No human body.',
  'Close-up, warm. {leather} heel on {ambiance}. After 4 seconds, a woman\'s hands enter frame from the left — they hold the shoe briefly, examine the surface, then withdraw. The heel remains. No face.',
  'Close-up with cinematic depth. {leather} heel in the foreground on {ambiance}. A background element — a lit lamp, a window, a city — registers out of focus. A slow rack-focus from background to heel over 3 seconds, then holds 5 seconds. No human body.',
  'Still medium shot with light change. {leather} heel placed on {ambiance}. Camera does not move. The ambient light very slowly shifts — warmer, more intimate — over 8 seconds. No human body. Cinematic color grade.',
  'Fade-in reveal. Shot begins in near-black. A single light source slowly brightens from the left — the {leather} heel emerges from shadow over 4 seconds. Then 4 seconds of hold. No human body.',
  'Over-the-shoulder medium close. A woman\'s shoulder in the extreme foreground — out of focus. She looks toward the {leather} heel resting on {ambiance} in the middle ground. 8 seconds still. No face, no body detail — just the shoulder silhouette and the heel.'
];

// ─── PROHIBITIONS (für alle Prompts) ─────────────────────────────────────────
const prohibitions = 'CRITICAL: Do NOT invent a different shoe design — the silhouette, strap structure, and heel form must match the reference photo exactly. No kitchen, no bedroom, no restaurant table, no generic domestic interior. No monsters, no fantasy creatures, no CGI distortion. No text overlay except: HEEL THE WORLD — exact spelling only, no variations.';

// ─── POSTS.JS PARSEN ─────────────────────────────────────────────────────────
let src = fs.readFileSync(POSTS_FILE, 'utf8');

// Alle Grok-Felder finden
const grokRegex = /grok:"((?:[^"\\]|\\.)*)"/g;
let match;
const positions = [];
while ((match = grokRegex.exec(src)) !== null) {
  positions.push({ start: match.index, end: match.index + match[0].length, old: match[1] });
}
console.log(`Gefundene grok-Felder: ${positions.length}`);

// Alle col und city Werte extrahieren (in selber Reihenfolge)
const colMatches = [...src.matchAll(/col:"([^"]*)"/g)].map(m => m[1]);
const cityMatches = [...src.matchAll(/city:"([^"]*)"/g)].map(m => m[1]);
const typeMatches = [...src.matchAll(/type:"([^"]*)"/g)].map(m => m[1]);
const timeMatches = [...src.matchAll(/time:"([^"]*)"/g)].map(m => m[1]);

console.log(`Posts: ${colMatches.length} col, ${cityMatches.length} city, ${typeMatches.length} type`);

// Prompts generieren
function buildPrompt(i, col, city, type, time) {
  const ld = leather[col] || leather['bordeaux'];
  const amb = ambiancePool[city] || ambiancePool['New York'];
  const amb_choice = amb[i % amb.length];

  let cam;
  if (type === 'Detail') {
    cam = cameraDetail[i % cameraDetail.length];
  } else if (type === 'Editorial') {
    cam = cameraEditorial[i % cameraEditorial.length];
  } else {
    cam = cameraStory[i % cameraStory.length];
  }

  // Fill in placeholders
  cam = cam.replace(/\{leather\}/g, ld).replace(/\{ambiance\}/g, amb_choice);

  // Format prefix
  const lang = city.includes('Paris') ? 'FR' : city.includes('Milan') ? 'IT' : city.includes('Berlin') ? 'DE' : city.includes('Madrid') ? 'ES' : 'EN';
  const prefix = `8-sec Reel, 9:16 vertical. Hochformat-Video für Instagram/TikTok/Reels. `;

  return (prefix + cam + ' ' + prohibitions)
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

// Alle Prompts ersetzen
let updated = src;
let offset = 0;

for (let i = 0; i < positions.length; i++) {
  const pos = positions[i];
  const col = colMatches[i] || 'bordeaux';
  const city = cityMatches[i] || 'New York';
  const type = typeMatches[i] || 'Detail';
  const time = timeMatches[i] || '08:00';

  const newPrompt = buildPrompt(i, col, city, type, time);
  const newVal = `grok:"${newPrompt}"`;

  const start = pos.start + offset;
  const end = pos.end + offset;
  updated = updated.slice(0, start) + newVal + updated.slice(end);
  offset += newVal.length - (pos.end - pos.start);

  if (i < 3) console.log(`[${i}] ${col} / ${city} / ${type}: OK`);
}

fs.writeFileSync(POSTS_FILE, updated, 'utf8');
console.log(`\nFertig. ${positions.length} Grok-Prompts neu geschrieben.`);
