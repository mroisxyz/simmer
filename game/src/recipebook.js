// recipebook.js — a small reference strip on the wall: ingredient dots point to a
// dish name and its prep order, proving that recipes combine in different ways.

import { PALETTE as P, RECIPES, ingredientById } from './config.js';

function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function box(c,x,y,w,h,r,f,s=P.ink,lw=2){rr(c,x,y,w,h,r);c.fillStyle=f;c.fill();if(s){c.lineWidth=lw;c.strokeStyle=s;c.stroke()}}
function ell(c,x,y,rx,ry,f,s,lw=1.5){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=f;c.fill();if(s){c.lineWidth=lw;c.strokeStyle=s;c.stroke()}}
function txt(c,t,x,y,z,col,w=700,a='left'){c.font=w+' '+z+'px system-ui,"Segoe UI",sans-serif';c.textAlign=a;c.textBaseline='middle';c.fillStyle=col;c.fillText(t,x,y)}

export function drawRecipeBoard(c, state) {
  const ids = state.recipeBoard || ['sunrise', 'harbor', 'cloud'];
  txt(c, 'RECIPE BOARD', 36, 190, 10, P.inkSoft, 800);
  ids.slice(0, 3).forEach((id, i) => {
    const recipe = RECIPES.find((r) => r.id === id) || RECIPES[i];
    if (!recipe) return;
    const x = 36 + i * 164, y = 196, w = 158, h = 50;
    box(c, x, y, w, h, 8, '#FFF8E8', P.woodDark, 2.5);
    box(c, x + 3, y + 3, w - 6, 13, 4, recipe.color, null);
    txt(c, recipe.name, x + 8, y + 10, 9, P.cream, 800);
    recipe.items.forEach((item, k) => {
      const g = ingredientById(item);
      ell(c, x + 16 + k * 20, y + 29, 6, 6, g.color, P.ink, 1.5);
      ell(c, x + 14 + k * 20, y + 27, 2, 2, 'rgba(255,255,255,0.8)', null);
      if (k < recipe.items.length - 1) txt(c, '+', x + 26 + k * 20, y + 29, 9, P.inkSoft, 800, 'center');
    });
    txt(c, '›', x + 94, y + 29, 13, P.orange, 800, 'center');
    txt(c, 'DISH', x + 110, y + 29, 9, P.ink, 800, 'center');
    txt(c, recipe.steps.map((s) => s.toUpperCase()).join(' › '), x + 8, y + 43, 8, P.inkSoft, 700);
  });
}
