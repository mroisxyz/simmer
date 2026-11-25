// customers.js — the service pass: three original regulars whose faces turn from
// delighted to sour as satisfaction drops. Reactions are staged from state only.

import { PALETTE as P } from './config.js';

export const CUSTOMER_LOOKS = [
  { name: 'MISO', skin: '#F2C79C', hair: '#5B3A2A', hat: '#E8672E', trim: '#2E8C7B', style: 'cap' },
  { name: 'PIP', skin: '#C98B63', hair: '#33231C', hat: '#F3C44E', trim: '#C0468C', style: 'spikes' },
  { name: 'NORI', skin: '#E9B98F', hair: '#7A3B2E', hat: '#5EC57E', trim: '#3C6E8C', style: 'beanie' },
];

function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function box(c,x,y,w,h,r,f,s=P.ink,lw=2){rr(c,x,y,w,h,r);c.fillStyle=f;c.fill();if(s){c.lineWidth=lw;c.strokeStyle=s;c.stroke()}}
function ell(c,x,y,rx,ry,f,s,lw=2){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=f;c.fill();if(s){c.lineWidth=lw;c.strokeStyle=s;c.stroke()}}
function txt(c,t,x,y,z,col,w=700,a='center'){c.font=w+' '+z+'px system-ui,"Segoe UI",sans-serif';c.textAlign=a;c.textBaseline='middle';c.fillStyle=col;c.fillText(t,x,y)}

// A floating heart for a good serve or a jagged anger bolt for a lost order.
export function drawCustomerReaction(c, state, x, y, kind) {
  const react = state.customerReaction;
  if (!react || react.kind !== kind) return;
  const age = state.now - react.at;
  if (age < 0 || age > 1000) return;
  const rise = age / 1000 * 30;
  c.save(); c.globalAlpha = Math.max(0, 1 - age / 1000); c.translate(x, y - rise);
  if (kind === 'heart') {
    c.fillStyle = '#E5484D'; c.strokeStyle = P.ink; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, 9); c.bezierCurveTo(-18, -3, -10, -16, 0, -7);
    c.bezierCurveTo(10, -16, 18, -3, 0, 9); c.fill(); c.stroke();
  } else {
    c.fillStyle = P.red; c.strokeStyle = P.ink; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-3, -12); c.lineTo(6, -2); c.lineTo(1, -2);
    c.lineTo(5, 11); c.lineTo(-7, -1); c.lineTo(-2, -1); c.closePath(); c.fill(); c.stroke();
  }
  c.restore();
}

export function drawCustomers(c, state) {
  const sat = Math.max(0, Math.min(100, state.satisfaction || 0));
  box(c, 556, 82, 330, 112, 12, '#B97B4F', P.ink, 4);
  box(c, 564, 90, 314, 92, 9, '#F6DCB2', null);
  txt(c, 'SERVICE PASS', 721, 102, 11, P.inkSoft, 800);
  box(c, 556, 186, 330, 12, 5, P.woodDark, P.ink, 2);

  CUSTOMER_LOOKS.forEach((look, i) => {
    const x = 614 + i * 107, y = 146;
    const moodScore = sat - i * 14;
    const mood = moodScore >= 70 ? 2 : moodScore >= 40 ? 1 : 0;
    // soft drop shadow behind each head gives the row depth
    ell(c, x + 2, y + 28, 30, 22, 'rgba(60,37,25,0.16)', null);
    box(c, x - 28, y + 12, 56, 34, 10, look.trim, P.ink, 2);
    ell(c, x, y, 25, 26, look.skin, P.ink, 2.5);
    ell(c, x - 7, y - 3, 4, 5, P.cream, P.ink, 1.5);
    ell(c, x + 7, y - 3, 4, 5, P.cream, P.ink, 1.5);
    ell(c, x - 7 + (i === 1 ? 1 : 0), y - 2, 2, 2.5, P.ink, null);
    ell(c, x + 7 + (i === 1 ? -1 : 0), y - 2, 2, 2.5, P.ink, null);
    ell(c, x - 15, y + 7, 4, 2.5, 'rgba(232,103,46,0.35)', null);
    ell(c, x + 15, y + 7, 4, 2.5, 'rgba(232,103,46,0.35)', null);
    c.strokeStyle = P.ink; c.lineWidth = 2.4; c.beginPath();
    if (mood === 2) c.arc(x, y + 7, 8, 0.2, Math.PI - 0.2);
    else if (mood === 1) { c.moveTo(x - 7, y + 11); c.lineTo(x + 7, y + 11); }
    else c.arc(x, y + 18, 8, Math.PI + 0.2, Math.PI * 2 - 0.2);
    c.stroke();
    if (look.style === 'cap') {
      ell(c, x, y - 17, 26, 11, look.hair, P.ink, 2);
      box(c, x - 29, y - 24, 58, 10, 5, look.hat, P.ink, 2);
      box(c, x + 6, y - 22, 28, 6, 3, look.hat, P.ink, 1.5);
    } else if (look.style === 'spikes') {
      ell(c, x, y - 17, 25, 12, look.hair, P.ink, 2);
      for (let k = -2; k <= 2; k++) {
        c.fillStyle = look.hair; c.beginPath();
        c.moveTo(x + k * 10 - 5, y - 22); c.lineTo(x + k * 10, y - 35 - Math.abs(k) * -2);
        c.lineTo(x + k * 10 + 5, y - 22); c.closePath(); c.fill();
      }
      box(c, x - 25, y - 19, 50, 6, 3, look.hat, P.ink, 1.5);
    } else {
      ell(c, x, y - 20, 26, 14, look.hat, P.ink, 2);
      box(c, x - 27, y - 14, 54, 8, 4, look.hat, P.ink, 2);
      ell(c, x, y - 35, 7, 7, look.hat, P.ink, 2);
    }
    txt(c, look.name, x, y + 34, 10, P.cream, 800);
    drawCustomerReaction(c, state, x + 22, y - 34,
      (state.customerReaction && state.customerReaction.index === i) ? state.customerReaction.kind : 'none');
  });
}
