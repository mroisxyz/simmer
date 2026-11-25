// foodart.js — finished-dish illustration. Each recipe gets its own silhouette,
// gradients and garnish so a plated order looks worth serving at thumbnail size.

import { PALETTE as P, ingredientById } from './config.js';

function ell(c,x,y,rx,ry,f,s,lw=2){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=f;c.fill();if(s){c.lineWidth=lw;c.strokeStyle=s;c.stroke()}}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function shine(c,x,y,s){c.save();c.globalAlpha=.55;ell(c,x-s*.32,y-s*.35,s*.24,s*.12,'#FFFFFF',null);c.restore()}
function steam(c,x,y,s,now){
  c.save();c.lineWidth=Math.max(2,s*.12);c.lineCap='round';
  for(let i=0;i<3;i++){const ox=x+(i-1)*s*.7,ph=(now/760+i*.3)%1;
    c.globalAlpha=.45*(1-ph);c.strokeStyle='#FFF8E8';
    c.beginPath();c.moveTo(ox,y-s*.8);c.bezierCurveTo(ox-s*.5,y-s*1.3-ph*8,ox+s*.6,y-s*1.7-ph*10,ox,y-s*2.1-ph*12);c.stroke()}
  c.restore()
}
function colors(dish){return (dish.items||[]).map((id)=>ingredientById(id)).filter(Boolean)}

// Golden folded omelette, pepper/tomato confetti and little herb sprigs.
export function drawSunriseSkillet(c,x,y,s,now,dish){
  const g=c.createRadialGradient(x-s*.3,y-s*.5,s*.1,x,y,s*2.2);
  g.addColorStop(0,'#FFE9A3');g.addColorStop(.45,'#F5B93F');g.addColorStop(1,'#D9822B');
  ell(c,x,y+s*.12,s*2.1,s*1.05,'rgba(60,37,25,.22)',null);
  ell(c,x,y,s*2,s*1,g,P.woodDark,3);shine(c,x,y,s);
  c.strokeStyle='#E89A2E';c.lineWidth=3;c.beginPath();
  c.ellipse(x-s*.35,y-s*.1,s*1.25,s*.55,-.25,.1,Math.PI*1.25);c.stroke();
  const cs=colors(dish);
  cs.forEach((ing,i)=>{const a=i*2.1+.5,px=x+Math.cos(a)*s*1.05,py=y+Math.sin(a)*s*.46;
    ell(c,px,py,s*.32,s*.24,ing.color,ing.accent,2);ell(c,px-s*.08,py-s*.06,s*.1,s*.06,'rgba(255,255,255,.7)',null)});
  c.strokeStyle='#3E8A4B';c.lineWidth=2.5;
  for(let i=0;i<4;i++){const hx=x-s*1.2+i*s*.8,hy=y+s*.55;
    c.beginPath();c.moveTo(hx,hy);c.lineTo(hx+2,hy-s*.4);c.moveTo(hx+2,hy-s*.2);c.lineTo(hx+s*.32,hy-s*.38);c.stroke()}
  steam(c,x,y,s,now)
}

// Wide noodle bowl with swirls, coral shrimp, greens and crossed chopsticks.
export function drawHarborNoodleBowl(c,x,y,s,now,dish){
  ell(c,x,y+s*.5,s*2.1,s*.75,'rgba(60,37,25,.22)',null);
  const bowl=c.createLinearGradient(x,y-s,x,y+s*1.5);
  bowl.addColorStop(0,'#F3E2C2');bowl.addColorStop(1,'#C99464');
  ell(c,x,y+s*.2,s*2,s*1.2,bowl,P.woodDark,3);
  ell(c,x,y-s*.05,s*1.82,s*.82,'#E8D9B6',P.ink,2);
  c.strokeStyle='#E3B75A';c.lineWidth=3;
  for(let i=0;i<4;i++){c.beginPath();c.arc(x-s*.3+i*s*.2,y-s*.1,s*(.42+i*.14),.2,Math.PI*1.55);c.stroke()}
  const cs=colors(dish);
  cs.forEach((ing,i)=>{const a=i*2.3,px=x+Math.cos(a)*s*.95,py=y-s*.1+Math.sin(a)*s*.4;
    if(ing.shape==='strip'||ing.shape==='ring'){ell(c,px,py,s*.34,s*.22,ing.color,ing.accent,2);ell(c,px,py,s*.12,s*.08,'#FFF3DF',null)}
    else ell(c,px,py,s*.3,s*.24,ing.color,ing.accent,2)});
  c.strokeStyle='#3B7A42';c.lineWidth=3;
  for(let i=0;i<3;i++){const gx=x-s*.8+i*s*.75;c.beginPath();c.moveTo(gx,y-s*.55);
    c.quadraticCurveTo(gx-s*.3,y-s*1.2,gx+s*.2,y-s*1.35);c.quadraticCurveTo(gx+s*.45,y-s*.85,gx,y-s*.55);c.stroke()}
  c.strokeStyle=P.woodDark;c.lineWidth=4;c.lineCap='round';
  c.beginPath();c.moveTo(x+s*.55,y-s*1.9);c.lineTo(x+s*1.75,y-s*.75);
  c.moveTo(x+s*.8,y-s*2);c.lineTo(x+s*1.9,y-s*.9);c.stroke();
  steam(c,x,y-s*.4,s*.85,now)
}

// Three paper-thin crepes, syrup drips and bright citrus wheels.
export function drawCitrusCrepeStack(c,x,y,s,now,dish){
  ell(c,x,y+s*.5,s*2,s*.7,'rgba(60,37,25,.2)',null);
  for(let i=0;i<3;i++){
    const g=c.createLinearGradient(x,y-s+i*s*.35,x,y+s*.5+i*s*.35);
    g.addColorStop(0,'#FFF0CF');g.addColorStop(1,'#E4B978');
    ell(c,x+i*2,y+i*s*.35,s*1.8-i*s*.1,s*.55,g,P.woodDark,2.5);
    c.strokeStyle='#C58A45';c.lineWidth=2;
    c.beginPath();c.ellipse(x+i*2,y+i*s*.35,s*1.3,s*.35,0,.2,Math.PI-.2);c.stroke()}
  c.fillStyle='#C77A17';
  c.beginPath();c.moveTo(x-s*1.1,y-s*.5);c.quadraticCurveTo(x,y-s*.95,x+s*1.1,y-s*.5);
  c.quadraticCurveTo(x+s*.6,y+s*.05,x,y-s*.2);c.quadraticCurveTo(x-s*.7,y+s*.1,x-s*1.1,y-s*.5);c.fill();
  for(let i=0;i<2;i++){const ox=x+(i? s*1.15:-s*1.15),oy=y-s*.95;
    ell(c,ox,oy,s*.55,s*.55,'#F6E14A',P.ink,2);
    ell(c,ox,oy,s*.36,s*.36,'#FFF3B0',null);
    c.strokeStyle='#E5C62F';c.lineWidth=2;
    for(let k=0;k<4;k++){const a=k*Math.PI/2;c.beginPath();c.moveTo(ox,oy);c.lineTo(ox+Math.cos(a)*s*.36,oy+Math.sin(a)*s*.36);c.stroke()}}
  ell(c,x+s*.25,y-s*1.1,s*.32,s*.26,'#FFF8E8',P.ink,2);
  steam(c,x,y-s,s*.7,now)
}

// Everyday fallback: a sauced mound of the dish's ingredients with herbs.
export function drawGenericDish(c,x,y,s,now,dish){
  const g=c.createLinearGradient(x,y-s,x,y+s);g.addColorStop(0,'#FFF0D2');g.addColorStop(1,'#D9A869');
  ell(c,x,y+s*.45,s*1.9,s*.7,'rgba(60,37,25,.2)',null);
  ell(c,x,y,s*1.85,s*.95,g,P.woodDark,3);
  const cs=colors(dish);
  cs.forEach((ing,i)=>{const a=i*2.2,px=x+Math.cos(a)*s*.75,py=y+Math.sin(a)*s*.3;
    ell(c,px,py,s*.48,s*.36,ing.color,ing.accent,2);shine(c,px,py,s*.5)});
  c.strokeStyle='#3E8A4B';c.lineWidth=2.5;
  c.beginPath();c.moveTo(x-s*.6,y+s*.5);c.lineTo(x-s*.5,y+s*.1);c.moveTo(x-s*.5,y+s*.3);c.lineTo(x-s*.1,y+s*.15);c.stroke();
  steam(c,x,y-s*.3,s*.8,now)
}

export function drawFinishedDish(c,dish,x,y,s,now){
  if(!dish)return;
  if(dish.recipeId==='sunrise')drawSunriseSkillet(c,x,y,s,now,dish);
  else if(dish.recipeId==='harbor')drawHarborNoodleBowl(c,x,y,s,now,dish);
  else if(dish.recipeId==='citrus')drawCitrusCrepeStack(c,x,y,s,now,dish);
  else drawGenericDish(c,x,y,s,now,dish);
}
