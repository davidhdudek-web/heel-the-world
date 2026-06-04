// HTW Photo Rebuild v2 — maximale Abwechslung
// Nimmt alle 1.599 Bilder aus dem Archiv, mischt sie, verteilt 90 einzigartige auf die Posts
const fs = require('fs');
const path = require('path');

const ARCHIVE = 'D:\\ARCHIV\\HEEL_THE_WORLD';
const IMG_DIR = 'C:\\Users\\david\\HTW\\img';
const POSTS_FILE = 'C:\\Users\\david\\HTW\\posts.js';

// Alle JPG/PNG rekursiv einsammeln (keine CR2/RAW)
function scanAll(dir) {
  let files = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...scanAll(full));
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.jpg','.jpeg','.png'].includes(ext)) {
          files.push(full);
        }
      }
    }
  } catch(e) {}
  return files;
}

// Ausschlussliste: keine Logos, Flyer, Screenshots, UI-Grafiken, Briefbögen
function isUsable(filepath) {
  const n = path.basename(filepath).toLowerCase();
  const skip = [
    'screenshot','flyer','briefbogen','logo','qr','cd-','planet',
    'gutschein','gutschien','post flyer','sternzeichen','welovebrands',
    'fashionweek-qr','12x12','blank','_n.jpg','_n.png',
    'startseite','amuI','aneII','kiris II','sou I','coco cricle',
    'fb_img','superior-digital','cd-idee','cd-logo','cdtitle',
    'ihr_qr','denny k','screenshot','anstupsen'
  ];
  return !skip.some(s => n.includes(s));
}

const all = scanAll(ARCHIVE).filter(isUsable);
console.log(`Nutzbare Bilder im Archiv: ${all.length}`);

// Mischen — Fisher-Yates
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const shuffled = shuffle([...all]);

// img/ leeren von alten kopierten Archivfotos (nicht _MG_ behalten)
const existing = fs.readdirSync(IMG_DIR);
for (const f of existing) {
  if (!f.startsWith('_MG_')) {
    try { fs.unlinkSync(path.join(IMG_DIR, f)); } catch(e) {}
  }
}
console.log('Alte Archivfotos aus img/ entfernt (orig _MG_ behalten)');

// 90 einzigartige Fotos kopieren — gleichmäßig verteilt aus dem gesamten Pool
// Nutze jeden 17. Index aus dem shuffled Pool für maximale Streuung über den Archiv-Baum
const photoMap = [];
const usedSrc = new Set();
let copied = 0;

// Strategie: 90 Fotos aus 1500+ — Abstand ~17 zwischen Picks damit alle Archivbereiche vertreten
const step = Math.floor(shuffled.length / 90);
for (let i = 0; i < 90 && copied < 90; i++) {
  // Nimm aus verschiedenen Bereichen des geshuffelten Arrays
  let candidate = shuffled[i * step % shuffled.length];
  // Falls schon genutzt, nächsten freien nehmen
  let tries = 0;
  while (usedSrc.has(candidate) && tries < shuffled.length) {
    candidate = shuffled[(i * step + tries) % shuffled.length];
    tries++;
  }
  if (usedSrc.has(candidate)) continue;

  usedSrc.add(candidate);
  const ext = path.extname(candidate).toLowerCase().replace('.jpeg','.jpg');
  const destName = `arch_${String(i).padStart(3,'0')}${ext}`;
  const dest = path.join(IMG_DIR, destName);

  try {
    fs.copyFileSync(candidate, dest);
    photoMap.push(`img/${destName}`);
    copied++;
    if (i < 5) console.log(`  [${i}] ${path.basename(candidate)}`);
  } catch(e) {
    console.warn(`  Fehler: ${e.message}`);
    // Fallback auf _MG_ Foto
    const mg = existing.filter(f => f.startsWith('_MG_'));
    photoMap.push(`img/${mg[i % mg.length]}`);
  }
}
console.log(`Kopiert: ${copied} Fotos`);

// posts.js photo-Felder updaten
const postsRaw = fs.readFileSync(POSTS_FILE, 'utf8');
const photoRegex = /photo:"([^"]*)"/g;
let m;
const positions = [];
while ((m = photoRegex.exec(postsRaw)) !== null) {
  positions.push({ start: m.index, end: m.index + m[0].length });
}
console.log(`Posts gefunden: ${positions.length}`);

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

// Prüfen: wie viele unique Fotos?
const usedPhotos = [...updated.matchAll(/photo:"([^"]*)"/g)].map(m => m[1]);
const uniquePhotos = new Set(usedPhotos);
console.log(`\nErgebnis: ${usedPhotos.length} Posts, ${uniquePhotos.size} einzigartige Fotos`);
console.log('Fertig.');
