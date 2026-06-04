// HTW Icon Generator — reines Node.js, kein externes Paket
// Design: Schwarzer Hintergrund, bernsteinfarbener Stiletto-Monogramm
const zlib = require('zlib');
const fs = require('fs');

const BG  = [17, 17, 17, 255];       // #111111
const AMB = [232, 168, 123, 255];    // #E8A87B (amber)
const NONE = [17, 17, 17, 0];

function makePNG(size) {
  const px = new Uint8Array(size * size * 4).fill(0);

  function set(x, y, col) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i]=col[0]; px[i+1]=col[1]; px[i+2]=col[2]; px[i+3]=col[3];
  }
  function rect(x, y, w, h, col) {
    for (let dy=0; dy<h; dy++) for (let dx=0; dx<w; dx++) set(x+dx, y+dy, col);
  }
  function circle(cx, cy, r, col) {
    for (let dy=-r; dy<=r; dy++) for (let dx=-r; dx<=r; dx++) {
      if (dx*dx+dy*dy <= r*r) set(cx+dx, cy+dy, col);
    }
  }
  function ring(cx, cy, r1, r2, col) {
    for (let dy=-r2; dy<=r2; dy++) for (let dx=-r2; dx<=r2; dx++) {
      const d2 = dx*dx+dy*dy;
      if (d2 <= r2*r2 && d2 >= r1*r1) set(cx+dx, cy+dy, col);
    }
  }

  const s = size / 512; // scale factor

  // Background
  rect(0, 0, size, size, BG);

  // Outer ring — thin amber circle (like a wax seal border)
  ring(size/2, size/2, Math.round(220*s), Math.round(238*s), AMB);

  // Letter H — centered, slender luxury proportions
  const cx = Math.round(size/2);
  const cy = Math.round(size/2 + 10*s);
  const lw = Math.round(26*s);   // slender stroke width
  const hh = Math.round(150*s);  // half-height of H
  const hw = Math.round(72*s);   // half-width of H (outer)

  // Left vertical
  rect(cx - hw, cy - hh, lw, hh*2, AMB);
  // Right vertical
  rect(cx + hw - lw, cy - hh, lw, hh*2, AMB);
  // Crossbar — slightly above center (classical proportion)
  rect(cx - hw, cy - Math.round(22*s), hw*2, lw, AMB);

  // Thin horizontal rule below H (luxury detail)
  const ry = cy + hh + Math.round(32*s);
  rect(cx - Math.round(80*s), ry, Math.round(160*s), Math.max(Math.round(2*s),1), AMB);

  // Build PNG binary
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);

  function chunk(type, data) {
    const t = Buffer.from(type);
    const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const len = Buffer.alloc(4); len.writeUInt32BE(d.length);
    const crcBuf = Buffer.concat([t, d]);
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let n=0; n<256; n++) {
      let c=n;
      for (let k=0; k<8; k++) c = (c&1) ? (0xEDB88320^(c>>>1)) : (c>>>1);
      table[n]=c;
    }
    for (const b of crcBuf) crc = table[(crc^b)&0xFF]^(crc>>>8);
    crc = (crc^0xFFFFFFFF)>>>0;
    const crcBufOut = Buffer.alloc(4); crcBufOut.writeUInt32BE(crc);
    return Buffer.concat([len, t, d, crcBufOut]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;

  // Raw image data: filter byte 0 + RGBA rows
  const raw = Buffer.alloc(size * (size*4+1));
  for (let y=0; y<size; y++) {
    raw[y*(size*4+1)] = 0; // filter None
    for (let x=0; x<size; x++) {
      const si = (y*size+x)*4;
      const di = y*(size*4+1)+1+x*4;
      raw[di]=px[si]; raw[di+1]=px[si+1]; raw[di+2]=px[si+2]; raw[di+3]=px[si+3];
    }
  }
  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',compressed), chunk('IEND',Buffer.alloc(0))]);
}

fs.writeFileSync('C:\\Users\\david\\HTW\\icon-512.png', makePNG(512));
fs.writeFileSync('C:\\Users\\david\\HTW\\icon-192.png', makePNG(192));
console.log('Icons erstellt: icon-512.png + icon-192.png');
