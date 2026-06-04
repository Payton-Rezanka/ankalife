// Generates AnkaLife app icons (no external deps) — gold "A" on brand background.
const fs = require('fs');
const zlib = require('zlib');

// CRC32
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function png(width, height, rgba) {
  const sig = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const raw = Buffer.alloc((width*4+1)*height);
  for (let y=0;y<height;y++){ raw[y*(width*4+1)]=0; rgba.copy(raw, y*(width*4+1)+1, y*width*4, (y+1)*width*4); }
  const idat = zlib.deflateSync(raw,{level:9});
  return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',idat), chunk('IEND',Buffer.alloc(0))]);
}

// distance point to segment
function distSeg(px,py,ax,ay,bx,by){
  const dx=bx-ax, dy=by-ay; const l2=dx*dx+dy*dy;
  let t = l2? ((px-ax)*dx+(py-ay)*dy)/l2 : 0; t=Math.max(0,Math.min(1,t));
  const cx=ax+t*dx, cy=ay+t*dy; return Math.hypot(px-cx,py-cy);
}
function hex(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}

function makeIcon(S){
  const bgTop=hex('#e0a23c'), bgBot=hex('#c8862a'), navy=hex('#082a2b');
  const rgba=Buffer.alloc(S*S*4);
  const apex=[S*0.5,S*0.22], lf=[S*0.30,S*0.80], rf=[S*0.70,S*0.80];
  const stroke=S*0.115;
  for(let y=0;y<S;y++){
    for(let x=0;x<S;x++){
      const i=(y*S+x)*4;
      // vertical gold gradient background
      const t=y/S;
      let r=Math.round(bgTop[0]+(bgBot[0]-bgTop[0])*t);
      let g=Math.round(bgTop[1]+(bgBot[1]-bgTop[1])*t);
      let b=Math.round(bgTop[2]+(bgBot[2]-bgTop[2])*t);
      // navy "A"
      const onLeft=distSeg(x,y,apex[0],apex[1],lf[0],lf[1])<stroke/2;
      const onRight=distSeg(x,y,apex[0],apex[1],rf[0],rf[1])<stroke/2;
      const onBar=(y>S*0.58 && y<S*0.58+stroke*0.9 && x>S*0.36 && x<S*0.64);
      if(onLeft||onRight||onBar){ r=navy[0];g=navy[1];b=navy[2]; }
      rgba[i]=r;rgba[i+1]=g;rgba[i+2]=b;rgba[i+3]=255;
    }
  }
  return png(S,S,rgba);
}

fs.writeFileSync('icon-512.png', makeIcon(512));
fs.writeFileSync('icon-192.png', makeIcon(192));
fs.writeFileSync('apple-touch-icon.png', makeIcon(180));
console.log('icons written: 512, 192, 180');
