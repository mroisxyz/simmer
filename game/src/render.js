// render.js — paints the kitchen, chef, chasing tickets and HUD from state only.
// customers and recipe-board overlays are injected by main.js; plated food comes from foodart.js.
// All motion and warnings are functions of state.now, so capture presets stay deterministic.

import { PALETTE as P, LAYOUT as L, TIMER, ingredientById as ing } from './config.js';
import { binIds } from './actions.js';
import { currentStep as stepOf, selectedOrder } from './state.js';
import { hitTest } from './input.js';
import { drawFinishedDish } from './foodart.js';

function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function box(c,x,y,w,h,r,f,s=P.ink,lw=3){rr(c,x,y,w,h,r);c.fillStyle=f;c.fill();if(s){c.lineWidth=lw;c.strokeStyle=s;c.stroke()}}
function txt(c,t,x,y,z,col=P.ink,w=700,a='left'){c.font=w+' '+z+'px system-ui,"Segoe UI",sans-serif';c.textAlign=a;c.textBaseline='middle';c.fillStyle=col;c.fillText(t,x,y)}
function ell(c,x,y,rx,ry,f,s,lw=3){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=f;c.fill();if(s){c.lineWidth=lw;c.strokeStyle=s;c.stroke()}}

export function drawFood(c,g,x,y,s,spin=0){
  if(!g)return;const col=g.color,acc=g.accent;
  c.save();c.translate(x,y);c.rotate(spin);c.lineWidth=Math.max(2,s*.12);c.strokeStyle=acc;
  c.shadowColor='rgba(60,37,25,0.25)';c.shadowBlur=5;c.shadowOffsetY=2;
  const grad=c.createLinearGradient(-s,-s,s,s);grad.addColorStop(0,'#FFFFFF');grad.addColorStop(.3,col);grad.addColorStop(1,acc);
  if(g.shape==='round'){ell(c,0,0,s,s*.86,grad,acc);c.shadowBlur=0;ell(c,-s*.32,-s*.3,s*.22,s*.14,'rgba(255,255,255,.75)')}
  else if(g.shape==='strip'){rr(c,-s,-s*.36,s*2,s*.72,s*.34);c.fillStyle=col;c.fill();c.stroke();c.beginPath();c.moveTo(-s*.5,-s*.3);c.lineTo(-s*.3,s*.3);c.moveTo(s*.2,-s*.3);c.lineTo(s*.4,s*.3);c.stroke()}
  else if(g.shape==='cube'){rr(c,-s*.8,-s*.7,s*1.6,s*1.5,s*.22);c.fillStyle=col;c.fill();c.stroke();c.beginPath();c.moveTo(-s*.8,-s*.2);c.lineTo(s*.8,-s*.2);c.stroke()}
  else if(g.shape==='grain'){for(let i=0;i<7;i++){const a=i*2.4;ell(c,Math.cos(a)*s*.55,Math.sin(a)*s*.45,s*.2,s*.27,i%2?acc:col,null)}}
  else if(g.shape==='ring'){ell(c,0,0,s*.82,s*.82,col,acc);ell(c,0,0,s*.32,s*.32,P.wallLight,acc,2)}
  else if(g.shape==='leaf'){c.beginPath();c.moveTo(-s,s*.5);c.quadraticCurveTo(0,-s*1.5,s,s*.5);c.quadraticCurveTo(0,s*.95,-s,s*.5);c.fillStyle=col;c.fill();c.stroke();c.beginPath();c.moveTo(-s*.8,s*.45);c.lineTo(s*.8,s*.45);c.stroke()}
  else{c.beginPath();c.moveTo(0,-s);c.quadraticCurveTo(s,0,0,s*.9);c.quadraticCurveTo(-s,0,0,-s);c.fillStyle=col;c.fill();c.stroke()}
  c.restore()
}

function wall(c){
  c.fillStyle=P.wall;c.fillRect(0,0,L.width,L.wallBottom);
  for(let y=62;y<L.wallBottom;y+=46)for(let x=(Math.floor(y/46)%2)*32;x<920;x+=64){c.fillStyle=((x+y)/46)%2<1?P.wallLight:'#F6E7CB';c.fillRect(x+2,y+2,60,42)}
  c.strokeStyle=P.grout;c.lineWidth=2;
  for(let y=62;y<L.wallBottom;y+=46){c.beginPath();c.moveTo(0,y);c.lineTo(920,y);c.stroke()}
  for(let x=0;x<920;x+=64){c.beginPath();c.moveTo(x,62);c.lineTo(x,L.wallBottom);c.stroke()}
  box(c,40,172,470,14,5,P.woodDark,P.ink,3);
  const jars=['#E8672E','#2E8C7B','#F3C44E','#C0468C','#8FD14F'];
  for(let i=0;i<jars.length;i++){const x=68+i*88;box(c,x,126,48,46,8,'rgba(255,255,255,.65)',P.ink,3);box(c,x+4,142,40,28,4,jars[i],null);box(c,x-2,118,52,10,3,P.woodLight,P.ink,2)}
}

function counter(c){
  c.fillStyle=P.wood;c.fillRect(0,L.counterTop-14,916,354);c.fillStyle=P.counter;c.fillRect(0,L.counterTop-14,916,20);
  c.strokeStyle=P.woodDark;c.lineWidth=3;c.beginPath();c.moveTo(0,L.counterTop+8);c.lineTo(916,L.counterTop+8);c.stroke();
  for(let y=306;y<600;y+=54){c.strokeStyle='rgba(143,92,54,.45)';c.lineWidth=2;c.beginPath();c.moveTo(0,y);c.lineTo(916,y);c.stroke()}
  for(let x=120;x<916;x+=240){c.strokeStyle='rgba(60,37,25,.16)';c.lineWidth=2;c.beginPath();c.moveTo(x,L.counterTop+10);c.lineTo(x,600);c.stroke()}
  c.fillStyle=P.woodDark;c.fillRect(0,598,916,12)
}

function bins(c,state){
  const ids=binIds(state);
  for(let i=0;i<6;i++){
    const b={x:L.bins.x+i*(L.bins.w+L.bins.gap),y:L.bins.y,w:L.bins.w,h:L.bins.h};
    const g=ing(ids[i]),hover=state.pointer&&state.pointer.region==='bin'&&hitTest(state.pointer).index===i;
    const dy=hover?-4:0;
    box(c,b.x,b.y+dy,b.w,b.h,12,hover?'#F6DCB2':P.cream,P.woodDark,3);
    box(c,b.x+6,b.y+dy+6,b.w-12,58,8,g?g.color:P.grout,P.ink,2);
    if(g)drawFood(c,g,b.x+b.w/2,b.y+dy+35,20,Math.sin(state.now/500+i)*.12);
    txt(c,String(i+1),b.x+12,b.y+dy+16,13,P.ink,800);
    txt(c,g?g.name:'',b.x+b.w/2,b.y+dy+84,14,P.ink,800,'center')
  }
}

function pips(c,x,y,got,need,col){for(let i=0;i<need;i++)ell(c,x+i*16,y,6,6,i<got?col:'rgba(255,248,232,.35)',i<got?P.ink:P.cream,1.5)}

function board(c,state){
  const b=L.board,d=state.active;
  box(c,b.x-6,b.y+b.h-10,b.w+12,16,6,P.woodDark,P.ink,3);
  box(c,b.x,b.y,b.w,b.h,10,'#E7BD86',P.woodDark,4);
  c.strokeStyle='rgba(143,92,54,.5)';c.lineWidth=2;
  for(let i=1;i<5;i++){c.beginPath();c.moveTo(b.x+i*56,b.y+8);c.lineTo(b.x+i*56,b.y+b.h-8);c.stroke()}
  if(d&&d.picked.length)d.picked.forEach((id,i)=>drawFood(c,ing(id),b.x+52+(i%4)*62,b.y+62+Math.floor(i/4)*46,17,i));
  const swing=Math.sin(state.now/110)*(state.pointer&&state.pointer.region==='board'?.42:.08);
  c.save();c.translate(b.x+206,b.y+96);c.rotate(-.55+swing);
  box(c,-6,-46,12,58,3,'#E8EDF0',P.ink,2);box(c,-7,12,14,44,5,P.woodDark,P.ink,2);c.restore();
  txt(c,d&&stepOf(d)==='chop'?'CHOP HERE':'CHOPPING BOARD',b.x+b.w/2,b.y+b.h-26,15,P.ink,800,'center');
  if(d&&d.steps.includes('chop'))pips(c,b.x+16,b.y+b.h-8,d.progress.chop,TIMER.chopGoal,P.orange)
}

function count(d){const s=stepOf(d);if(s==='pick')return d.picked.length+'/'+d.items.length;if(s==='plate')return'TO PLATE';return d.progress[s]+'/'+(s==='chop'?TIMER.chopGoal:s==='stir'?TIMER.stirGoal:TIMER.flipGoal)}

function stove(c,state){
  const s=L.stove,cx=s.x+104,cy=s.y+92,d=state.active;
  box(c,s.x-8,s.y+78,s.w+16,s.h-70,12,P.pan,P.ink,4);
  for(const bx of[s.x+48,s.x+220]){ell(c,bx,s.y+142,52,16,'#20262B',P.ink,3);ell(c,bx,s.y+142,32,9,P.ember,null)}
  box(c,cx+76,cy-10,96,20,8,P.woodDark,P.ink,3);
  ell(c,cx,cy+8,92,54,'#22282D',P.ink,4);ell(c,cx,cy,92,50,P.pan,P.panHi,4);ell(c,cx,cy,76,38,'#2B3238',null);
  if(d&&d.picked.length){const sw=Math.sin(state.now/220)*12;d.picked.forEach((id,i)=>{const a=(i/d.picked.length)*Math.PI*2+state.now/1400;drawFood(c,ing(id),cx+Math.cos(a)*35,cy+Math.sin(a)*17+sw*.2,15,a)})}
  else ell(c,cx,cy,44,18,'rgba(255,122,56,.35)',null);
  c.save();c.lineWidth=4;c.lineCap='round';
  for(let i=0;i<3;i++){const sx=cx-30+i*30,phase=(state.now/700+i*.33)%1;
    c.globalAlpha=.42*(1-phase);c.strokeStyle=i===1?'#FFF6E6':P.cream;
    c.beginPath();c.moveTo(sx,cy-26);c.bezierCurveTo(sx-14,cy-50-phase*22,sx+16,cy-72-phase*30,sx,cy-96-phase*34);c.stroke()}
  c.restore();
  if(d&&stepOf(d)==='stir'){c.strokeStyle=P.tealLight;c.lineWidth=4;c.beginPath();c.arc(cx,cy,58,state.now/260,state.now/260+1.6);c.stroke()}
  if(d&&stepOf(d)==='flip')for(let i=0;i<3;i++){const t=(state.now/300+i)%3;c.strokeStyle=P.gold;c.lineWidth=3;c.beginPath();c.arc(cx-40+t*40,cy-t*14,9,.2,2.6);c.stroke()}
  txt(c,d?stepOf(d).toUpperCase()+'  '+count(d):'PAN READY',cx,s.y+8,16,P.cream,800,'center');
  if(d){if(d.steps.includes('chop'))pips(c,s.x+18,s.y+s.h-14,d.progress.chop,TIMER.chopGoal,P.orange);
    if(d.steps.includes('stir'))pips(c,s.x+18,s.y+s.h-32,d.progress.stir,TIMER.stirGoal,P.tealLight);
    if(d.steps.includes('flip'))pips(c,s.x+150,s.y+s.h-14,d.progress.flip,TIMER.flipGoal,P.gold)}
}

function plate(c,state){
  const p=L.plate,cx=p.x+p.w/2,cy=p.y+p.h/2,d=state.plated;
  ell(c,cx,cy+8,82,56,P.shadow,null);ell(c,cx,cy,82,58,P.plate,P.plateRim,5);ell(c,cx,cy,62,42,'#F4EEE0',P.plateRim,2);
  if(d){
    const pulse=.5+.5*Math.sin(state.now/260);
    c.save();c.globalAlpha=.35+.45*pulse;c.strokeStyle=P.gold;c.lineWidth=4;c.setLineDash([12,8]);
    c.beginPath();c.ellipse(cx,cy,88+pulse*5,64+pulse*4,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.restore();
    drawFinishedDish(c,d,cx,cy-2,17,state.now);
    txt(c,'READY',cx,p.y-12,18,P.gold,800,'center');txt(c,'CLICK TO SERVE',cx,p.y+p.h+14,13,P.cream,800,'center');
    if(state.plateQuality){const q=state.plateQuality;
      box(c,p.x+8,p.y+16,84,22,11,P.night,q==='PERFECT'?P.teal:P.gold,2);
      txt(c,q,p.x+50,p.y+27,11,q==='PERFECT'?P.tealLight:P.gold,800,'center')}
  }
  else{txt(c,'PLATE',cx,p.y+p.h+16,14,P.cream,700,'center');
    if(state.active&&stepOf(state.active)==='plate')txt(c,'CLICK TO PLATE!',cx,p.y-14,16,P.gold,800,'center')}
}

// The house chef: round face, puffy hat, teal apron, and a tool for the station.
function drawChef(c,state){
  const p=state.player,bob=p.moving?Math.sin(p.step)*2:Math.sin(state.now/420)*1.2;
  const shakeX=state.shake>0?Math.sin(state.now/26)*(state.shake/420)*5:0;
  const swing=Math.sin(state.now/120)*4;
  c.save();c.translate(p.x+shakeX,p.y+bob);c.scale(p.facing,1);
  ell(c,0,3,32,9,P.shadow,null);
  const stride=p.moving?Math.sin(p.step)*7:0;
  box(c,-18,-26+stride,13,28,5,P.teal,P.ink,2);box(c,6,-26-stride,13,28,5,P.teal,P.ink,2);
  ell(c,-12,2,10,5,P.ink,null);ell(c,12,2,10,5,P.ink,null);
  const ag=c.createLinearGradient(-25,-78,25,-24);ag.addColorStop(0,'#FFF8E8');ag.addColorStop(1,'#D8B991');
  box(c,-25,-78,50,54,12,ag,P.ink,3);
  box(c,-18,-70,36,42,8,P.cream,P.tealLight,2);
  box(c,-30,-72+swing,12,34,6,'#F2C79C',P.ink,2);box(c,18,-72-swing,12,34,6,'#F2C79C',P.ink,2);
  if(p.tool==='knife'){box(c,26,-92,7,34,2,'#E8EDF0',P.ink,2);box(c,23,-60,13,16,4,P.woodDark,P.ink,2)}
  else if(p.tool==='spatula'){box(c,26,-96,6,38,2,'#E8EDF0',P.ink,2);box(c,19,-104,20,10,3,P.panHi,P.ink,2)}
  else ell(c,28,-62,16,6,P.plate,P.plateRim,2);
  ell(c,0,-98,20,19,'#F2C79C',P.ink,3);
  ell(c,-7,-101,2.5,3,P.ink,null);ell(c,7,-101,2.5,3,P.ink,null);
  ell(c,-14,-94,4,3,'rgba(232,103,46,.45)',null);ell(c,14,-94,4,3,'rgba(232,103,46,.45)',null);
  c.strokeStyle=P.ink;c.lineWidth=2;c.beginPath();c.arc(0,-96,7,.15,Math.PI-.15);c.stroke();
  c.fillStyle=P.orange;c.beginPath();c.moveTo(-12,-82);c.lineTo(12,-82);c.lineTo(0,-68);c.closePath();c.fill();
  box(c,-21,-128,42,13,5,P.cream,P.ink,3);
  ell(c,-13,-136,13,11,P.cream,P.ink,2);ell(c,0,-141,15,12,P.cream,P.ink,2);ell(c,13,-136,13,11,P.cream,P.ink,2);
  c.restore()
}

// Each ticket's arrow slides from the board toward the chef as its timer drains.
function pursuitRails(c,state){
  const p=state.player;
  let warnings=0,anyHot=false;
  state.orders.forEach((order,i)=>{
    const t={x:L.ticket.x,y:L.ticket.y+i*(L.ticket.h+L.ticket.gap)};
    const ratio=Math.max(0,order.remaining/order.total),urgent=ratio<.25,pr=order.pursuit||0;
    const sx=t.x+10,sy=t.y+76,ex=p.x,ey=p.y-58;
    const bx=sx+(ex-sx)*pr,by=sy+(ey-sy)*pr;
    c.save();c.globalAlpha=.32+pr*.34;c.strokeStyle=urgent?P.red:P.orange;c.lineWidth=urgent?3:2;
    c.setLineDash([9,7]);c.beginPath();c.moveTo(sx,sy);c.lineTo(bx,by);c.stroke();c.setLineDash([]);
    c.globalAlpha=.16;c.strokeStyle=P.cream;c.lineWidth=2;c.beginPath();c.moveTo(bx,by);c.lineTo(ex,ey);c.stroke();
    c.globalAlpha=1;c.fillStyle=urgent?P.red:P.gold;
    c.save();c.translate(bx,by);c.rotate(Math.atan2(ey-sy,ex-sx));
    c.beginPath();c.moveTo(11,0);c.lineTo(-7,-7);c.lineTo(-7,7);c.closePath();c.fill();
    c.strokeStyle=P.ink;c.lineWidth=1.5;c.stroke();c.restore();
    if(pr>.62||urgent){warnings++;if(urgent)anyHot=true}
    c.restore()
  })
  // One callout in empty wall space: never over the chef, plate, pan or tickets.
  if(warnings)txt(c,(anyHot?'! ':'')+warnings+' CLOSING IN',44,104,13,anyHot?P.red:P.gold,800,'left')
}

function orders(c,state){
  const o=L.order;
  box(c,o.x-12,o.y-34,o.w+24,o.h+48,14,P.woodDark,P.ink,5);
  box(c,o.x,o.y,o.w,o.h,10,'#6E4B32',null);
  txt(c,'ORDERS',o.x+o.w/2,o.y-14,24,P.cream,800,'center');
  if(!state.orders.length)txt(c,'ALL CAUGHT UP',o.x+o.w/2,o.y+o.h/2,20,P.grout,700,'center');
  state.orders.slice(0,3).forEach((order,i)=>{
    const t={x:L.ticket.x,y:L.ticket.y+i*(L.ticket.h+L.ticket.gap),w:L.ticket.w,h:L.ticket.h};
    const chosen=i===state.selected,r=Math.max(0,order.remaining/order.total);
    const bar=r>.55?P.teal:r>.25?P.gold:P.red;
    if(r<.25){c.shadowColor=P.red;c.shadowBlur=18}
    box(c,t.x,t.y,t.w,t.h,10,chosen?'#FFFDF4':'#F3E8D2',r<.25?P.red:chosen?P.gold:P.ink,chosen?5:3);
    c.shadowBlur=0;
    ell(c,t.x+18,t.y+18,8,8,chosen?P.orange:P.woodDark,P.ink,2);
    txt(c,'#'+order.id,t.x+36,t.y+19,14,P.inkSoft,800);
    txt(c,Math.ceil(order.remaining/1000)+'s',t.x+t.w-16,t.y+19,15,bar,800,'right');
    txt(c,order.name,t.x+16,t.y+48,19,P.ink,800);
    order.items.forEach((id,k)=>{const g=ing(id);ell(c,t.x+24+k*26,t.y+82,10,10,g.color,P.ink,2);drawFood(c,g,t.x+24+k*26,t.y+82,6)});
    txt(c,'+'+order.worth,t.x+t.w-16,t.y+82,15,P.teal,800,'right');
    const pulse=r<.25?.72+.28*Math.sin(state.now/110):1;
    if(r<.25){c.shadowColor=P.red;c.shadowBlur=14*pulse}
    box(c,t.x+16,t.y+108,t.w-32,14,6,'#D9C9AC',null);
    box(c,t.x+16,t.y+108,Math.max(4,(t.w-32)*r),14,6,bar,null);c.shadowBlur=0;
    txt(c,order.steps.join(' > ').toUpperCase(),t.x+16,t.y+134,12,P.inkSoft,700);
    if(chosen){c.fillStyle=P.gold;c.beginPath();c.moveTo(t.x-18,t.y+56);c.lineTo(t.x-2,t.y+46);c.lineTo(t.x-2,t.y+66);c.closePath();c.fill()}
  })
}

export function drawKitchen(c,state){
  c.clearRect(0,0,L.width,L.height);wall(c);
  c.fillStyle='#2B1F1A';c.fillRect(916,0,L.width-916,L.height);
  c.save();if(state.shake>0)c.translate(Math.sin(state.now/24)*(state.shake/420)*5,0);
  counter(c);bins(c,state);board(c,state);stove(c,state);plate(c,state);orders(c,state);
  pursuitRails(c,state);drawChef(c,state);c.restore()
}

export function drawHUD(c,state){
  box(c,0,0,L.width,L.hud.h,0,P.night,null);
  txt(c,'SIMMER & SERVE',22,30,25,P.cream,800);
  txt(c,'SCORE',360,18,12,P.grout,700);txt(c,String(state.score).padStart(5,'0'),360,40,27,P.gold,800);
  txt(c,'SERVED '+state.served,520,30,15,P.cream,800);txt(c,'COMBO x'+state.combo,650,30,17,state.combo>1?P.orangeLight:P.grout,800);
  if(state.combo>1){const bx=300,by=70,bw=170,bh=38;
    c.save();c.globalAlpha=.62+.38*(.5+.5*Math.sin(state.now/140));
    box(c,bx,by,bw,bh,12,P.night,P.orange,3);
    txt(c,'COMBO x'+state.combo,bx+bw/2,by+19,19,P.gold,800,'center');
    c.fillStyle=P.cream;c.beginPath();c.moveTo(bx+14,by+8);c.lineTo(bx+17,by+15);
    c.lineTo(bx+24,by+18);c.lineTo(bx+17,by+21);c.lineTo(bx+14,by+28);
    c.lineTo(bx+11,by+21);c.lineTo(bx+4,by+18);c.lineTo(bx+11,by+15);c.closePath();c.fill();c.restore()}
  txt(c,'RUSH',810,18,12,P.grout,700);box(c,810,30,150,14,7,'#4A3830',null);
  box(c,810,30,Math.max(4,150*state.rush/100),14,7,state.rush>66?P.red:state.rush>33?P.gold:P.teal,null);
  const sat=Math.max(0,Math.min(100,state.satisfaction||0)),satCol=sat>60?P.teal:sat>30?P.gold:P.red;
  txt(c,'SATISFACTION '+Math.round(sat)+'%',1000,12,12,satCol,800);
  box(c,1000,24,215,17,8,'#4A3830',null);
  box(c,1000,24,Math.max(5,215*sat/100),17,8,satCol,null);
  ell(c,1245,32,15,15,P.gold,P.ink,2);
  ell(c,1240,29,2,2.5,P.ink,null);ell(c,1250,29,2,2.5,P.ink,null);
  c.strokeStyle=P.ink;c.lineWidth=2;c.beginPath();
  if(sat>55)c.arc(1245,33,6,.15,Math.PI-.15);else c.arc(1245,43,6,Math.PI+.15,Math.PI*2-.15);
  c.stroke();
  if(state.rush>66){c.globalAlpha=(.5+.5*Math.sin(state.now/220))*.16;c.fillStyle=P.red;c.fillRect(0,62,L.width,6);c.globalAlpha=1}
  const y=L.footer.y,order=selectedOrder(state);
  box(c,0,y,L.width,L.footer.h,0,P.night,null);
  txt(c,'NOW COOKING',22,y+24,13,P.grout,700);txt(c,order?order.name.toUpperCase():'WAITING FOR ORDERS',22,y+54,23,P.cream,800);
  const s=state.active?stepOf(state.active):'pick';
  const hint=s==='pick'?'CLICK THE HIGHLIGHTED BINS IN RECIPE ORDER':s==='chop'?'CLICK / DRAG THE CHOPPING BOARD':s==='stir'?'DRAG IN CIRCLES INSIDE THE PAN':s==='flip'?'PRESS SPACE OR CLICK THE PAN TO FLIP':state.plated?'CLICK THE PLATE TO SERVE':'CLICK THE PLATE TO PLATE THE DISH';
  txt(c,hint,22,y+84,15,P.gold,700);
  txt(c,'WASD / ARROWS MOVE CHEF   [1][2][3] TICKETS   SPACE FLIP   ENTER SERVE',L.width-22,y+30,13,P.grout,700,'right');
  txt(c,'CHOP  >  STIR  >  FLIP  >  PLATE  >  SERVE',L.width-22,y+60,14,P.tealLight,700,'right');
  if(state.toast&&state.toast.until>state.now){const t=state.toast,w=250+t.text.length,tx=t.x??680,ty=t.y??230;
    box(c,tx-w/2,ty-20,w,40,12,P.night,t.color,3);txt(c,t.text,tx,ty,20,t.color,800,'center')}
  if(state.lastServe&&state.lastServe.until>state.now)txt(c,'+'+state.lastServe.points,520,y+84,22,P.gold,800)
}

export function drawParticles(c,state){
  if(state.expiryFlash>0){c.globalAlpha=(state.expiryFlash/520)*.28;c.fillStyle=P.red;
    c.fillRect(0,L.hud.h,L.width,L.footer.y-L.hud.h);c.globalAlpha=1}
  for(const f of state.flashes){const a=Math.max(0,f.life/f.maxLife);c.globalAlpha=a*.75;c.strokeStyle=f.color;c.lineWidth=5;
    c.beginPath();c.arc(f.x,f.y,f.r*(1.4-a*.4),0,Math.PI*2);c.stroke();c.globalAlpha=a*.16;c.fillStyle=f.color;c.fill()}
  c.globalAlpha=1;
  for(const p of state.particles){const a=Math.max(0,p.life/p.maxLife);c.save();c.globalAlpha=a;c.translate(p.x,p.y);c.rotate(p.spin);
    c.fillStyle=p.color;c.strokeStyle=P.ink;c.lineWidth=1.5;rr(c,-p.size/2,-p.size/2,p.size,p.size,p.size*.3);c.fill();c.stroke();c.restore()}
  c.globalAlpha=1
}

export function render(c,state,overlays={}){
  drawKitchen(c,state);
  // Drop the recipe strip below the jar shelf without covering bins or the board.
  if(overlays.recipeBoard){c.save();c.translate(0,12);overlays.recipeBoard(c,state);c.restore()}
  if(overlays.customers)overlays.customers(c,state);
  drawParticles(c,state);drawHUD(c,state)
}
