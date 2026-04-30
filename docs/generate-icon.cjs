const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const W = 1024, H = 1024;
const c = createCanvas(W, H);
const ctx = c.getContext('2d');

// Rounded rect helper
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Clip to rounded rect
roundRect(0, 0, W, H, 226);
ctx.clip();

// Background gradient
const bg = ctx.createRadialGradient(W/2, H/2, 100, W/2, H/2, 600);
bg.addColorStop(0, '#1e1e3a');
bg.addColorStop(0.5, '#16213e');
bg.addColorStop(1, '#0d0d1f');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

// Subtle grid
ctx.strokeStyle = 'rgba(255,255,255,0.025)';
ctx.lineWidth = 1;
for (let i = 0; i < W; i += 40) {
  ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
}

// Glow behind notes
const glow = ctx.createRadialGradient(420, 500, 50, 420, 500, 350);
glow.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
glow.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
ctx.fillStyle = glow;
ctx.fillRect(0, 0, W, H);

const glow2 = ctx.createRadialGradient(620, 430, 30, 620, 430, 300);
glow2.addColorStop(0, 'rgba(6, 182, 212, 0.14)');
glow2.addColorStop(0.5, 'rgba(99, 102, 241, 0.06)');
glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
ctx.fillStyle = glow2;
ctx.fillRect(0, 0, W, H);

// Music note gradient
const noteGrad = ctx.createLinearGradient(250, 200, 700, 700);
noteGrad.addColorStop(0, '#c4b5fd');
noteGrad.addColorStop(0.3, '#a78bfa');
noteGrad.addColorStop(0.6, '#8b5cf6');
noteGrad.addColorStop(0.85, '#06b6d4');
noteGrad.addColorStop(1, '#22d3ee');

ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// Left note stem
ctx.strokeStyle = noteGrad;
ctx.lineWidth = 20;
ctx.beginPath();
ctx.moveTo(370, 260);
ctx.lineTo(370, 680);
ctx.stroke();

// Left note head
ctx.fillStyle = noteGrad;
ctx.save();
ctx.translate(355, 710);
ctx.rotate(-0.2);
ctx.beginPath();
ctx.ellipse(0, 0, 80, 52, 0, 0, Math.PI * 2);
ctx.fill();
ctx.restore();

// Top beam connecting left to right
ctx.strokeStyle = noteGrad;
ctx.lineWidth = 20;
ctx.beginPath();
ctx.moveTo(370, 260);
ctx.quadraticCurveTo(510, 225, 600, 270);
ctx.stroke();

// Second beam
ctx.lineWidth = 16;
ctx.globalAlpha = 0.55;
ctx.beginPath();
ctx.moveTo(370, 325);
ctx.quadraticCurveTo(505, 295, 600, 335);
ctx.stroke();
ctx.globalAlpha = 1;

// Right note stem
ctx.lineWidth = 20;
ctx.beginPath();
ctx.moveTo(600, 270);
ctx.lineTo(600, 615);
ctx.stroke();

// Right note head
ctx.fillStyle = noteGrad;
ctx.save();
ctx.translate(585, 645);
ctx.rotate(-0.2);
ctx.beginPath();
ctx.ellipse(0, 0, 80, 52, 0, 0, Math.PI * 2);
ctx.fill();
ctx.restore();

// Sparkle dots with glow
const sparkles = [
  { x: 700, y: 200, r: 7, a: 0.8 },
  { x: 240, y: 310, r: 5.5, a: 0.55 },
  { x: 750, y: 460, r: 5, a: 0.45 },
  { x: 195, y: 560, r: 4.5, a: 0.35 },
  { x: 690, y: 710, r: 5.5, a: 0.4 },
  { x: 290, y: 810, r: 4, a: 0.28 },
  { x: 780, y: 280, r: 3.5, a: 0.3 },
];

sparkles.forEach(s => {
  const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
  sg.addColorStop(0, `rgba(196, 181, 253, ${s.a * 0.5})`);
  sg.addColorStop(1, 'rgba(196, 181, 253, 0)');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = `rgba(255, 255, 255, ${s.a})`;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
  ctx.fill();
});

// Top highlight
const highlight = ctx.createLinearGradient(0, 0, 0, H);
highlight.addColorStop(0, 'rgba(255,255,255,0.06)');
highlight.addColorStop(0.25, 'rgba(255,255,255,0)');
ctx.fillStyle = highlight;
ctx.fillRect(0, 0, W, H);

// Save
const outDir = '/Users/weipt/WorkBuddy/20260414165951/build';
fs.writeFileSync(path.join(outDir, 'icon.png'), c.toBuffer('image/png'));
console.log('Generated 1024x1024 icon.png');

// Also generate a 512 version for resources
const c2 = createCanvas(512, 512);
const ctx2 = c2.getContext('2d');
ctx2.drawImage(c, 0, 0, 512, 512);
fs.writeFileSync('/Users/weipt/WorkBuddy/20260414165951/resources/icon.png', c2.toBuffer('image/png'));
console.log('Generated 512x512 resources/icon.png');
