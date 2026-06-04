// HTW Photo Rebuild — kopiert aus dem Archiv, befüllt posts.js mit einzigartigen Fotos
const fs = require('fs');
const path = require('path');

const ARCHIVE = 'D:\\ARCHIV\\HEEL_THE_WORLD';
const IMG_DIR = 'C:\\Users\\david\\HTW\\img';
const POSTS_FILE = 'C:\\Users\\david\\HTW\\posts.js';

// Alle JPG/PNG aus Archiv einsammeln (keine RAW/CR2)
function scanDir(dir, label) {
  let files = [];
  try {
    const entries = fs.readdirSync(dir);
    for (const f of entries) {
      const ext = path.extname(f).toLowerCase();
      if (['.jpg','.jpeg','.png'].includes(ext)) {
        files.push({ src: path.join(dir, f), label, name: f });
      }
    }
  } catch(e) {}
  return files;
}

// Archiv scannen — Root + alle Unterordner
const pool = [];
pool.push(...scanDir(ARCHIVE, 'root'));
for (const sub of ['bordeaux','peacock','xhigh','zebra','green white','black gold','black green','yellow','htw-identity']) {
  pool.push(...scanDir(path.join(ARCHIVE, sub), sub));
}

console.log(`Gesamt im Archiv: ${pool.length} Bilddateien`);

// Kurierte Kategorien — nach Dateiname filtern
function matches(name, keywords) {
  const n = name.toLowerCase();
  return keywords.some(k => n.includes(k));
}

const cats = {
  sketch:   pool.filter(f => matches(f.name, ['skiz','sketch','book','idee','handskizze','proto','entwurf','design','leist','naht','sohle'])),
  leather:  pool.filter(f => matches(f.name, ['leder','leather','tilapia','lachs','salmon','theo&mo leather','hellbraun','grau - unlack'])),
  david:    pool.filter(f => matches(f.name, ['david','arbeit','work','dhd'])),
  press:    pool.filter(f => matches(f.name, ['taff','inshoes','augsburg','hamburger','superior','gpa','green product','greenshowroom','denny','berlin vog','voguing','tu berlin','welove','rebecca','ira_artikel'])),
  model:    pool.filter(f => matches(f.name, ['eve','ira','tyra','yeyo','bibi','kiris','lena','nofr','zuzu','badu','ella','ane','oll','coco','sou','drama'])),
  bordeaux: pool.filter(f => f.label === 'bordeaux'),
  peacock:  pool.filter(f => f.label === 'peacock'),
  xhigh:    pool.filter(f => f.label === 'xhigh'),
  zebra:    pool.filter(f => f.label === 'zebra'),
  identity: pool.filter(f => f.label === 'htw-identity'),
  yellow:   pool.filter(f => f.label === 'yellow' && f.name.endsWith('.jpg')),
  blackgold:pool.filter(f => f.label === 'black gold' && !f.name.endsWith('.CR2')),
  greenwhite:pool.filter(f => f.label === 'green white'),
  blackgreen:pool.filter(f => f.label === 'black green' && !f.name.endsWith('.CR2')),
};

Object.entries(cats).forEach(([k,v]) => console.log(`  ${k}: ${v.length}`));

// Auswahl: für jeden Post in posts.js ein einzigartiges Bild
// Reihenfolge der Posts: NY(18), Paris(18), Milan(18), Berlin/Zürich(18), Madrid(18)
// Post-types: Detail(morning), Editorial(midday), Story(evening)
// col field: peacock, bordeaux, green white, zebra, ...

const postsRaw = fs.readFileSync(POSTS_FILE, 'utf8');

// Alle photo: Felder extrahieren — Positionen finden
const photoRegex = /photo:"([^"]*)"/g;
let m;
const positions = [];
while ((m = photoRegex.exec(postsRaw)) !== null) {
  positions.push({ start: m.index, end: m.index + m[0].length, old: m[1] });
}
console.log(`\nPosts mit photo-Feld: ${positions.length}`);

// Photo-Pool nach Priorität aufbauen — 90 einzigartige Fotos
// Zuordnung per Post-Index (0-89)
// Bereits im img/ vorhandene _MG_ Fotos behalten wo möglich, variieren wo nötig

const existing = fs.readdirSync(IMG_DIR).filter(f => ['.jpg','.jpeg','.png'].includes(path.extname(f).toLowerCase()));
console.log(`Aktuell in img/: ${existing.length}`);

// Alle Kategorien in einen geordneten Pool mischen
// Priorität: je nach Spaltenreihenfolge der Posts
const ordered = [
  ...cats.peacock.slice(0,8),
  ...cats.bordeaux.slice(0,8),
  ...cats.zebra.slice(0,8),
  ...cats.xhigh.slice(0,8),
  ...cats.greenwhite.slice(0,8),
  ...cats.blackgold.slice(0,8),
  ...cats.blackgreen.slice(0,8),
  ...cats.yellow.slice(0,6),
  ...cats.sketch.slice(0,8),
  ...cats.leather.slice(0,8),
  ...cats.david.slice(0,6),
  ...cats.press.slice(0,6),
  ...cats.model.slice(0,8),
  ...cats.identity.slice(0,8),
];

// Deduplizieren
const seen = new Set();
const unique = [];
for (const f of ordered) {
  if (!seen.has(f.src)) { seen.add(f.src); unique.push(f); }
}
console.log(`Unique Fotos im Pool: ${unique.length}`);

// Kopieren in img/ mit sauberem Dateinamen
// Format: {kategorie}_{index:03d}{ext}
let copied = 0;
const photoMap = []; // index → img/filename

for (let i = 0; i < Math.min(90, unique.length); i++) {
  const f = unique[i];
  const ext = path.extname(f.name).toLowerCase().replace('.jpeg', '.jpg');
  const cleanLabel = f.label.replace(/\s+/g,'_');
  const destName = `${cleanLabel}_${String(i).padStart(3,'0')}${ext}`;
  const dest = path.join(IMG_DIR, destName);

  try {
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(f.src, dest);
      copied++;
    }
    photoMap.push(`img/${destName}`);
  } catch(e) {
    console.warn(`  Fehler bei ${f.name}: ${e.message}`);
    // Fallback: bestehende _MG_ Fotos nutzen
    photoMap.push(`img/${existing[i % existing.length]}`);
  }
}
console.log(`Kopiert: ${copied} neue Fotos`);

// posts.js updaten — photo-Felder ersetzen
let updated = postsRaw;
let offset = 0;
for (let i = 0; i < positions.length && i < photoMap.length; i++) {
  const pos = positions[i];
  const newVal = `photo:"${photoMap[i]}"`;
  const start = pos.start + offset;
  const end = pos.end + offset;
  updated = updated.slice(0, start) + newVal + updated.slice(end);
  offset += newVal.length - (pos.end - pos.start);
}
fs.writeFileSync(POSTS_FILE, updated, 'utf8');
console.log(`\nposts.js aktualisiert — ${positions.length} Fotos, alle einzigartig.`);
console.log('Fertig. Deploy: netlify deploy --prod');
