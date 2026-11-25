"""把 OpenStreetMap 資料轉成遊戲地圖 src/map.js
用法：python3 tools/build_map.py            （從 repo 根目錄執行）
"""
import os
if __name__=='__main__' and len(__import__('sys').argv)==1:
  __import__('sys').argv+=['data/ntu-dental-osm.json','src/map.js','data/locations.json']
import json,math,random,sys
random.seed(7)
d=json.load(open(sys.argv[1],encoding='utf-8'))
S=2.2;OFF=1050;W=H=round(2*OFF*S)
G=lambda p:[round((p[0]+OFF)*S),round((p[1]+OFF)*S)]
BASE={'trunk':16,'primary':12,'secondary':10,'tertiary':8,'residential':6,'unclassified':6,'living_street':5,'trunk_link':7,'primary_link':7,'secondary_link':7,'tertiary_link':6,'pedestrian':6}
roads=[]
for r in d['roads']:
  if '高架' in r['n']:continue
  w=BASE[r['t']]
  if r['l']:w=max(w,r['l']*3.1+(0 if r['o'] else 1))
  roads.append({'t':r['t'],'n':r['n'],'o':r['o'],'w':round(w*S),'car':r['t']!='pedestrian','p':[G(q) for q in r['p']]})
segs=[(ri,a,b) for ri,r in enumerate(roads) if r['car'] for a,b in zip(r['p'],r['p'][1:])]
def segd(px,py,a,b):
  dx,dy=b[0]-a[0],b[1]-a[1];L=dx*dx+dy*dy or 1e-9;t=max(0,min(1,((px-a[0])*dx+(py-a[1])*dy)/L))
  return math.hypot(px-a[0]-t*dx,py-a[1]-t*dy)
# seg grid
CS=200;sg={}
for k,(ri,a,b) in enumerate(segs):
  for cx in range(min(a[0],b[0])//CS,max(a[0],b[0])//CS+1):
    for cy in range(min(a[1],b[1])//CS,max(a[1],b[1])//CS+1):sg.setdefault((cx,cy),[]).append(k)
def near_segs(x,y,rad=1):
  s=set()
  for cx in range(int(x//CS)-rad,int(x//CS)+rad+1):
    for cy in range(int(y//CS)-rad,int(y//CS)+rad+1):s.update(sg.get((cx,cy),[]))
  return s
def road_dist(x,y,rad=1):
  best=(1e9,None)
  for k in near_segs(x,y,rad):
    ri,a,b=segs[k];dd=segd(x,y,a,b)-roads[ri]['w']/2
    if dd<best[0]:best=(dd,k)
  return best
def pip(x,y,p):
  c=False;j=len(p)-1
  for i in range(len(p)):
    if (p[i][1]>y)!=(p[j][1]>y) and x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1]+1e-12)+p[i][0]:c=not c
    j=i
  return c
def inter(a,b,c,e):
  def o(p,q,r):return (q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])
  return o(a,b,c)*o(a,b,e)<0 and o(c,e,a)*o(c,e,b)<0
BAD=('地下','捷運','連通道','善導寺站','桃園機場','車道','人行')
blds=[]
for b in d['blds']:
  if b['a']<20 or any(k in b['n'] for k in BAD):continue
  p=[G(q) for q in b['p']]
  if len(p)<3:continue
  xs=[q[0] for q in p];ys=[q[1] for q in p];cx,cy=sum(xs)/len(p),sum(ys)/len(p)
  over=False
  for k in near_segs(cx,cy,2):
    ri,a,bb=segs[k]
    if roads[ri]['t'] in('pedestrian','living_street'):continue
    if max(a[0],bb[0])<min(xs) or min(a[0],bb[0])>max(xs) or max(a[1],bb[1])<min(ys) or min(a[1],bb[1])>max(ys):continue
    if pip(a[0],a[1],p) or pip(bb[0],bb[1],p) or any(inter(a,bb,p[i],p[i-1]) for i in range(len(p))):over=True;break
  if over:continue
  blds.append({'n':b['n'],'h':b['h'],'a':b['a'],'p':p,'c':(cx,cy)})
print('buildings',len(blds),'of',len(d['blds']),file=sys.stderr)
def find(name,near=None):
  c=[i for i,b in enumerate(blds) if b['n']==name]
  if near:c.sort(key=lambda i:math.hypot(blds[i]['c'][0]-G(near)[0],blds[i]['c'][1]-G(near)[1]))
  return c[0]
def unnamed(near,amin=100,amax=600):
  g=G(near);c=[i for i,b in enumerate(blds) if not b['n'] and amin<b['a']<amax];c.sort(key=lambda i:math.hypot(blds[i]['c'][0]-g[0],blds[i]['c'][1]-g[1]));return c[0]
def free(x,y):
  if road_dist(x,y)[0]<4:return False
  for b in blds:
    if abs(b['c'][0]-x)<400 and abs(b['c'][1]-y)<400 and pip(x,y,b['p']):return False
  return True
def door(i):
  p=blds[i]['p'];best=(1e9,None)
  for j in range(len(p)):
    a,b=p[j-1],p[j]
    for t in (0.2,0.35,0.5,0.65,0.8):
      x,y=a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t;dd,k=road_dist(x,y,2)
      if dd<best[0]:best=(dd,(x,y,k))
  x,y,k=best[1];ri,a,b=segs[k]
  dx,dy=b[0]-a[0],b[1]-a[1];L=dx*dx+dy*dy or 1;t=max(0,min(1,((x-a[0])*dx+(y-a[1])*dy)/L))
  rx,ry=a[0]+t*dx-x,a[1]+t*dy-y;m=math.hypot(rx,ry) or 1
  dd=best[0];push=max(7,min(22,dd*0.6))
  return [round(x+rx/m*push),round(y+ry/m*push)]
CFG=json.load(open(sys.argv[3],encoding='utf-8'))['locations']
LOCS={}
for k,v in CFG.items():
  i=find(v['building'],v.get('near_m')) if 'building' in v else unnamed(tuple(v['near_m']))
  LOCS[k]=(i,v['name'],v.get('en',''))
loc={}
for k,(i,n,e) in LOCS.items():
  loc[k]={'n':n,'e':e,'b':i,'d':door(i)}
  print(k,blds[i]['n'] or '(unnamed)',loc[k]['d'],file=sys.stderr)
def free_near(m,rad=80):
  g=G(m)
  for r in range(0,rad*3,6):
    for a in range(0,360,30):
      x,y=g[0]+r*math.cos(math.radians(a)),g[1]+r*math.sin(math.radians(a))
      if free(x,y) and road_dist(x,y)[0]>8:return [round(x),round(y)]
  return g
stations=[{'n':'台北車站','p':free_near((15,-420))},{'n':'台大醫院站','p':free_near((-150,240))},{'n':'中正紀念堂站','p':free_near((-60,1000))},{'n':'善導寺站','p':free_near((651,-120))},{'n':'北門站','p':free_near((-740,-640))}]
# scooters near mission doors + random
scoot=[]
for k in ('dental','dorm','hospE','office','station','lab'):
  dx,dy=loc[k]['d']
  for t in range(40):
    x,y=dx+random.uniform(-60,60),dy+random.uniform(-60,60)
    if free(x,y):scoot.append([round(x),round(y)]);break
while len(scoot)<26:
  x,y=random.uniform(200,W-200),random.uniform(200,H-200)
  if free(x,y) and road_dist(x,y)[0]<30:scoot.append([round(x),round(y)])
green=[[G(q) for q in g['p']] for g in d['green']]
water=[[G(q) for q in w['p']] for w in d['water']]
trees=[]
for g in green:
  xs=[q[0] for q in g];ys=[q[1] for q in g]
  area=abs(sum(g[i][0]*g[i-1][1]-g[i-1][0]*g[i][1] for i in range(len(g)))/2)/S/S
  n=min(40,int(area/350))
  for _ in range(n*3):
    if n<=0:break
    x,y=random.uniform(min(xs),max(xs)),random.uniform(min(ys),max(ys))
    if pip(x,y,g) and free(x,y) and all(math.hypot(x-t[0],y-t[1])>30 for t in trees[-60:]):trees.append([round(x),round(y),random.randint(14,24)]);n-=1
print('trees',len(trees),file=sys.stderr)
LABEL=set(v['b'] for v in loc.values())
def col(b):
  n=b['n']
  if '臺大醫院' in n or '醫' in n or '館' in n and b['c'][0]<1400 and abs(b['c'][0]-2310)<700:return 1
  return 0
FLAT=lambda p:[v for q in p for v in q]
out={'W':W,'H':H,'S':S,
 'roads':[[r['t'],r['w'],r['o'],r['n'],FLAT(r['p'])] for r in roads],
 'blds':[[b['h'],(b['n'] if (b['n'] and (b['a']>1500 or i in LABEL)) else ''),FLAT(b['p']),1 if ('臺大' in b['n'] or '台大' in b['n'] or '醫' in b['n']) else 0] for i,b in enumerate(blds)],
 'green':[FLAT(g) for g in green],'water':[FLAT(w) for w in water],'trees':trees,'loc':loc,'stations':stations,'scooters':scoot}
open(sys.argv[2],'w',encoding='utf-8').write('// 自動產生，請勿手改：python3 tools/build_map.py\n'+'const MAP='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';')
print('bytes',len(open(sys.argv[2],encoding='utf-8').read()),file=sys.stderr)
