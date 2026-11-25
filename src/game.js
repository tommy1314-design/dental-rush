// 遊戲主程式：移動、車流、任務流程、繪圖
{
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
let W=0,H=0;
function resize(){const d=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;cv.style.width=W+'px';cv.style.height=H+'px';ctx.setTransform(d,0,0,d,0,0);}
addEventListener('resize',resize);resize();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
const WW=MAP.W,WH=MAP.H,FONT='"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';

/* ---------- map data ---------- */
const toPts=f=>{const p=[];for(let i=0;i<f.length;i+=2)p.push([f[i],f[i+1]]);return p;};
const bbox=p=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const[x,y]of p){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}return[x0,y0,x1,y1];};
const roads=MAP.roads.map(([t,w,o,n,f])=>{const p=toPts(f);let len=0;for(let i=1;i<p.length;i++)len+=dist(p[i-1][0],p[i-1][1],p[i][0],p[i][1]);return{t,w,o,n,p,len,car:t!=='pedestrian',bb:bbox(p)};});
roads.sort((a,b)=>a.w-b.w);
const PAL=['#e6d3b3','#d9c7a7','#cdbfae','#e3c9b8','#d4d0c3','#c9b9a6','#e8dcc8','#d8cdb8'];
const blds=MAP.blds.map(([h,n,f,med],i)=>{const p=toPts(f);const bb=bbox(p);let cx=0,cy=0;for(const q of p){cx+=q[0];cy+=q[1];}
 return{h:h||Math.min(8,2+((i*7)%5)),n,p,bb,cx:cx/p.length,cy:cy/p.length,c:med?'#f1eee8':PAL[i%PAL.length],med};});
const green=MAP.green.map(f=>{const p=toPts(f);return{p,bb:bbox(p)};}),water=MAP.water.map(f=>{const p=toPts(f);return{p,bb:bbox(p)};});
const trees=MAP.trees;
const LOC=MAP.loc;for(const k in LOC){LOC[k].bld=blds[LOC[k].b];}
const STATIONS=MAP.stations.map(s=>({n:s.n,x:s.p[0],y:s.p[1]}));

/* spatial grids */
const CS=256,GW=Math.ceil(WW/CS)+1;
function mkGrid(items,bbf){const g=new Map();items.forEach((it,i)=>{const[x0,y0,x1,y1]=bbf(it);for(let cx=Math.floor(x0/CS);cx<=Math.floor(x1/CS);cx++)for(let cy=Math.floor(y0/CS);cy<=Math.floor(y1/CS);cy++){const k=cy*GW+cx;if(!g.has(k))g.set(k,[]);g.get(k).push(i);}});return g;}
const bGrid=mkGrid(blds,b=>b.bb);
const segs=[];roads.forEach((r,ri)=>{if(!r.car)return;for(let i=1;i<r.p.length;i++)segs.push({ri,a:r.p[i-1],b:r.p[i],hw:r.w/2});});
const sGrid=mkGrid(segs,s=>[Math.min(s.a[0],s.b[0])-s.hw,Math.min(s.a[1],s.b[1])-s.hw,Math.max(s.a[0],s.b[0])+s.hw,Math.max(s.a[1],s.b[1])+s.hw]);
const vGrid=new Map();roads.forEach((r,ri)=>{if(!r.car)return;r.p.forEach((q,k)=>{const key=Math.floor(q[1]/CS)*GW+Math.floor(q[0]/CS);if(!vGrid.has(key))vGrid.set(key,[]);vGrid.get(key).push([ri,k]);});});
const near=(g,x,y)=>g.get(Math.floor(y/CS)*GW+Math.floor(x/CS))||[];
function segDist(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy||1e-9;const t=clamp(((x-a[0])*dx+(y-a[1])*dy)/L,0,1);return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
function onRoad(x,y){for(const i of near(sGrid,x,y)){const s=segs[i];if(segDist(x,y,s.a,s.b)<s.hw)return true;}return false;}
function pip(x,y,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])c=!c;}return c;}
function inBld(x,y,m){for(const i of near(bGrid,x,y)){const b=blds[i];if(x<b.bb[0]-m||x>b.bb[2]+m||y<b.bb[1]-m||y>b.bb[3]+m)continue;if(pip(x,y,b.p))return true;if(m>0){const p=b.p;for(let k=0,j=p.length-1;k<p.length;j=k++)if(segDist(x,y,p[j],p[k])<m)return true;}}return false;}
function pushPoly(o,p,rad){const inside=pip(o.x,o.y,p);let best=1e9,bx=0,by=0;
 for(let k=0,j=p.length-1;k<p.length;j=k++){const a=p[j],b=p[k],dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy||1e-9,t=clamp(((o.x-a[0])*dx+(o.y-a[1])*dy)/L,0,1),qx=a[0]+t*dx,qy=a[1]+t*dy,d=Math.hypot(o.x-qx,o.y-qy);if(d<best){best=d;bx=qx;by=qy;}}
 if(inside){const d=best||1e-6;o.x=bx+(bx-o.x)/d*rad;o.y=by+(by-o.y)/d*rad;return true;}
 if(best<rad){const d=best||1e-6;o.x=bx+(o.x-bx)/d*rad;o.y=by+(o.y-by)/d*rad;return true;}return false;}
function collideWorld(o,rad){let hit=false;
 for(let pass=0;pass<2;pass++)for(const i of near(bGrid,o.x,o.y)){const b=blds[i];if(o.x<b.bb[0]-rad||o.x>b.bb[2]+rad||o.y<b.bb[1]-rad||o.y>b.bb[3]+rad)continue;if(pushPoly(o,b.p,rad))hit=true;}
 for(const w of water){if(o.x>w.bb[0]-rad&&o.x<w.bb[2]+rad&&o.y>w.bb[1]-rad&&o.y<w.bb[3]+rad&&pushPoly(o,w.p,rad))hit=true;}
 o.x=clamp(o.x,rad,WW-rad);o.y=clamp(o.y,rad,WH-rad);return hit;}
function freePoint(noRoad){for(let k=0;k<400;k++){const x=rnd(80,WW-80),y=rnd(80,WH-80);if(!inBld(x,y,14)&&!(noRoad&&onRoad(x,y))&&!water.some(w=>pip(x,y,w.p)))return[x,y];}return LOC.dental.d.slice();}

/* ---------- cars (follow OSM road graph) ---------- */
const carCols=['#e84a5f','#2a9df4','#f9c80e','#f86624','#43bccd','#ffffff','#662e9b','#3bb273','#1d1f24'];
const carRoads=roads.map((r,i)=>i).filter(i=>roads[i].car&&roads[i].p.length>1);
const totLen=carRoads.reduce((s,i)=>s+roads[i].len,0);
function placeCar(c){let r=Math.random()*totLen,ri=carRoads[0];for(const i of carRoads){r-=roads[i].len;if(r<=0){ri=i;break;}}
 const R=roads[ri];const dir=(R.o||Math.random()<.5)?1:-1;const n=R.p.length-1;const i=dir>0?Math.floor(Math.random()*n):1+Math.floor(Math.random()*n);Object.assign(c,{ri,i,dir,s:0});}
const cars=[];const NC=Math.min(170,Math.round(totLen/260));
for(let k=0;k<NC;k++){const bus=Math.random()<.12;const c={sp:bus?95:rnd(130,210),l:bus?110:56,w:bus?34:28,c:bus?'#2b8a3e':pick(carCols),bus,x:0,y:0,a:0};placeCar(c);c.s=Math.random()*20;cars.push(c);}
function nextRoad(c){const R=roads[c.ri],E=R.p[c.i];const cand=[];
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const[rj,k]of (vGrid.get((Math.floor(E[1]/CS)+dy)*GW+Math.floor(E[0]/CS)+dx)||[])){if(rj===c.ri)continue;const Q=roads[rj];if(dist(E[0],E[1],Q.p[k][0],Q.p[k][1])>14)continue;
  if(k<Q.p.length-1)cand.push([rj,k,1]);if(k>0&&!Q.o)cand.push([rj,k,-1]);}
 if(cand.length){const[rj,k,d]=pick(cand);c.ri=rj;c.i=k;c.dir=d;c.s=0;return;}
 if(!R.o){c.dir=-c.dir;c.s=0;return;}placeCar(c);}
function updCar(c,dt){let R=roads[c.ri];let A=R.p[c.i],B=R.p[c.i+c.dir];
 if(!B){nextRoad(c);R=roads[c.ri];A=R.p[c.i];B=R.p[c.i+c.dir];if(!B){placeCar(c);return;}}
 let L=dist(A[0],A[1],B[0],B[1]);c.s+=c.sp*dt;let guard=0;
 while(c.s>=L&&guard++<20){c.s-=L;c.i+=c.dir;R=roads[c.ri];if(!R.p[c.i+c.dir]){const keep=c.s;nextRoad(c);c.s=keep;R=roads[c.ri];}A=R.p[c.i];B=R.p[c.i+c.dir];if(!B){placeCar(c);return;}L=dist(A[0],A[1],B[0],B[1]);}
 const ux=(B[0]-A[0])/(L||1),uy=(B[1]-A[1])/(L||1);const off=R.o?0:Math.min(R.w*.25,40);
 const tx=A[0]+ux*c.s-uy*off,ty=A[1]+uy*c.s+ux*off;
 if(c.x===0&&c.y===0){c.x=tx;c.y=ty;}else{c.x+=(tx-c.x)*Math.min(1,dt*12);c.y+=(ty-c.y)*Math.min(1,dt*12);}
 const ta=Math.atan2(uy,ux);let da=ta-c.a;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;c.a+=da*Math.min(1,dt*10);}

/* ---------- entities ---------- */
const scooters=MAP.scooters.map(([x,y])=>({x,y,a:Math.random()*6.28,c:pick(['#ff2e88','#3fa7ff','#ffd43b','#f8f9fa','#51cf66'])}));
const peds=[];for(let i=0;i<70;i++){const[x,y]=freePoint(true);peds.push({x,y,a:rnd(0,6.28),t:rnd(1,4),down:0,coat:Math.random()<.45,c:pick(['#4dabf7','#ff8787','#ffd43b','#63e6be','#b197fc','#ffa94d'])});}
let teeth=[];function spawnTeeth(){teeth=[];for(let i=0;i<32;i++){const[x,y]=freePoint(false);teeth.push({x,y,ph:rnd(0,6)});}}

/* ---------- 牙科部二樓（室內地圖，資料在 src/floor2.js） ---------- */
const F2=window.FLOOR2,FS=F2.scale;
const IN={W:0,H:0,walk:[],obst:[],rooms:{},deco:[],npcs:{},peds:[],stairs:F2.stairs.map(v=>v*FS)};
{const sr=r=>r.map(v=>v*FS);let mx=0,my=0;
 for(const c of F2.corridor){const r=sr(c);IN.walk.push(r);mx=Math.max(mx,r[2]);my=Math.max(my,r[3]);}
 for(const k in F2.rooms){const R=F2.rooms[k],r=sr(R.r),[side,at]=R.door,a=at*FS,h=18*FS,g=14*FS;let d;
  if(side==='t')d=[a-h,r[1]-g,a+h,r[1]+4];else if(side==='b')d=[a-h,r[3]-4,a+h,r[3]+g];else if(side==='l')d=[r[0]-g,a-h,r[0]+4,a+h];else d=[r[2]-4,a-h,r[2]+g,a+h];
  IN.rooms[k]={...R,k,r,d};IN.walk.push(r,d);mx=Math.max(mx,r[2]);my=Math.max(my,r[3]);
  const[x0,y0,x1,y1]=r,w=x1-x0,cx=(x0+x1)/2,cy=(y0+y1)/2;
  if(R.kind==='clinic'){const n=Math.max(1,Math.floor(w/150));for(let i=0;i<n;i++){const x=x0+w*(i+.5)/n;IN.obst.push([x-24,y1-150,x+24,y1-36]);IN.deco.push({t:'chair',x,y:y1-93});}}
  else if(R.kind==='lab'){IN.obst.push([x0+8,y1-62,x1-8,y1-8]);IN.deco.push({t:'bench',r:[x0+8,y1-62,x1-8,y1-8]});}
  else if(R.kind==='wait'){IN.obst.push([x0+8,y0+40,x0+46,y1-50]);IN.deco.push({t:'seats',r:[x0+8,y0+40,x0+46,y1-50]});}
  else if(R.kind==='or'){IN.obst.push([cx-34,cy+20,cx+34,cy+190]);IN.deco.push({t:'table',x:cx,y:cy+105});IN.obst.push([x1-60,y0+30,x1-14,y0+110]);IN.deco.push({t:'cart',r:[x1-60,y0+30,x1-14,y0+110]});}}
 IN.W=mx+60;IN.H=my+60;}
const inR=(x,y,r)=>x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3];
const RING=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[.7,-.7],[-.7,.7],[-.7,-.7]];
function inFree(x,y,rad){for(const[a,b]of RING){const px=x+a*rad,py=y+b*rad;if(!IN.walk.some(r=>inR(px,py,r))||IN.obst.some(r=>inR(px,py,r)))return false;}return true;}
function moveIn(o,dx,dy,rad){let hit=false;if(inFree(o.x+dx,o.y,rad))o.x+=dx;else hit=true;if(inFree(o.x,o.y+dy,rad))o.y+=dy;else hit=true;return hit;}
function roomOf(x,y){for(const k in IN.rooms)if(inR(x,y,IN.rooms[k].r))return IN.rooms[k];return null;}
function initFloor(){IN.npcs={};for(const k in F2.npcs){const N=F2.npcs[k],r=IN.rooms[N.room].r;
  IN.npcs[k]={...N,k,c:N.c||'#4dabf7',x:(r[0]+r[2])/2+(N.room==='wait'?20:0),y:r[1]+(N.room==='or'?150:N.room==='lab'?140:105),a:Math.PI/2};}
 IN.peds=[];const cor=IN.walk[0];for(let i=0;i<4;i++)IN.peds.push({x:rnd(cor[0]+60,cor[2]-60),y:(cor[1]+cor[3])/2,a:pick([0,Math.PI]),t:rnd(1,4),coat:Math.random()<.5,c:pick(['#ffa94d','#b197fc','#ff8787'])});}
let scene='out',sq=null,sqDone=new Set(),trail=[];
const sqStep=()=>sq?sq.q.steps[sq.i]:null;
const sqAvail=k=>F2.sideQuests.find(q=>q.giver===k&&!sqDone.has(q.id));
function enterFloor(){if(P.ride>=0)toggleRide();scene='in';P.x=IN.stairs[0];P.y=IN.stairs[1]-50;P.vx=P.vy=0;trail=[];
 toast('牙科部 2F・找頭上有 ! 的人接支線','#ffe14d');}
function exitFloor(){const s=sqStep();if(s&&s.follow){toast(`${IN.npcs[s.follow].n}還跟著你，先帶到目的地`,'#ffa94d');return;}
 scene='out';P.x=LOC.dental.d[0];P.y=LOC.dental.d[1];P.vx=P.vy=0;P.inv=1.5;collideWorld(P,13);toast('回到一樓門口');}
function nearNPC(){let best=null,bd=60;const f=sqStep()&&sqStep().follow;for(const k in IN.npcs){if(k===f)continue;const n=IN.npcs[k],d=dist(P.x,P.y,n.x,n.y);if(d<bd){bd=d;best=n;}}return best;}
function talk(n){const q=sqAvail(n.k);
 if(q&&!sq){sq={q,i:0};trail=[];toast(`${n.n}：${q.ask}`,'#fff',4.5);toast('接下支線：'+q.t,'#b197fc',4.5);return;}
 if(q&&sq&&sq.q!==q){toast(`先把「${sq.q.t}」做完吧`,'#ffa94d');return;}
 toast(n.n+'：'+pick(n.idle));}
function act(){if(state!=='play')return;
 if(scene==='in'){if(dist(P.x,P.y,IN.stairs[0],IN.stairs[1])<70){exitFloor();return;}const n=nearNPC();if(n){talk(n);return;}toast('附近沒有人可以說話');return;}
 if(P.ride<0&&dist(P.x,P.y,LOC.dental.d[0],LOC.dental.d[1])<60){enterFloor();return;}
 toggleRide();}
function actLabel(){if(scene==='in')return dist(P.x,P.y,IN.stairs[0],IN.stairs[1])<70?'下樓':nearNPC()?'對話':'E';
 if(P.ride>=0)return'下車';return dist(P.x,P.y,LOC.dental.d[0],LOC.dental.d[1])<60?'進 2F':'上車';}
function updateIn(dt){
 let[ix,iy]=inputVec();if(P.stun>0){P.stun-=dt;ix=iy=0;}P.inv=Math.max(0,P.inv-dt);
 P.vx+=(ix*165-P.vx)*Math.min(1,12*dt);P.vy+=(iy*165-P.vy)*Math.min(1,12*dt);
 const ox=P.x,oy=P.y;moveIn(P,P.vx*dt,P.vy*dt,12);if(Math.hypot(P.vx,P.vy)>25)P.a=Math.atan2(P.vy,P.vx);
 const s=sqStep(),fk=s&&s.follow;
 const solid=[...Object.values(IN.npcs).filter(n=>n.k!==fk),...IN.peds];
 for(const n of solid){const d=dist(P.x,P.y,n.x,n.y);if(d<24&&d>0){const nx=P.x+(P.x-n.x)/d*(24-d),ny=P.y+(P.y-n.y)/d*(24-d);if(inFree(nx,ny,12)){P.x=nx;P.y=ny;}}}
 if(!trail.length||dist(P.x,P.y,trail[trail.length-1][0],trail[trail.length-1][1])>8){trail.push([P.x,P.y]);if(trail.length>60)trail.shift();}
 for(const p of IN.peds){p.t-=dt;if(p.t<0){p.a=pick([0,Math.PI,Math.PI/2,-Math.PI/2,rnd(0,6.28)]);p.t=rnd(1.5,4);}
  if(moveIn(p,Math.cos(p.a)*50*dt,Math.sin(p.a)*50*dt,11)){p.a+=Math.PI*rnd(.5,1.5);p.t=rnd(1,3);}
  if(roomOf(p.x,p.y)&&Math.random()<dt*.5)p.a=Math.atan2(IN.walk[0][1]+80-p.y,p.x<IN.W/2?1:-1);}
 for(const k in IN.npcs){const n=IN.npcs[k];if(k===fk)continue;n.a=Math.atan2(P.y-n.y,P.x-n.x);}
 if(fk&&trail.length>1){const f=IN.npcs[fk];let t=trail[0];for(let i=trail.length-1;i>=0;i--)if(dist(trail[i][0],trail[i][1],P.x,P.y)>=40){t=trail[i];break;}const d=dist(f.x,f.y,t[0],t[1]);if(d>2){const m=Math.min(d,260*dt);f.x+=(t[0]-f.x)/d*m;f.y+=(t[1]-f.y)/d*m;f.a=Math.atan2(t[1]-f.y,t[0]-f.x);}}
 if(s){const tg=IN.npcs[s.to];if(dist(P.x,P.y,tg.x,tg.y)<55&&(!fk||dist(IN.npcs[fk].x,IN.npcs[fk].y,P.x,P.y)<110)){
  toast(s.say,'#8ce99a',3.5);if(fk){const f=IN.npcs[fk];f.x=tg.x+(tg.x>IN.W-200?-40:40);f.y=tg.y+30;}
  sq.i++;trail=[];if(sq.i>=sq.q.steps.length){money+=sq.q.reward;sqDone.add(sq.q.id);toast(`支線完成「${sq.q.t}」+NT$${sq.q.reward}`,'#ffe14d');
   if(sqDone.size===F2.sideQuests.length){money+=F2.allDoneReward;toast(`二樓支線全破！+NT$${F2.allDoneReward}`,'#ffe14d',4);}sq=null;}}}
}

const MT=window.MISSIONS;
const RANKS=window.RANKS;
const rankOf=n=>{let r=RANKS[0][1];for(const[k,v]of RANKS)if(n>=k)r=v;return r;};

let P,mis,misGap,lastMT,stars,calm,chasers,money,cases,gotTeeth,pedHits,toasts,shake,state='title',best=0;
try{best=+localStorage.getItem('dentalRushBest')||0}catch(e){}
function reset(){P={x:LOC.dental.d[0],y:LOC.dental.d[1],vx:0,vy:0,a:0,ride:-1,stun:0,inv:3};collideWorld(P,13);
 mis=null;misGap=1.5;lastMT=null;scene='out';sq=null;sqDone=new Set();trail=[];initFloor();stars=0;calm=0;chasers=[];money=200;cases=0;gotTeeth=0;pedHits=0;toasts=[];shake=0;spawnTeeth();}
reset();
function toast(t,c,l){toasts.push({t,c:c||'#fff',life:l||2.6});if(toasts.length>4)toasts.shift();}
function setStars(n){n=clamp(n,0,5);if(n>stars)toast('★ 教授關注度上升！','#ffd43b');stars=n;calm=0;
 const want=Math.max(0,Math.min(3,stars-2));const had=chasers.length;
 const[ox,oy]=scene==='in'?LOC.dental.d:[P.x,P.y];
 while(chasers.length<want){let x,y,k=0;do{const a=rnd(0,6.28);x=clamp(ox+Math.cos(a)*700,40,WW-40);y=clamp(oy+Math.sin(a)*700,40,WH-40);k++;}while(inBld(x,y,14)&&k<60);chasers.push({x,y,lx:x,ly:y,stuck:0,side:1});}
 while(chasers.length>want)chasers.pop();if(chasers.length>had)toast('總醫師出動了，快跑！','#ff6b6b');}
function newMission(){let t;do t=pick(MT);while(t===lastMT);lastMT=t;
 const f=LOC[t.from].d,to=LOC[t.to].d,o=scene==='in'?LOC.dental.d:[P.x,P.y];const d=dist(o[0],o[1],f[0],f[1])+dist(f[0],f[1],to[0],to[1]);
 const tm=Math.round(d/260+16);mis={...t,phase:0,time:tm,max:tm};toast('新任務：'+t.t,'#ff8fc0');}
function toggleRide(){if(state!=='play')return;
 if(P.ride>=0){const s=scooters[P.ride];P.ride=-1;s.x=P.x;s.y=P.y;s.a=P.a;P.x+=Math.cos(P.a+1.57)*22;P.y+=Math.sin(P.a+1.57)*22;collideWorld(P,13);toast('下車');return;}
 let bi=-1,bd=55;scooters.forEach((s,i)=>{const d=dist(P.x,P.y,s.x,s.y);if(d<bd){bd=d;bi=i;}});
 if(bi<0){const si=STATIONS.findIndex(st=>dist(P.x,P.y,st.x,st.y)<55);
  if(si>=0){const nx=STATIONS[(si+1)%STATIONS.length];if(money<20){toast('錢不夠搭捷運','#ff6b6b');return;}money-=20;P.x=nx.x;P.y=nx.y;P.vx=P.vy=0;collideWorld(P,13);toast(`搭捷運到【${nx.n}】-NT$20`,'#74c0fc');return;}
  toast('附近沒有機車或捷運站');return;}
 P.ride=bi;P.x=scooters[bi].x;P.y=scooters[bi].y;P.a=scooters[bi].a;toast('騎上機車 🛵');}

/* ---------- input ---------- */
const keys={};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if(k==='e'&&!e.repeat)act();if(e.key.startsWith('Arrow')||e.key===' ')e.preventDefault();});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
let touchUI=false;const joy={id:null,ox:0,oy:0,x:0,y:0};const btnPos=()=>[W-78,H-86];
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touchUI=true;if(state!=='play')return;const[bx,by]=btnPos();
 if(touchUI&&dist(e.clientX,e.clientY,bx,by)<48){act();return;}
 if(joy.id===null&&e.pointerType!=='mouse'){joy.id=e.pointerId;joy.ox=joy.x=e.clientX;joy.oy=joy.y=e.clientY;}});
cv.addEventListener('pointermove',e=>{if(e.pointerId===joy.id){joy.x=e.clientX;joy.y=e.clientY;}});
const endJoy=e=>{if(e.pointerId===joy.id)joy.id=null;};cv.addEventListener('pointerup',endJoy);cv.addEventListener('pointercancel',endJoy);
function inputVec(){let x=0,y=0;if(keys.a||keys.arrowleft)x--;if(keys.d||keys.arrowright)x++;if(keys.w||keys.arrowup)y--;if(keys.s||keys.arrowdown)y++;
 if(joy.id!==null){const dx=joy.x-joy.ox,dy=joy.y-joy.oy,m=Math.hypot(dx,dy);if(m>8){x=dx/Math.max(m,55);y=dy/Math.max(m,55);}}
 const m=Math.hypot(x,y);if(m>1){x/=m;y/=m;}return[x,y];}

/* ---------- update ---------- */
function update(dt){
 if(scene==='in'){updateIn(dt);
  if(!mis){misGap-=dt;if(misGap<=0)newMission();}else{mis.time-=dt;if(mis.time<=0){toast(`遲到了！${mis.t}…失敗`,'#ff6b6b');setStars(stars+1);mis=null;misGap=2.5;}}
  if(stars>0){calm+=dt;if(calm>30){setStars(stars-1);toast('躲在室內，風頭過了','#8ce99a');}}
  for(const t of toasts)t.life-=dt;toasts=toasts.filter(t=>t.life>0);shake=Math.max(0,shake-dt*40);return;}
 const riding=P.ride>=0;let[ix,iy]=inputVec();if(P.stun>0){P.stun-=dt;ix=iy=0;}P.inv=Math.max(0,P.inv-dt);
 const mx=riding?400:165,acc=riding?3:12;
 P.vx+=(ix*mx-P.vx)*Math.min(1,acc*dt);P.vy+=(iy*mx-P.vy)*Math.min(1,acc*dt);
 P.x+=P.vx*dt;P.y+=P.vy*dt;if(collideWorld(P,riding?14:12)&&riding){P.vx*=.85;P.vy*=.85;}
 const sp=Math.hypot(P.vx,P.vy);if(sp>25)P.a=Math.atan2(P.vy,P.vx);
 if(riding){const s=scooters[P.ride];s.x=P.x;s.y=P.y;s.a=P.a;}
 for(const c of cars){updCar(c,dt);
  if(P.inv>0||Math.abs(P.x-c.x)>90||Math.abs(P.y-c.y)>90)continue;
  const ux=Math.cos(c.a),uy=Math.sin(c.a),rx=P.x-c.x,ry=P.y-c.y,u=rx*ux+ry*uy,v=-rx*uy+ry*ux;
  if(Math.abs(u)<c.l/2+11&&Math.abs(v)<c.w/2+11){P.inv=1.2;shake=12;const sg=v>=0?1:-1;P.x+=-uy*sg*(c.w/2+26-Math.abs(v));P.y+=ux*sg*(c.w/2+26-Math.abs(v));P.vx=ux*230;P.vy=uy*230;collideWorld(P,13);
   if(riding){P.vx*=.4;P.vy*=.4;toast(c.bus?'跟公車擦撞！叭——':'叭叭——！看路啦','#ffa94d');}
   else{P.stun=.8;money=Math.max(0,money-30);toast((c.bus?'被公車撞飛':'被車撞了')+'・醫藥費 -NT$30','#ff6b6b');}}}
 for(const p of peds){if(p.down>0){p.down-=dt;continue;}
  p.t-=dt;if(p.t<0){p.a=rnd(0,6.28);p.t=rnd(1.5,4);}
  const nx=p.x+Math.cos(p.a)*28,ny=p.y+Math.sin(p.a)*28;if(onRoad(nx,ny)||inBld(nx,ny,4)){p.a+=Math.PI*rnd(.5,1.2);p.t=rnd(1,3);continue;}
  p.x+=Math.cos(p.a)*42*dt;p.y+=Math.sin(p.a)*42*dt;
  const d=dist(p.x,p.y,P.x,P.y);
  if(d<24){if(riding&&sp>200){p.down=2.2;pedHits++;shake=6;toast(pick(['撞到學弟妹！','哎唷我的白袍','對不起學長！','你騎慢一點啦']),'#ffa94d');if(pedHits%3===0)setStars(stars+1);P.vx*=.6;P.vy*=.6;}
   else if(d>0){p.x+=(p.x-P.x)/d*(24-d);p.y+=(p.y-P.y)/d*(24-d);}}}
 for(const t of teeth)if(!t.got&&dist(t.x,t.y,P.x,P.y)<30){t.got=true;gotTeeth++;money+=20;
  if(gotTeeth===32){money+=1000;toast('🦷 全口 32 顆收集完成！+NT$1000','#ffe14d');}else toast(`撿到一顆牙 ${gotTeeth}/32`,'#e9fac8');}
 for(const c of chasers){const d=dist(c.x,c.y,P.x,P.y);let ax=(P.x-c.x)/(d||1),ay=(P.y-c.y)/(d||1);
  if(c.stuck>0){c.stuck-=dt;const t=ax;ax=-ay*c.side;ay=t*c.side;}
  c.x+=ax*205*dt;c.y+=ay*205*dt;collideWorld(c,12);
  if(dist(c.x,c.y,c.lx,c.ly)<205*dt*.35&&c.stuck<=0){c.stuck=.7;c.side=Math.random()<.5?1:-1;}c.lx=c.x;c.ly=c.y;
  if(d<24&&P.inv<=0){busted();return;}}
 if(!mis){misGap-=dt;if(misGap<=0)newMission();}
 else{mis.time-=dt;const tg=LOC[mis.phase?mis.to:mis.from].d;
  if(dist(P.x,P.y,tg[0],tg[1])<60){
   if(!mis.phase){mis.phase=1;toast(`拿到${mis.item}了，快送到【${LOC[mis.to].n}】`,'#8ce99a');}
   else{const rw=120+Math.floor(mis.time)*6,before=rankOf(cases);money+=rw;cases++;toast(`任務完成！+NT$${rw}`,'#8ce99a');
    if(rankOf(cases)!==before)toast('升級：'+rankOf(cases),'#ffe14d');
    if(cases>best){best=cases;try{localStorage.setItem('dentalRushBest',best)}catch(e){}}mis=null;misGap=2;}}
  else if(mis.time<=0){toast(`遲到了！${mis.t}…失敗`,'#ff6b6b');setStars(stars+1);mis=null;misGap=2.5;}}
 if(stars>0){calm+=dt;if(calm>30){setStars(stars-1);toast('風頭過了，關注度下降','#8ce99a');}}
 for(const t of toasts)t.life-=dt;toasts=toasts.filter(t=>t.life>0);shake=Math.max(0,shake-dt*40);}
function busted(){state='busted';const lost=Math.floor(money*.3);money-=lost;
 document.getElementById('bustMsg').textContent=pick(['被抓去值大夜班','被抓去幫忙寫病歷','被叫去刷 30 支器械','被抓去當 OSCE 假病人'])+`……扣 NT$${lost}`;
 document.getElementById('busted').classList.remove('hide');}
document.getElementById('cont').onclick=()=>{document.getElementById('busted').classList.add('hide');
 stars=0;chasers=[];calm=0;P.ride=-1;P.x=LOC.dorm.d[0];P.y=LOC.dorm.d[1];P.vx=P.vy=0;P.inv=2;mis=null;misGap=2;state='play';};
document.getElementById('start').onclick=()=>{document.getElementById('title').classList.add('hide');state='play';toast('你在牙醫學系門口，找台機車吧 🛵','#ffe14d');};

/* ---------- drawing ---------- */
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function poly(p,ox,oy){ctx.beginPath();ctx.moveTo(p[0][0]+(ox||0),p[0][1]+(oy||0));for(let i=1;i<p.length;i++)ctx.lineTo(p[i][0]+(ox||0),p[i][1]+(oy||0));ctx.closePath();}
function line(p){ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)ctx.lineTo(p[i][0],p[i][1]);}
let V=[0,0,0,0];const vis=bb=>bb[2]>V[0]&&bb[0]<V[2]&&bb[3]>V[1]&&bb[1]<V[3];
const roadLabels=[];{const seen=[];for(const r of roads){if(!r.n||!r.car||r.len<240)continue;let bi=1,bl=0;for(let i=1;i<r.p.length;i++){const l=dist(r.p[i-1][0],r.p[i-1][1],r.p[i][0],r.p[i][1]);if(l>bl){bl=l;bi=i;}}
 if(bl<150)continue;const a=r.p[bi-1],b=r.p[bi],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;if(seen.some(s=>s.n===r.n&&dist(s.x,s.y,mx,my)<700))continue;seen.push({n:r.n,x:mx,y:my});
 let ang=Math.atan2(b[1]-a[1],b[0]-a[0]);if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;roadLabels.push({n:r.n,x:mx,y:my,a:ang,bb:[mx-200,my-200,mx+200,my+200]});}}
function drawWorld(){
 ctx.fillStyle='#d6d0c4';ctx.fillRect(0,0,WW,WH);
 ctx.fillStyle='#7cb562';for(const g of green)if(vis(g.bb)){poly(g.p);ctx.fill();}
 ctx.fillStyle='#6fb3df';for(const w of water)if(vis(w.bb)){poly(w.p);ctx.fill();}
 ctx.lineJoin='round';ctx.lineCap='round';
 for(const r of roads)if(vis(r.bb)){ctx.strokeStyle=r.car?'#bdb5a6':'#e9dcc2';ctx.lineWidth=r.w+(r.car?14:0);line(r.p);ctx.stroke();}
 for(const r of roads)if(r.car&&vis(r.bb)){ctx.strokeStyle='#3d4047';ctx.lineWidth=r.w;line(r.p);ctx.stroke();}
 ctx.setLineDash([24,20]);ctx.lineCap='butt';
 for(const r of roads)if(r.car&&vis(r.bb)&&r.w>=30){ctx.strokeStyle=r.o?'rgba(255,255,255,.5)':'#f2d24b';ctx.lineWidth=3;line(r.p);ctx.stroke();}
 ctx.setLineDash([]);ctx.lineCap='round';
 ctx.font='700 17px '+FONT;ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.75)';
 for(const l of roadLabels)if(vis(l.bb)){ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.a);ctx.fillText(l.n,0,6);ctx.restore();}
}
function drawBuildings(tgt){
 const tb=tgt?LOC[tgt].bld:null;
 ctx.fillStyle='rgba(0,0,0,.22)';for(const b of blds)if(vis(b.bb)){const o=3+Math.min(b.h,12)*1.3;poly(b.p,o*.8,o);ctx.fill();}
 ctx.lineWidth=1.5;ctx.strokeStyle='rgba(60,50,40,.35)';
 for(const b of blds)if(vis(b.bb)){poly(b.p);ctx.fillStyle=b===tb?'#ffb3d1':b.c;ctx.fill();ctx.stroke();}
 for(const k in LOC){const b=LOC[k].bld;if(!vis(b.bb))continue;ctx.strokeStyle=k===tgt?'#ff2e88':'rgba(255,46,136,.45)';ctx.lineWidth=k===tgt?5:2.5;poly(b.p);ctx.stroke();}
}
function drawTrees(){for(const[x,y,r]of trees){if(x<V[0]-30||x>V[2]+30||y<V[1]-30||y>V[3]+30)continue;ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.arc(x+5,y+7,r,0,6.28);ctx.fill();
 ctx.fillStyle='#2f7d32';ctx.beginPath();ctx.arc(x,y,r,0,6.28);ctx.fill();ctx.fillStyle='#4caf50';ctx.beginPath();ctx.arc(x-r*.3,y-r*.3,r*.55,0,6.28);ctx.fill();}}
function txt(t,x,y,font,fill,lw){ctx.font=font;ctx.strokeStyle='rgba(0,0,0,.75)';ctx.lineWidth=lw||4;ctx.strokeText(t,x,y);ctx.fillStyle=fill;ctx.fillText(t,x,y);}
function drawLabels(tgt){ctx.textAlign='center';
 for(const b of blds)if(b.n&&vis(b.bb)&&!Object.values(LOC).some(l=>l.bld===b))txt(b.n,b.cx,b.cy+5,'700 14px '+FONT,'#fff',3);
 for(const k in LOC){const L=LOC[k],b=L.bld;if(!vis([L.d[0]-200,L.d[1]-200,L.d[0]+200,L.d[1]+200]))continue;
  txt(L.n,b.cx,b.cy+6,'900 18px '+FONT,k===tgt?'#ffe14d':'#fff',4);
  const[dx,dy]=L.d;ctx.fillStyle='#6b4f2a';ctx.beginPath();ctx.arc(dx,dy,7,0,6.28);ctx.fill();
  if(k===tgt){const t=performance.now()/300;ctx.strokeStyle='#ff2e88';ctx.lineWidth=5;ctx.globalAlpha=.5+.5*Math.sin(t);ctx.beginPath();ctx.arc(dx,dy,40+6*Math.sin(t),0,6.28);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle='rgba(255,46,136,.25)';ctx.beginPath();ctx.arc(dx,dy,40,0,6.28);ctx.fill();}}
 STATIONS.forEach(st=>{if(!vis([st.x-50,st.y-50,st.x+50,st.y+50]))return;ctx.fillStyle='#1971c2';rr(st.x-15,st.y-15,30,30,8);ctx.fill();txt('M',st.x,st.y+7,'900 19px system-ui,sans-serif','#fff',0);txt(st.n,st.x,st.y-22,'700 13px '+FONT,'#fff',3);});}
function drawScooter(s){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.a);ctx.fillStyle='rgba(0,0,0,.3)';rr(-15,-5,32,14,6);ctx.fill();
 ctx.fillStyle='#222';ctx.fillRect(-17,-3,7,6);ctx.fillRect(11,-3,7,6);ctx.fillStyle=s.c;rr(-13,-7,27,14,6);ctx.fill();ctx.fillStyle='#333';ctx.fillRect(8,-10,3,20);ctx.fillStyle='#fffbe0';ctx.fillRect(13,-3,4,6);ctx.restore();}
function drawPerson(x,y,a,coat,c,down){ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(3,5,12,9,0,0,6.28);ctx.fill();
 if(down){ctx.rotate(1.2);ctx.scale(1.3,.6);}else ctx.rotate(a);
 ctx.fillStyle=coat?'#f8f9fa':c;ctx.beginPath();ctx.ellipse(0,0,9,12,0,0,6.28);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1.5;ctx.stroke();
 ctx.fillStyle='#f1c9a5';ctx.beginPath();ctx.arc(2,0,6,0,6.28);ctx.fill();ctx.fillStyle='#2b2b2b';ctx.beginPath();ctx.arc(0,0,6,1.7,4.6);ctx.fill();ctx.restore();
 if(down){ctx.font='15px sans-serif';ctx.fillText('💫',x,y-15);}}
function drawCar(c){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.a);ctx.fillStyle='rgba(0,0,0,.3)';rr(-c.l/2+4,-c.w/2+5,c.l,c.w,7);ctx.fill();
 ctx.fillStyle=c.c;rr(-c.l/2,-c.w/2,c.l,c.w,7);ctx.fill();ctx.fillStyle='rgba(20,30,50,.7)';
 if(c.bus){for(let i=-c.l/2+10;i<c.l/2-10;i+=17)ctx.fillRect(i,-c.w/2+4,12,c.w-8);}else{ctx.fillRect(c.l/2-20,-c.w/2+4,9,c.w-8);ctx.fillRect(-c.l/2+7,-c.w/2+5,7,c.w-10);}
 ctx.fillStyle='#fff7c2';ctx.fillRect(c.l/2-4,-c.w/2+3,4,5);ctx.fillRect(c.l/2-4,c.w/2-8,4,5);ctx.restore();}

/* minimap (prerendered) */
const MM=document.createElement('canvas'),MMS=210;MM.width=MM.height=MMS;{const m=MM.getContext('2d'),k=MMS/WW;m.fillStyle='#4a5a45';m.fillRect(0,0,MMS,MMS);m.scale(k,k);
 m.fillStyle='#6fa85a';for(const g of green){m.beginPath();g.p.forEach((q,i)=>i?m.lineTo(q[0],q[1]):m.moveTo(q[0],q[1]));m.fill();}
 m.strokeStyle='#ddd';m.lineCap='round';for(const r of roads)if(r.car){m.lineWidth=Math.max(r.w,22);m.beginPath();r.p.forEach((q,i)=>i?m.lineTo(q[0],q[1]):m.moveTo(q[0],q[1]));m.stroke();}
 m.fillStyle='#8f8a80';for(const b of blds){m.beginPath();b.p.forEach((q,i)=>i?m.lineTo(q[0],q[1]):m.moveTo(q[0],q[1]));m.fill();}}

function drawHUD(){
 const pw=Math.min(380,W-24);ctx.fillStyle='rgba(12,14,18,.8)';rr(12,12,pw,mis?104:52,12);ctx.fill();
 ctx.textAlign='left';ctx.fillStyle='#ff8fc0';ctx.font='900 16px '+FONT;
 if(mis){ctx.fillText('任務｜'+mis.t,26,38);ctx.fillStyle='#fff';ctx.font='700 15px '+FONT;
  ctx.fillText(mis.phase?`送 ${mis.item} 到【${LOC[mis.to].n}】`:`去【${LOC[mis.from].n}】拿 ${mis.item}`,26,64);
  const f=clamp(mis.time/mis.max,0,1);ctx.fillStyle='rgba(255,255,255,.15)';rr(26,80,pw-90,12,6);ctx.fill();
  ctx.fillStyle=f>.4?'#8ce99a':f>.2?'#ffd43b':'#ff6b6b';rr(26,80,(pw-90)*f,12,6);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='900 16px system-ui,sans-serif';ctx.fillText(Math.ceil(mis.time)+'s',pw-52,92);}
 else ctx.fillText('等待下一個任務…',26,44);
 {const y0=mis?124:72,s=sqStep();if(s||scene==='in'){ctx.fillStyle='rgba(40,20,70,.82)';rr(12,y0,pw,s?60:38,12);ctx.fill();ctx.textAlign='left';
  if(s){ctx.fillStyle='#d0bfff';ctx.font='900 15px '+FONT;ctx.fillText(`支線｜${sq.q.t}（${sq.i+1}/${sq.q.steps.length}）`,26,y0+24);ctx.fillStyle='#fff';ctx.font='700 14px '+FONT;ctx.fillText(scene==='in'?s.do:'回【牙醫學系】門口上 2F',26,y0+47);}
  else{ctx.fillStyle='#d0bfff';ctx.font='700 14px '+FONT;ctx.fillText(`牙科部 2F・支線 ${sqDone.size}/${F2.sideQuests.length}・`+(sqDone.size<F2.sideQuests.length?'找頭上有 ! 的人':'全部完成 🎉'),26,y0+24);}}}
 ctx.textAlign='right';const m='NT$'+money.toLocaleString();txt(m,W-16,40,'900 26px system-ui,sans-serif','#8ce99a',5);
 for(let i=0;i<5;i++)txt('★',W-16-(4-i)*26,72,'26px system-ui,sans-serif',i<stars?'#ffd43b':'rgba(255,255,255,.3)',4);
 [rankOf(cases)+`・完成 ${cases} 件`,`🦷 ${gotTeeth}/32`+(best?`・最佳 ${best} 件`:'')].forEach((l,i)=>txt(l,W-16,96+i*20,'700 14px '+FONT,'#fff',4));
 ctx.textAlign='center';toasts.forEach((t,i)=>{ctx.globalAlpha=Math.min(1,t.life*2);txt(t.t,W/2,H*.26+i*30,'900 20px '+FONT,t.c,5);});ctx.globalAlpha=1;
 if(scene==='in'){const mw=Math.min(230,W*.4),sc=mw/IN.W,mh=IN.H*sc,mx0=touchUI?14:W-mw-14,my0=touchUI?H-mh-170:H-mh-14;
  ctx.fillStyle='rgba(12,14,18,.85)';rr(mx0-4,my0-4,mw+8,mh+8,8);ctx.fill();
  IN.walk.forEach((r,i)=>{ctx.fillStyle=i<F2.corridor.length?'#e48a4c':'#7b8fd1';ctx.fillRect(mx0+r[0]*sc,my0+r[1]*sc,(r[2]-r[0])*sc,(r[3]-r[1])*sc);});
  const s=sqStep();if(s){const n=IN.npcs[s.to];ctx.fillStyle='#ff2e88';ctx.beginPath();ctx.arc(mx0+n.x*sc,my0+n.y*sc,4.5,0,6.28);ctx.fill();}
  ctx.fillStyle='#ffe14d';ctx.beginPath();ctx.arc(mx0+P.x*sc,my0+P.y*sc,4,0,6.28);ctx.fill();}
 else{const mw=Math.min(190,W*.34),sc=mw/WW,mh=WH*sc,mx0=touchUI?14:W-mw-14,my0=touchUI?H-mh-170:H-mh-14;
 ctx.fillStyle='rgba(12,14,18,.85)';rr(mx0-4,my0-4,mw+8,mh+8,8);ctx.fill();ctx.drawImage(MM,mx0,my0,mw,mh);
 if(mis){const d=LOC[mis.phase?mis.to:mis.from].d;ctx.fillStyle='#ff2e88';ctx.beginPath();ctx.arc(mx0+d[0]*sc,my0+d[1]*sc,5,0,6.28);ctx.fill();}
 ctx.fillStyle='#ff3b3b';chasers.forEach(c=>{ctx.beginPath();ctx.arc(mx0+c.x*sc,my0+c.y*sc,3.5,0,6.28);ctx.fill();});
 ctx.fillStyle='#ffe14d';ctx.beginPath();ctx.arc(mx0+P.x*sc,my0+P.y*sc,4,0,6.28);ctx.fill();}
 ctx.textAlign='left';ctx.font='10px system-ui,sans-serif';ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillText('© OpenStreetMap contributors',8,H-8);
 if(touchUI){const[bx,by]=btnPos();ctx.fillStyle=P.ride>=0||scene==='in'?'rgba(255,46,136,.85)':'rgba(255,225,77,.85)';ctx.beginPath();ctx.arc(bx,by,40,0,6.28);ctx.fill();
  ctx.textAlign='center';ctx.fillStyle='#111';ctx.font='900 17px '+FONT;ctx.fillText(actLabel(),bx,by+6);
  if(joy.id!==null){ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(joy.ox,joy.oy,55,0,6.28);ctx.stroke();
   const dx=joy.x-joy.ox,dy=joy.y-joy.oy,m2=Math.hypot(dx,dy),k=m2>55?55/m2:1;ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.arc(joy.ox+dx*k,joy.oy+dy*k,22,0,6.28);ctx.fill();}}}
function arrowTarget(){if(scene==='in'){const s=sqStep();if(s){const n=IN.npcs[s.to];return[n.x,n.y,35];}return mis?[IN.stairs[0],IN.stairs[1],35]:null;}
 if(mis){const d=LOC[mis.phase?mis.to:mis.from].d;return[d[0],d[1],MAP.S];}return sq?[LOC.dental.d[0],LOC.dental.d[1],MAP.S]:null;}
function drawArrow(camx,camy,z){const d=arrowTarget();if(!d)return;const sx=(d[0]-camx)*z,sy=(d[1]-camy)*z;
 if(sx>30&&sx<W-30&&sy>30&&sy<H-30)return;const cx=W/2,cy=H/2,a=Math.atan2(sy-cy,sx-cx);
 const m=46,t=Math.min(Math.abs((W/2-m)/Math.cos(a)),Math.abs((H/2-m)/Math.sin(a)));const x=cx+Math.cos(a)*t,y=cy+Math.sin(a)*t;
 ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#ff2e88';ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(-12,-14);ctx.lineTo(-6,0);ctx.lineTo(-12,14);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 ctx.textAlign='center';txt(Math.round(dist(P.x,P.y,d[0],d[1])/d[2])+'m',x-Math.cos(a)*32,y-Math.sin(a)*32+4,'900 13px system-ui,sans-serif','#fff',4);}


/* indoor drawing */
function drawFloor(){
 ctx.fillStyle='#1b1e24';ctx.fillRect(-2000,-2000,IN.W+4000,IN.H+4000);
 const R=Object.values(IN.rooms),cors=IN.walk.slice(0,F2.corridor.length);
 ctx.fillStyle='#3e5aa8';for(const r of IN.walk){ctx.fillRect(r[0]-9,r[1]-9,r[2]-r[0]+18,r[3]-r[1]+18);}
 for(const m of R){ctx.fillStyle=m.kind==='or'?'#dfeee9':'#eef1f6';ctx.fillRect(m.d[0],m.d[1],m.d[2]-m.d[0],m.d[3]-m.d[1]);}
 ctx.fillStyle='#e48a4c';for(const r of cors)ctx.fillRect(r[0],r[1],r[2]-r[0],r[3]-r[1]);
 ctx.strokeStyle='rgba(120,60,20,.18)';ctx.lineWidth=1;for(const r of cors){ctx.beginPath();for(let x=r[0];x<r[2];x+=40){ctx.moveTo(x,r[1]);ctx.lineTo(x,r[3]);}for(let y=r[1];y<r[3];y+=40){ctx.moveTo(r[0],y);ctx.lineTo(r[2],y);}ctx.stroke();}
 for(const m of R){ctx.fillStyle=m.kind==='or'?'#dfeee9':'#eef1f6';ctx.fillRect(m.r[0],m.r[1],m.r[2]-m.r[0],m.r[3]-m.r[1]);}
 ctx.textAlign='center';for(const m of R){const cx=(m.r[0]+m.r[2])/2,cy=(m.r[1]+m.r[3])/2,w=m.r[2]-m.r[0];ctx.fillStyle='rgba(62,90,168,.28)';ctx.font=`900 ${Math.min(34,w/4.2)}px ${FONT}`;
  if(m.kind==='lab'){m.n.split('').forEach((ch,i)=>ctx.fillText(ch,cx,cy+10+i*38));}else ctx.fillText(m.n,cx,m.kind==='or'?m.r[1]+260:cy+8);}
 for(const d of IN.deco){if(d.t==='chair'){ctx.save();ctx.translate(d.x,d.y);ctx.fillStyle='rgba(0,0,0,.15)';rr(-22,-54,48,116,14);ctx.fill();
   ctx.fillStyle='#5cc8d6';rr(-20,-56,40,112,14);ctx.fill();ctx.fillStyle='#3a9fb0';rr(-14,-56,28,22,9);ctx.fill();
   ctx.fillStyle='#c9cdd3';ctx.fillRect(22,-30,26,7);ctx.beginPath();ctx.arc(52,-27,9,0,6.28);ctx.fill();ctx.fillStyle='#fff6bf';ctx.beginPath();ctx.arc(52,-27,5,0,6.28);ctx.fill();ctx.restore();}
  else if(d.t==='bench'){const r=d.r;ctx.fillStyle='#a47148';ctx.fillRect(r[0],r[1],r[2]-r[0],r[3]-r[1]);ctx.fillStyle='#f4ead5';for(let x=r[0]+16;x<r[2]-10;x+=26){ctx.beginPath();ctx.arc(x,(r[1]+r[3])/2,8,Math.PI,0);ctx.fill();}}
  else if(d.t==='seats'){const r=d.r;for(let y=r[1];y<r[3]-4;y+=30){ctx.fillStyle='#7b8fd1';rr(r[0],y,r[2]-r[0],26,6);ctx.fill();}}
  else if(d.t==='table'){ctx.fillStyle='#2f9e44';rr(d.x-34,d.y-85,68,170,10);ctx.fill();ctx.fillStyle='#8ce99a';rr(d.x-26,d.y-80,52,34,8);ctx.fill();
   ctx.fillStyle='rgba(255,250,200,.35)';ctx.beginPath();ctx.arc(d.x,d.y-20,70,0,6.28);ctx.fill();ctx.fillStyle='#dee2e6';ctx.beginPath();ctx.arc(d.x,d.y-20,20,0,6.28);ctx.fill();}
  else if(d.t==='cart'){const r=d.r;ctx.fillStyle='#adb5bd';rr(r[0],r[1],r[2]-r[0],r[3]-r[1],6);ctx.fill();ctx.fillStyle='#e9ecef';for(let y=r[1]+10;y<r[3]-6;y+=14)ctx.fillRect(r[0]+6,y,r[2]-r[0]-12,4);}}
 const[sx,sy]=IN.stairs;ctx.fillStyle='#495057';rr(sx-40,sy-34,80,62,8);ctx.fill();ctx.fillStyle='#868e96';for(let i=0;i<5;i++)ctx.fillRect(sx-34,sy-28+i*12,68,6);
 txt('樓梯→1F',sx,sy-44,'900 15px '+FONT,mis?'#ffe14d':'#fff',4);
}
function drawFloorPeople(){const s=sqStep(),tk=s?s.to:null,t=performance.now()/300;
 for(const p of IN.peds)drawPerson(p.x,p.y,p.a,p.coat,p.c,false);
 for(const k in IN.npcs){const n=IN.npcs[k];
  if(k===tk){ctx.strokeStyle='#ff2e88';ctx.lineWidth=4;ctx.globalAlpha=.5+.5*Math.sin(t);ctx.beginPath();ctx.arc(n.x,n.y,34+4*Math.sin(t),0,6.28);ctx.stroke();ctx.globalAlpha=1;}
  drawPerson(n.x,n.y,n.a,n.coat,n.c,false);txt(n.n,n.x,n.y-20,'700 13px '+FONT,k===tk?'#ffe14d':'#fff',3);
  if(!sq&&sqAvail(k))txt('!',n.x,n.y-38+Math.sin(t*1.5)*3,'900 26px system-ui,sans-serif','#ffd43b',5);}}
function renderIn(z,vw,vh){
 const camx=IN.W<vw?(IN.W-vw)/2:clamp(P.x-vw/2,-40,IN.W-vw+40),camy=IN.H<vh?(IN.H-vh)/2:clamp(P.y-vh/2,-40,IN.H-vh+40);
 ctx.fillStyle='#15171b';ctx.fillRect(0,0,W,H);ctx.save();ctx.scale(z,z);ctx.translate(-camx,-camy);
 drawFloor();drawFloorPeople();
 if(!(P.inv>0&&Math.floor(P.inv*10)%2))drawPerson(P.x,P.y,P.a,true,'#fff',P.stun>0);
 ctx.fillStyle='#ffe14d';ctx.beginPath();ctx.moveTo(P.x,P.y-22);ctx.lineTo(P.x-6,P.y-31);ctx.lineTo(P.x+6,P.y-31);ctx.fill();
 ctx.restore();drawArrow(camx,camy,z);drawHUD();}
function render(){
 const z=W<600?.75:.95,vw=W/z,vh=H/z;
 if(scene==='in'){renderIn(z,vw,vh);return;}
 const camx=clamp(P.x-vw/2,0,Math.max(0,WW-vw)),camy=clamp(P.y-vh/2,0,Math.max(0,WH-vh));V=[camx-40,camy-40,camx+vw+40,camy+vh+40];
 ctx.fillStyle='#15171b';ctx.fillRect(0,0,W,H);
 ctx.save();ctx.scale(z,z);ctx.translate(-camx+rnd(-shake,shake)*.5,-camy+rnd(-shake,shake)*.5);
 drawWorld();const tgt=mis?(mis.phase?mis.to:mis.from):null;drawBuildings(tgt);
 const now=performance.now()/400;ctx.textAlign='center';ctx.font='22px sans-serif';
 for(const t of teeth)if(!t.got&&t.x>V[0]&&t.x<V[2]&&t.y>V[1]&&t.y<V[3])ctx.fillText('🦷',t.x,t.y+Math.sin(now+t.ph)*4+8);
 scooters.forEach((s,i)=>{if(i!==P.ride&&s.x>V[0]&&s.x<V[2]&&s.y>V[1]&&s.y<V[3])drawScooter(s);});
 peds.forEach(p=>{if(p.x>V[0]&&p.x<V[2]&&p.y>V[1]&&p.y<V[3])drawPerson(p.x,p.y,p.a,p.coat,p.c,p.down>0);});
 cars.forEach(c=>{if(c.x>V[0]-60&&c.x<V[2]+60&&c.y>V[1]-60&&c.y<V[3]+60)drawCar(c);});
 chasers.forEach(c=>{drawPerson(c.x,c.y,Math.atan2(P.y-c.y,P.x-c.x),true,'#fff',false);txt('總醫師',c.x,c.y-19,'900 13px '+FONT,'#ff6b6b',3);});
 if(P.ride>=0)drawScooter(scooters[P.ride]);
 if(!(P.inv>0&&Math.floor(P.inv*10)%2))drawPerson(P.x,P.y,P.a,true,'#fff',P.stun>0);
 ctx.fillStyle='#ffe14d';ctx.beginPath();ctx.moveTo(P.x,P.y-22);ctx.lineTo(P.x-6,P.y-31);ctx.lineTo(P.x+6,P.y-31);ctx.fill();
 drawTrees();drawLabels(tgt);
 {const[dx,dy]=LOC.dental.d;if(vis([dx-200,dy-200,dx+200,dy+200])){const near=dist(P.x,P.y,dx,dy)<60;const has=F2.sideQuests.some(q=>!sqDone.has(q.id));
  txt(near&&P.ride<0?'按 E 上 2F':(has?'! ':'')+'2F',dx,dy+30,'900 15px '+FONT,near?'#ffe14d':'#d0bfff',4);}}
 ctx.restore();drawArrow(camx,camy,z);drawHUD();}
let last=performance.now();
function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;if(state==='play')update(dt);render();requestAnimationFrame(loop);}
requestAnimationFrame(loop);
}

