import * as THREE from 'three';
import { PLANETS, BONUS, ROCKETS, SUN, EXOPLANETS, MILKYWAY, GALAXIES, BLACKHOLE } from './dataPlanets.js';

/* ============ SETUP ============ */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02030a);
const camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, 0.1, 8000);

scene.add(new THREE.AmbientLight(0x334455, 0.7));
const _glowCache={}; // dipakai glowTex() di seluruh modul
const sunLight = new THREE.PointLight(0xffffff, 2.2, 0, 0);
scene.add(sunLight);

/* ============ TEKSTUR PROSEDURAL AKURAT (warna NASA) ============ */
function planetTexture(base, gas=false, seed=1){
  const c = document.createElement('canvas'); c.width=512; c.height=256;
  const g = c.getContext('2d');
  let rnd = seed*9973;
  const rand = ()=>{ rnd=(rnd*16807)%2147483647; return rnd/2147483647; };
  if(gas){ // pita horizontal raksasa gas
    for(let y=0;y<256;y++){
      const t=y/256;
      const idx=Math.floor(t*base.length*2+Math.sin(t*20+seed)*1.2+base.length*2)%base.length;
      g.fillStyle=base[(idx+base.length)%base.length];
      g.fillRect(0,y,512,1);
    }
    // turbulensi + bintik merah jupiter
    for(let i=0;i<900;i++){ g.fillStyle=`rgba(0,0,0,${rand()*0.08})`; const w=20+rand()*80,h=2+rand()*5; g.fillRect(rand()*512,rand()*256,w,h); }
  } else {
    g.fillStyle=base[0]; g.fillRect(0,0,512,256);
    for(let i=0;i<2600;i++){
      g.fillStyle=base[Math.floor(rand()*base.length)];
      g.globalAlpha=0.25+rand()*0.5;
      const r=1+rand()*7;
      g.beginPath(); g.arc(rand()*512,rand()*256,r,0,7); g.fill();
    }
    g.globalAlpha=1;
    if(seed===3){ // Bumi: lautan + daratan + es
      g.fillStyle='#123f8f'; g.fillRect(0,0,512,256);
      g.fillStyle='#2fae5f';
      for(let i=0;i<14;i++){ g.beginPath(); g.ellipse(rand()*512,60+rand()*130,20+rand()*60,12+rand()*30,rand()*3,0,7); g.fill(); }
      g.fillStyle='#ffffff'; g.fillRect(0,0,512,16); g.fillRect(0,240,512,16);
      g.fillStyle='rgba(255,255,255,.7)';
      for(let i=0;i<60;i++){ g.beginPath(); g.ellipse(rand()*512,rand()*256,15+rand()*40,5+rand()*10,0,0,7); g.fill(); }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function ringTexture(){
  const c=document.createElement('canvas'); c.width=256; c.height=16;
  const g=c.getContext('2d');
  for(let x=0;x<256;x++){ const a=0.25+0.65*Math.abs(Math.sin(x*0.35)*Math.cos(x*0.11)); g.fillStyle=`rgba(227,207,158,${a})`; g.fillRect(x,0,1,16); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

/* ============ BINTANG, MATAHARI ============ */
{
  const n=4500, pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){ const r=2500+Math.random()*2500, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.cos(ph); pos[i*3+2]=r*Math.sin(ph)*Math.sin(th); }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({color:0xffffff,size:2.2,sizeAttenuation:false})));
}
/* Pita Bima Sakti: bintang tambahan terkonsentrasi di bidang galaksi miring + glow inti */
{
  const n=6500, pos=new Float32Array(n*3);
  const tiltX=0.92, roll=0.55;
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2, r=2100+Math.random()*900;
    const spread=(Math.random()+Math.random()+Math.random()+Math.random()-2)*0.085;
    let x=Math.cos(a)*r, z=Math.sin(a)*r, y=r*spread;
    const cx=Math.cos(tiltX), sx=Math.sin(tiltX);
    let y2=y*cx-z*sx, z2=y*sx+z*cx;
    const cy=Math.cos(roll), sy=Math.sin(roll);
    const x2=x*cy+z2*sy; z2=-x*sy+z2*cy;
    pos[i*3]=x2; pos[i*3+1]=y2; pos[i*3+2]=z2;
  }
  const bg=new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos,3));
  scene.add(new THREE.Points(bg, new THREE.PointsMaterial({color:0xdbe6ff,size:1.7,sizeAttenuation:false,transparent:true,opacity:0.75,blending:THREE.AdditiveBlending,depthWrite:false})));
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#ffe9b0'),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0.32}));
  core.position.set(-1500,460,1050); core.scale.set(1500,1500,1); scene.add(core);
}
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(12,48,48),
  new THREE.MeshBasicMaterial({ map: planetTexture(['#ffdd55','#ff9500','#ff5500'],false,99) }));
scene.add(sunMesh);
const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map:(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(255,220,120,1)');gr.addColorStop(0.4,'rgba(255,150,50,.5)');gr.addColorStop(1,'rgba(255,120,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);return t;})(), blending:THREE.AdditiveBlending, depthWrite:false }));
glow.scale.set(70,70,1); scene.add(glow);

/* ============ PLANET + ORBIT ============ */
const bodies = []; // {data, mesh, angle, speed, moons[]}
const BASE_ORBIT_SECONDS = 140; // 1 tahun Bumi = 140 dtk pada 1x
function orbitSpeed(hari){ return (Math.PI*2) / (hari/365*BASE_ORBIT_SECONDS); }

function addLabelSprite(text, w=256, h=64){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d'); let fs=Math.round(h*0.47);
  g.font=`bold ${fs}px sans-serif`;
  while(g.measureText(text).width>w*0.9&&fs>10){ fs-=1; g.font=`bold ${fs}px sans-serif`; }
  g.textAlign='center'; g.shadowColor='#000'; g.shadowBlur=8; g.fillStyle='#fff'; g.fillText(text,w/2,h*0.62);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));
  s.scale.set(w/25.6,h/25.6,1); return s;
}

for(const p of PLANETS){
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.renderRadius, 48, 48),
    new THREE.MeshStandardMaterial({ map: planetTexture(p.warnaBase, p.gas, PLANETS.indexOf(p)+2), roughness:0.9, metalness:0.05 }));
  mesh.rotation.z = p.tilt*Math.PI/180;
  const label = addLabelSprite(p.name); label.position.y = p.renderRadius+3; mesh.add(label);
  scene.add(mesh);
  // orbit line
  const pts=[]; for(let i=0;i<=128;i++){ const a=i/128*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(a)*p.orbitRadius,0,Math.sin(a)*p.orbitRadius)); }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:0x1e3a5f,transparent:true,opacity:0.7})));
  const body={ data:p, mesh, angle:Math.random()*Math.PI*2, speed:orbitSpeed(p.periodeOrbitHari), spin:(Math.PI*2)/(Math.abs(p.rotasiJam)/24*20+8)*(p.rotasiJam<0?-1:1), moons:[] };
  bodies.push(body);
  if(p.ring){ // cincin Saturnus akurat
    const inner=p.renderRadius*1.25, outer=p.renderRadius*2.3;
    const ring=new THREE.Mesh(new THREE.RingGeometry(inner,outer,96,1),
      new THREE.MeshBasicMaterial({map:ringTexture(),side:THREE.DoubleSide,transparent:true}));
    ring.rotation.x=Math.PI/2-0.2; mesh.add(ring);
  }
  if(p.id==='uranus'){
    const ring=new THREE.Mesh(new THREE.RingGeometry(p.renderRadius*1.5,p.renderRadius*1.9,64),
      new THREE.MeshBasicMaterial({color:0x9fe3e8,side:THREE.DoubleSide,transparent:true,opacity:0.5}));
    ring.rotation.x=Math.PI/2.3; mesh.add(ring);
  }
}
// Bulan mengelilingi Bumi
const earth = bodies.find(b=>b.data.id==='bumi');
const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(0.55,24,24),
  new THREE.MeshStandardMaterial({map:planetTexture(['#b8b8b8','#888','#ddd'],false,55),roughness:1}));
scene.add(moonMesh); earth.moons.push({mesh:moonMesh,dist:4.2,speed:0.5,angle:0});
const moonLabel=addLabelSprite('Bulan'); moonLabel.scale.set(6,1.5,1); moonLabel.position.y=1.2; moonMesh.add(moonLabel);
// 4 bulan Galileo di Jupiter (titik akurat)
const jup=bodies.find(b=>b.data.id==='jupiter');
['Io','Europa','Ganymede','Callisto'].forEach((nm,i)=>{
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.35,16,16),new THREE.MeshStandardMaterial({color:[0xe8d27a,0xcfe8ff,0x9a8f7f,0x6f7f8f][i]}));
  scene.add(m); jup.moons.push({mesh:m,dist:9+i*1.6,speed:0.6-i*0.08,angle:i*1.7});
});
// Titan di Saturnus
const sat=bodies.find(b=>b.data.id==='saturnus');
{ const m=new THREE.Mesh(new THREE.SphereGeometry(0.45,16,16),new THREE.MeshStandardMaterial({color:0xd9a94f})); scene.add(m); sat.moons.push({mesh:m,dist:15,speed:0.25,angle:1}); }
// Pluto (bonus planet katai)
const plutoData = BONUS.find(b=>b.id==='pluto');
const plutoMesh = new THREE.Mesh(new THREE.SphereGeometry(plutoData.renderRadius,24,24),
  new THREE.MeshStandardMaterial({map:planetTexture(plutoData.warnaBase,false,77)}));
const plutoLabel=addLabelSprite('Pluto'); plutoLabel.position.y=2.4; plutoMesh.add(plutoLabel);
scene.add(plutoMesh);
const pluto={data:plutoData,mesh:plutoMesh,angle:2,speed:orbitSpeed(plutoData.periodeOrbitHari),spin:0.05,moons:[]};
bodies.push(pluto);

/* Eksoplanet nyata di luar tata surya */
for(const p of EXOPLANETS){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(p.renderRadius,40,40),
    new THREE.MeshStandardMaterial({map:planetTexture(p.warnaBase,p.gas,100+EXOPLANETS.indexOf(p)),roughness:0.85}));
  mesh.rotation.z=(p.tilt||0)*Math.PI/180;
  const label=addLabelSprite(p.name); label.position.y=p.renderRadius+3; label.scale.set(14,3.5,1); mesh.add(label);
  scene.add(mesh);
  const pts=[]; for(let i=0;i<=128;i++){ const a=i/128*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(a)*p.orbitRadius,0,Math.sin(a)*p.orbitRadius)); }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:0x5f3a8f,transparent:true,opacity:0.6})));
  bodies.push({data:p,mesh,angle:Math.random()*Math.PI*2,speed:orbitSpeed(p.periodeOrbitHari*(p.lambat||1)),spin:0.15,moons:[]});
}

/* Lubang Hitam Cygnus X-1: horizon + cincin foton + cakram akresi */
const bhMesh=new THREE.Mesh(new THREE.SphereGeometry(BLACKHOLE.renderRadius,48,48),
  new THREE.MeshBasicMaterial({color:0x000000}));
const bhLabel=addLabelSprite('Cygnus X-1 · Lubang Hitam'); bhLabel.scale.set(20,5,1); bhLabel.position.y=20; bhMesh.add(bhLabel);
const photon=new THREE.Mesh(new THREE.TorusGeometry(BLACKHOLE.renderRadius*1.15,0.35,12,64),
  new THREE.MeshBasicMaterial({color:0xffdd88}));
photon.rotation.x=Math.PI/2-0.35; bhMesh.add(photon);
function accretionTexture(){
  const c=document.createElement('canvas');c.width=256;c.height=16;const g=c.getContext('2d');
  for(let x=0;x<256;x++){ const t=x/256; const a=Math.sin(t*Math.PI);
    g.fillStyle=`rgba(${255},${Math.round(120+100*(1-t))},${Math.round(40+40*t)},${(0.15+0.8*a).toFixed(2)})`; g.fillRect(x,0,1,16); }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const bhDisk=new THREE.Mesh(new THREE.RingGeometry(BLACKHOLE.renderRadius*1.5,BLACKHOLE.renderRadius*3.2,96,1),
  new THREE.MeshBasicMaterial({map:accretionTexture(),side:THREE.DoubleSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
bhDisk.rotation.x=Math.PI/2-0.35; bhMesh.add(bhDisk);
const bhGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#ff7733'),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0.85}));
bhGlow.scale.set(60,60,1); bhMesh.add(bhGlow);
const bhLight=new THREE.PointLight(0xff8855,3,220); bhMesh.add(bhLight);
scene.add(bhMesh);
{ const pts=[]; for(let i=0;i<=128;i++){ const a=i/128*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(a)*BLACKHOLE.orbitRadius,0,Math.sin(a)*BLACKHOLE.orbitRadius)); }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:0x8f2a3f,transparent:true,opacity:0.6}))); }
const bhBody={data:BLACKHOLE,mesh:bhMesh,angle:4.2,speed:orbitSpeed(BLACKHOLE.periodeOrbitHari),spin:0.02,moons:[],isBlackHole:true};
bodies.push(bhBody);

/* Nebula jauh sebagai latar (murni visual) */
[['#7c3aed',-900,120,-700,700],['#0ea5e9',900,-80,-600,650],['#ec4899',100,200,1100,750]].forEach(([col,x,y,z,s])=>{
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(col),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0.35}));
  sp.position.set(x,y,z); sp.scale.set(s,s,1); scene.add(sp);
});

/* Sabuk asteroid Mars–Jupiter (InstancedMesh 3000) — bisa ditembak & dihancurkan */
const asteroidField=(()=>{
  const COUNT=3000, geo=new THREE.DodecahedronGeometry(0.22);
  const mat=new THREE.MeshStandardMaterial({color:0x8a7f70,roughness:1});
  const mesh=new THREE.InstancedMesh(geo,mat,COUNT);
  const dummy=new THREE.Object3D();
  const pos=new Float32Array(COUNT*3), rot=new Float32Array(COUNT*3), scale=new Float32Array(COUNT), alive=new Uint8Array(COUNT);
  for(let i=0;i<COUNT;i++){
    const a=Math.random()*Math.PI*2, r=78+Math.random()*10, s=0.4+Math.random()*1.4;
    pos[i*3]=Math.cos(a)*r; pos[i*3+1]=(Math.random()-0.5)*3; pos[i*3+2]=Math.sin(a)*r;
    rot[i*3]=Math.random()*3; rot[i*3+1]=Math.random()*3; rot[i*3+2]=0;
    scale[i]=s; alive[i]=1;
    dummy.position.set(pos[i*3],pos[i*3+1],pos[i*3+2]);
    dummy.rotation.set(rot[i*3],rot[i*3+1],rot[i*3+2]);
    dummy.scale.set(s,s,s); dummy.updateMatrix(); mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true; scene.add(mesh);
  const hide=i=>{ // hancur: matrix diskalakan 0 supaya tidak digambar
    alive[i]=0;
    dummy.position.set(pos[i*3],pos[i*3+1],pos[i*3+2]);
    dummy.rotation.set(rot[i*3],rot[i*3+1],rot[i*3+2]);
    dummy.scale.setScalar(0); dummy.updateMatrix(); mesh.setMatrixAt(i,dummy.matrix);
    mesh.instanceMatrix.needsUpdate=true;
  };
  return {COUNT,mesh,pos,rot,scale,alive,hide};
})();

/* ============ BIMA SAKTI & GALAKSI LAIN ============ */
function galaxyTexture(kind, palette){
  const c=document.createElement('canvas'); c.width=256; c.height=256;
  const g=c.getContext('2d'), cx=128, cy=128;
  let seed=7919; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  const [c0,c1,c2]=palette;
  const halo=g.createRadialGradient(cx,cy,4,cx,cy,122);
  halo.addColorStop(0,'rgba(255,255,255,.95)'); halo.addColorStop(.16,c0);
  halo.addColorStop(.5,'rgba(80,110,180,.30)'); halo.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=halo; g.beginPath(); g.arc(cx,cy,122,0,7); g.fill();
  if(kind==='spiral'){
    g.fillStyle=c2; g.globalAlpha=.5;
    g.beginPath(); g.ellipse(cx,cy,52,14,-0.45,0,7); g.fill(); g.globalAlpha=1;
    for(let arm=0;arm<2;arm++){
      for(let t=0;t<1;t+=0.0045){
        const a=t*Math.PI*2.7+arm*Math.PI, rad=7+t*108;
        g.globalAlpha=(1-t)*0.8;
        g.fillStyle=Math.random()<0.55?c1:c0;
        g.beginPath(); g.arc(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad*0.64,1.4+Math.random()*2.1,0,7); g.fill();
      }
    }
    g.globalAlpha=1;
    for(let i=0;i<180;i++){ const a=rnd()*Math.PI*2, rad=6+rnd()*112;
      g.fillStyle=rnd()<.3?c2:c1; g.globalAlpha=.2+rnd()*.45;
      g.beginPath(); g.arc(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad*.64,1+rnd()*2.8,0,7); g.fill(); }
  } else if(kind==='elliptical'){
    g.save(); g.translate(cx,cy); g.rotate(-0.3); g.scale(1,0.62);
    const gr=g.createRadialGradient(0,0,4,0,0,112);
    gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(.25,c0);
    gr.addColorStop(.62,c1); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(0,0,112,0,7); g.fill();
    g.strokeStyle='rgba(12,14,24,.85)'; g.lineWidth=8;
    g.beginPath(); g.moveTo(-108,4); g.quadraticCurveTo(0,-10,108,2); g.stroke();
    g.restore();
  } else {
    for(let i=0;i<520;i++){ const a=rnd()*Math.PI*2, rad=Math.pow(rnd(),0.6)*100;
      g.fillStyle=rnd()<.4?c0:c1; g.globalAlpha=.12+rnd()*.5;
      g.beginPath(); g.arc(122+Math.cos(a)*rad,128+Math.sin(a)*rad*.58,1.5+rnd()*6,0,7); g.fill(); }
  }
  g.globalAlpha=1;
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function makeGalaxy(o){
  const g=new THREE.Group();
  const mat=new THREE.SpriteMaterial({map:galaxyTexture(o.visual,o.palette),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.95});
  const sp=new THREE.Sprite(mat); sp.scale.set(o.scale[0],o.scale[1],1); g.add(sp);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(o.palette[1]),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.28}));
  halo.scale.set(o.scale[0]*1.28,o.scale[1]*1.28,1); g.add(halo);
  const label=addLabelSprite(o.name,640,128);
  label.scale.set(Math.max(34,o.scale[0]*0.32),Math.max(8,o.scale[0]*0.08),1);
  label.position.y=o.scale[1]*0.62+12; g.add(label);
  return {group:g, tick:dt=>{ mat.rotation+=0.035*dt; }};
}
function makeStar(o){
  const g=new THREE.Group();
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(o.warna),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.9}));
  halo.scale.set(o.scale,o.scale,1); g.add(halo);
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#ffffff'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  core.scale.set(o.scale*0.26,o.scale*0.26,1); g.add(core);
  if(o.id==='alpha-centauri'){
    [[0.5,0.1,-0.1,0.42],[-0.42,-0.06,0.12,0.3]].forEach(([x,y,z,sc])=>{
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#ffd27a'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.8}));
      sp.position.set(o.scale*x,o.scale*y,o.scale*z); sp.scale.set(o.scale*sc,o.scale*sc,1); g.add(sp);
    });
  }
  const label=addLabelSprite(o.name,512,96);
  label.scale.set(Math.max(22,o.scale*0.9),Math.max(5.5,o.scale*0.22),1);
  label.position.y=o.scale*0.62+5; g.add(label);
  return {group:g, tick:()=>{ halo.material.opacity=0.78+Math.sin(performance.now()*0.0016+o.scale)*0.16; }};
}
function makeCluster(o){
  const g=new THREE.Group();
  let seed=1234; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  const R=o.scale*0.5;
  for(let i=0;i<20;i++){
    const a=rnd()*Math.PI*2, r=rnd()*R, y=(rnd()-0.5)*R*0.5;
    const sc=o.scale*(0.12+rnd()*0.2);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(i%3?'#cfe4ff':'#ffffff'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.75}));
    sp.position.set(Math.cos(a)*r,y,Math.sin(a)*r); sp.scale.set(sc,sc,1); g.add(sp);
  }
  const haze=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(o.warna),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.35}));
  haze.scale.set(o.scale*1.5,o.scale*1.1,1); g.add(haze);
  const label=addLabelSprite(o.name,512,96);
  label.scale.set(Math.max(30,o.scale*0.6),Math.max(7,o.scale*0.14),1);
  label.position.y=o.scale*0.55+6; g.add(label);
  return {group:g, tick:dt=>{ haze.material.rotation+=0.01*dt; }};
}
function makeNebula(o){
  const g=new THREE.Group();
  [['#ff9ecb',0,0,o.scale*0.9,0.5],['#7fb0ff',o.scale*0.22,o.scale*0.12,o.scale*0.66,0.42],['#ffffff',-o.scale*0.16,-o.scale*0.1,o.scale*0.4,0.35]].forEach(([col,x,y,sc,op])=>{
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(col),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:op}));
    sp.position.set(x,y,0); sp.scale.set(sc,sc,1); g.add(sp);
  });
  let seed=555; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  for(let i=0;i<14;i++){
    const a=rnd()*Math.PI*2, r=rnd()*o.scale*0.4, sc=o.scale*(0.05+rnd()*0.05);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#ffffff'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.85}));
    sp.position.set(Math.cos(a)*r,(rnd()-0.5)*o.scale*0.4,Math.sin(a)*r); sp.scale.set(sc,sc,1); g.add(sp);
  }
  const label=addLabelSprite(o.name,512,96);
  label.scale.set(Math.max(36,o.scale*0.55),Math.max(8,o.scale*0.13),1);
  label.position.y=o.scale*0.5+8; g.add(label);
  return {group:g, tick:dt=>{ g.rotation.y+=0.02*dt; }};
}
function makeDeepBlackHole(o){
  const g=new THREE.Group(), R=o.renderRadius;
  const core=new THREE.Mesh(new THREE.SphereGeometry(R,32,32),new THREE.MeshBasicMaterial({color:0x000000}));
  g.add(core);
  const photon=new THREE.Mesh(new THREE.TorusGeometry(R*1.15,R*0.06,10,64),new THREE.MeshBasicMaterial({color:0xffdd88}));
  photon.rotation.x=Math.PI/2-0.35; g.add(photon);
  const disk=new THREE.Mesh(new THREE.RingGeometry(R*1.5,R*3.2,96,1),
    new THREE.MeshBasicMaterial({map:accretionTexture(),side:THREE.DoubleSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  disk.rotation.x=Math.PI/2-0.35; g.add(disk);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(o.warna),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0.8}));
  glow.scale.set(R*16,R*16,1); g.add(glow);
  const label=addLabelSprite(o.name,512,96);
  label.scale.set(Math.max(34,R*6),Math.max(8,R*1.4),1);
  label.position.y=R*4+10; g.add(label);
  return {group:g, tick:dt=>{ disk.rotation.z+=0.45*dt; photon.rotation.z-=0.25*dt; }};
}
function addDeepSkyObject(o){
  const built = o.visual==='blackhole'?makeDeepBlackHole(o)
    : o.visual==='star'?makeStar(o)
    : o.visual==='cluster'?makeCluster(o)
    : o.visual==='nebula'?makeNebula(o)
    : makeGalaxy(o);
  built.group.position.set(o.pos[0],o.pos[1],o.pos[2]);
  scene.add(built.group);
  bodies.push({data:o,mesh:built.group,angle:0,speed:0,spin:0,moons:[],fixed:true,isBlackHole:o.visual==='blackhole',tick:built.tick});
}
MILKYWAY.forEach(addDeepSkyObject);
GALAXIES.forEach(addDeepSkyObject);

/* ============ PESAWAT FUTURISTIK (sumbu +Y = depan/moncong) ============ */
function mat(c, emissive=0x000000, ei=0){ return new THREE.MeshStandardMaterial({color:c,roughness:0.35,metalness:0.75,emissive,emissiveIntensity:ei}); }
function glowM(c){ return new THREE.MeshBasicMaterial({color:c}); }
function whiteM(c=0xf2f6fc){ return new THREE.MeshStandardMaterial({color:c,roughness:0.42,metalness:0.25}); }
function addEngines(g,color,xs,y=-4.0,r=0.4,len=2.2){
  const grp=new THREE.Group(); grp.name='flame';
  xs.forEach(x=>{
    const f=new THREE.Mesh(new THREE.ConeGeometry(r,len,14),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.85}));
    f.position.set(x,y-len*0.5,0); f.rotation.x=Math.PI; grp.add(f);
    const core=new THREE.Mesh(new THREE.ConeGeometry(r*0.45,len*0.65,10),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9}));
    core.position.set(x,y-len*0.32,0); core.rotation.x=Math.PI; grp.add(core);
  });
  g.add(grp);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(color),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0.85}));
  const hs=Math.max(2.6,xs.length*1.9); halo.scale.set(hs,hs,1); halo.position.set(0,y,0); halo.name='engineHalo'; g.add(halo);
}
/* Planform ekstrusi: bentuk sayap/badan pada bidang XY (X = rentang, Y = maju),
   ketebalan ke Z (atas). Hasilnya badan aerodinamis bersayap — bukan tabung roket. */
function extrudePlanform(pts, depth, bevel, m){
  const sh=new THREE.Shape();
  pts.forEach(([x,y],i)=> i?sh.lineTo(x,y):sh.moveTo(x,y));
  sh.closePath();
  const geo=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,steps:1,curveSegments:6});
  geo.translate(0,0,-depth/2);
  m.side=THREE.DoubleSide;
  return new THREE.Mesh(geo,m);
}
function mirrorPts(pts){ return pts.map(([x,y])=>[-x,y]).reverse(); }
function glowTex(cssColor){
  if(_glowCache[cssColor])return _glowCache[cssColor];
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
  const gr=g.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,'#ffffff');gr.addColorStop(0.35,cssColor);gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,64,64);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;_glowCache[cssColor]=t;return t;
}
/* NSX Vanguard — interseptor sayap delta, badan lifting-body + kanopi kaca */
function buildVanguard(){
  const g=new THREE.Group(), accent=0x38e1ff;
  g.userData.lights={navX:4.45,navY:-1.0,navZ:0.05,strobeY:4.9,engineY:-4.4};
  const body=extrudePlanform([[0,5.1],[0.45,3.5],[0.95,1.6],[1.05,-0.5],[0.92,-2.4],[0.5,-3.7],[-0.5,-3.7],[-0.92,-2.4],[-1.05,-0.5],[-0.95,1.6],[-0.45,3.5]],0.6,0.3,whiteM(0xf2f6fc));
  body.scale.z=0.78; g.add(body);
  const spine=new THREE.Mesh(new THREE.BoxGeometry(0.42,3.4,0.26),whiteM(0xdbe6f4)); spine.position.set(0,0.2,0.36); g.add(spine);
  const canopy=new THREE.Mesh(new THREE.SphereGeometry(0.66,24,16,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshStandardMaterial({color:0x0b1622,roughness:0.05,metalness:0.9,emissive:0x38e1ff,emissiveIntensity:0.3,transparent:true,opacity:0.92}));
  canopy.scale.set(0.82,1.5,0.62); canopy.position.set(0,2.15,0.3); canopy.rotation.x=-0.16; g.add(canopy);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.035,8,28),glowM(accent));
  rim.rotation.x=Math.PI/2; rim.scale.set(1.15,1.7,1); rim.position.set(0,2.16,0.3); g.add(rim);
  const wingPts=[[0.9,1.85],[4.6,-0.7],[4.55,-1.65],[1.0,-2.9]];
  [-1,1].forEach(s=>{
    const w=extrudePlanform(s>0?wingPts:mirrorPts(wingPts),0.1,0.035,whiteM(0xf5f8fd));
    w.position.z=-0.06; g.add(w);
    const edge=new THREE.Mesh(new THREE.BoxGeometry(4.3,0.06,0.06),glowM(accent));
    edge.position.set(s*2.75,0.6,0.06); edge.rotation.z=s>0?-0.6:0.6; g.add(edge);
    const tip=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.8,0.55),whiteM(0xe0e9f5));
    tip.position.set(s*4.45,-1.15,0.28); tip.rotation.y=s*0.32; tip.rotation.x=-0.12; g.add(tip);
    const tipGlow=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.3,0.06),glowM(accent)); tipGlow.position.set(s*4.46,0.12,0.52); g.add(tipGlow);
    const nac=new THREE.Mesh(new THREE.CylinderGeometry(0.33,0.42,2.7,20),whiteM(0xe8eef7));
    nac.position.set(s*1.85,-2.55,0); g.add(nac);
    const intake=new THREE.Mesh(new THREE.TorusGeometry(0.35,0.06,10,24),glowM(accent));
    intake.rotation.x=Math.PI/2; intake.position.set(s*1.85,-1.2,0); g.add(intake);
    const fin=new THREE.Mesh(new THREE.BoxGeometry(0.07,1.1,0.9),whiteM(0xdde7f3));
    fin.position.set(s*0.6,-2.9,0.55); fin.rotation.z=s*0.28; fin.rotation.x=-0.22; g.add(fin);
  });
  addEngines(g,'#55e5ff',[-1.85,1.85],-3.95,0.42,2.4);
  return g;
}
/* NSX Odyssey — penjelajah sayap lebar, lambung katamaran + cincin warp nacelle */
function buildOdyssey(){
  const g=new THREE.Group(), accent=0xa78bfa;
  g.userData.lights={navX:4.95,navY:-0.6,navZ:0.05,strobeY:4.6,engineY:-4.3};
  const body=extrudePlanform([[0,5.0],[0.75,2.8],[1.15,0.6],[1.1,-2.4],[0.55,-3.9],[-0.55,-3.9],[-1.1,-2.4],[-1.15,0.6],[-0.75,2.8]],0.85,0.3,whiteM(0xf3f6fb));
  body.scale.z=0.8; g.add(body);
  const deck=new THREE.Mesh(new THREE.SphereGeometry(0.85,26,18,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshStandardMaterial({color:0x0d1226,roughness:0.04,metalness:0.9,emissive:0xa78bfa,emissiveIntensity:0.35,transparent:true,opacity:0.9}));
  deck.scale.set(0.8,2.1,0.7); deck.position.set(0,1.5,0.3); g.add(deck);
  [-1,1].forEach(s=>{
    const hull=extrudePlanform([[0,2.7],[0.6,1.2],[0.7,-2.9],[0.35,-3.7],[-0.35,-3.7],[-0.7,-2.9],[-0.6,1.2]],0.7,0.22,whiteM(0xf0f4fa));
    hull.position.set(s*2.9,0,0); hull.scale.z=0.85; g.add(hull);
    [ -3.4,-4.15 ].forEach(y=>{
      const ring=new THREE.Mesh(new THREE.TorusGeometry(0.85,0.1,10,32),glowM(accent));
      ring.rotation.x=Math.PI/2; ring.position.set(s*2.9,y,0); g.add(ring);
    });
    const fin=new THREE.Mesh(new THREE.BoxGeometry(0.08,1.35,1.1),whiteM(0xdae4f1));
    fin.position.set(s*2.9,-2.7,0.75); fin.rotation.z=s*0.3; fin.rotation.x=-0.25; g.add(fin);
    for(let i=0;i<4;i++){
      const win=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.22,0.12),glowM(0xffe9a8));
      win.position.set(s*3.28,-0.3-i*0.65,0.3); g.add(win);
    }
  });
  const wingPts=[[0.9,1.0],[4.45,0.1],[4.55,-2.7],[1.0,-2.3]];
  [-1,1].forEach(s=>{
    const w=extrudePlanform(s>0?wingPts:mirrorPts(wingPts),0.12,0.04,whiteM(0xf5f8fd));
    g.add(w);
    const strip=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.05,0.05),glowM(accent));
    strip.position.set(s*2.7,-0.75,0.08); strip.rotation.z=s>0?-0.24:0.24; g.add(strip);
    const pod=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,1.1,12),whiteM(0xe1eaf5));
    pod.rotation.x=Math.PI/2; pod.position.set(s*4.2,-1.9,0); g.add(pod);
  });
  addEngines(g,'#c084fc',[-2.9,2.9],-3.9,0.6,2.6);
  return g;
}
/* NSX Aurora — pengintai sayap maju (forward-swept) + panel surya emas */
function buildAurora(){
  const g=new THREE.Group(), accent=0x7dffb2, gold=0xc9a227;
  g.userData.lights={navX:4.15,navY:0.9,navZ:0.05,strobeY:5.3,engineY:-4.4};
  const body=extrudePlanform([[0,5.4],[0.3,3.6],[0.6,1.2],[0.68,-2.2],[0.4,-3.9],[-0.4,-3.9],[-0.68,-2.2],[-0.6,1.2],[-0.3,3.6]],0.5,0.22,whiteM(0xf2f5fa));
  body.scale.z=0.75; g.add(body);
  const canopy=new THREE.Mesh(new THREE.SphereGeometry(0.5,22,16,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshStandardMaterial({color:0x101a14,roughness:0.05,metalness:0.9,emissive:0x7dffb2,emissiveIntensity:0.3,transparent:true,opacity:0.92}));
  canopy.scale.set(0.75,1.5,0.6); canopy.position.set(0,2.3,0.28); canopy.rotation.x=-0.15; g.add(canopy);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(0.2,14,12),glowM(0xff5566)); eye.position.set(0,4.35,0.26); g.add(eye);
  const wingPts=[[0.6,2.4],[4.1,1.2],[3.95,0.25],[0.7,-2.1]];
  const panelPts=[[1.1,1.9],[3.7,1.0],[3.6,0.35],[1.2,-1.5]];
  [-1,1].forEach(s=>{
    const w=extrudePlanform(s>0?wingPts:mirrorPts(wingPts),0.09,0.03,whiteM(0xf5f8fd));
    w.position.z=-0.02; g.add(w);
    const panel=extrudePlanform(s>0?panelPts:mirrorPts(panelPts),0.03,0,new THREE.MeshStandardMaterial({color:gold,roughness:0.35,metalness:0.9,emissive:0x3a2600,emissiveIntensity:0.5}));
    panel.position.z=0.07; g.add(panel);
    const edge=new THREE.Mesh(new THREE.BoxGeometry(3.9,0.05,0.05),glowM(accent));
    edge.position.set(s*2.55,1.85,0.02); edge.rotation.z=s>0?-0.33:0.33; g.add(edge);
    const pod=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.16,1.0,10),whiteM(0xe1eaf5));
    pod.rotation.x=Math.PI/2; pod.position.set(s*3.95,0.85,0); g.add(pod);
    const fin=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.9,0.8),whiteM(0xdae4f1));
    fin.position.set(s*0.5,-2.7,0.45); fin.rotation.z=s*0.25; fin.rotation.x=-0.2; g.add(fin);
  });
  addEngines(g,'#7dffb2',[-0.75,0.75],-4.0,0.3,2.0);
  return g;
}
const builders={ 'nsx-vanguard':buildVanguard, 'nsx-odyssey':buildOdyssey, 'nsx-aurora':buildAurora };

/* Lampu navigasi + cahaya mesin agar pesawat jelas terlihat dalam gelap */
function addRocketLights(){
  if(rocketMesh.getObjectByName('navLights')) return;
  const L=rocketMesh.userData.lights||{navX:0.7,navY:4.2,navZ:0,strobeY:8.6,engineY:-2.2};
  const grp=new THREE.Group(); grp.name='navLights';
  const mk=(color,x)=>{
    const s=new THREE.Mesh(new THREE.SphereGeometry(0.1,10,10),
      new THREE.MeshBasicMaterial({color}));
    s.position.set(x,L.navY,L.navZ||0); grp.add(s);
  };
  mk(0xff3333,-L.navX); mk(0x33ff66,L.navX); // merah kiri, hijau kanan (standar penerbangan)
  const strobe=new THREE.Mesh(new THREE.SphereGeometry(0.09,10,10),
    new THREE.MeshBasicMaterial({color:0xffffff}));
  strobe.position.set(0,L.strobeY,0.2); strobe.name='strobe'; grp.add(strobe);
  const engine=new THREE.PointLight(0x66aaff,0,25); engine.position.set(0,L.engineY,0); engine.name='engineLight'; grp.add(engine);
  rocketMesh.add(grp);
}

const shipGroup = new THREE.Group(); scene.add(shipGroup);
const SHIP_SCALE=0.15; // lebih besar dari Bulan: panjang ~1,7 unit (⌀ Bulan render 1,1)
let rocketMesh = builders['nsx-vanguard'](); shipGroup.add(rocketMesh);
// posisi roket relatif kamera: hidung ke -Z (maju)
// Roket dibaringkan: moncong (+Y lokal) → depan kapal (-Z). Karena itu
// rotasinya -90° (bukan +90° yang justru menghadapkan moncong ke kamera).
// Badan membentang dari ekor (z≈-2.5, dekat kamera) sampai moncong jauh di depan.
rocketMesh.position.set(0,-1.0,-1.8);
rocketMesh.rotation.x = -Math.PI/2;
rocketMesh.scale.setScalar(SHIP_SCALE);
addRocketLights();
shipGroup.position.set(earth.mesh.position.x+8, 4, earth.mesh.position.z+8);
camera.position.set(0,1.6,1);
shipGroup.add(camera);

/* ============ STATE + KONTROL FPS ============ */
const S = { playing:false, cockpit:false, yaw:Math.PI, pitch:0, vel:new THREE.Vector3(), fuel:100,
  boost:false, warpDrive:false, timeWarp:1, target:null, follow:null, visited:new Set(), rocketId:'nsx-vanguard',
  sound:true, paused:false, nearBody:null, firing:false, laserCd:0, aimScanT:0, aimTarget:null };
const keys={};
addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(!S.playing) return;
  if(e.code==='KeyC') toggleCockpit();
  if(e.code==='KeyE') showNearestInfo();
  if(e.code==='KeyM') toggleMap();
  if(e.code==='KeyR') refuel();
  if(e.code==='KeyJ') toggleWarpDrive();
  if(e.code==='KeyH') document.getElementById('help-modal').classList.toggle('hidden');
  if(e.code==='Digit1') setRocket('nsx-vanguard');
  if(e.code==='Digit2') setRocket('nsx-odyssey');
  if(e.code==='Digit3') setRocket('nsx-aurora');
  if(e.code==='KeyF') S.firing=true;
  if(['Space','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup',e=>keys[e.code]=false);

canvas.addEventListener('click',()=>{ if(S.playing && !isTouch) canvas.requestPointerLock?.(); });
let isTouch = matchMedia('(pointer:coarse)').matches;
document.addEventListener('mousemove',e=>{
  if(document.pointerLockElement===canvas && S.playing && !S.paused){
    S.yaw -= e.movementX*0.0022; S.pitch -= e.movementY*0.0022;
    S.pitch=Math.max(-1.45,Math.min(1.45,S.pitch));
    if(S.target){S.target=null;restoreWarp();renderPlanetList();} // input manual batalkan autopilot
    if(S.follow){S.follow=null;restoreWarp();renderPlanetList();toast('🛸 Kontrol manual — mode ikuti planet dimatikan');}
  }
});
// ===== Kontrol sentuh: stik kiri = gerak, stik kanan = arah hadap =====
const joy={x:0,y:0,id:null,cx:0,cy:0};     // kiri: atas maju, bawah mundur, kiri/kanan strafe
const joyLook={x:0,y:0,id:null,cx:0,cy:0}; // kanan: atas/bawah pitch, kiri/kanan yaw
function bindStick(el,knobEl,state){
  if(!el||!knobEl)return;
  const R=60, DEAD=0.12;
  const update=t=>{
    let dx=(t.clientX-state.cx)/R, dy=(t.clientY-state.cy)/R;
    const m=Math.hypot(dx,dy);
    if(m<DEAD){ state.x=0; state.y=0; }
    else { const cl=Math.min(m,1); state.x=dx/m*cl; state.y=dy/m*cl; }
    knobEl.style.transform=`translate(${state.x*32}px,${state.y*32}px)`;
  };
  const reset=()=>{ state.id=null; state.x=state.y=0; knobEl.style.transform=''; };
  el.addEventListener('touchstart',e=>{
    e.preventDefault();
    const r=el.getBoundingClientRect();
    state.cx=r.left+r.width/2; state.cy=r.top+r.height/2;
    const t=e.changedTouches[0]; state.id=t.identifier; update(t);
  },{passive:false});
  el.addEventListener('touchmove',e=>{
    e.preventDefault();
    for(const t of e.changedTouches) if(t.identifier===state.id) update(t);
  },{passive:false});
  el.addEventListener('touchend',e=>{ for(const t of e.changedTouches) if(t.identifier===state.id) reset(); });
  el.addEventListener('touchcancel',reset);
}
bindStick(document.getElementById('joy-left'),document.getElementById('joy-knob'),joy);
bindStick(document.getElementById('joy-right'),document.getElementById('joy-knob2'),joyLook);

/* ============ AUDIO MESIN ============ */
let AC=null, engGain=null;
function initAudio(){
  if(AC) return;
  AC=new (window.AudioContext||window.webkitAudioContext)();
  const buf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);
  const d=buf.getChannelData(0); for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const src=AC.createBufferSource(); src.buffer=buf; src.loop=true;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=320;
  engGain=AC.createGain(); engGain.gain.value=0;
  src.connect(f).connect(engGain).connect(AC.destination); src.start();
}

/* ============ UI ============ */
const $=id=>document.getElementById(id);
function toast(msg,ms=2600){ const t=$('toast'); t.textContent=msg; t.style.display='block'; clearTimeout(t._h); t._h=setTimeout(()=>t.style.display='none',ms); }
function toggleCockpit(){ S.cockpit=!S.cockpit; $('cockpit').classList.toggle('hidden',!S.cockpit);
  // Kokpit: kamera di kursi pilot. Free-fly: kamera chase di belakang-atas
  // roket (+Z = belakang) sehingga badan pesawat full terlihat di depan.
  camera.position.set(0,S.cockpit?1.6:2.4,S.cockpit?1:5.5);
  rocketMesh.visible=true; toast(S.cockpit?'🪟 Mode Kokpit Imersif':'🎥 Mode Free-Fly FPS'); }
function toggleWarpDrive(){ S.warpDrive=!S.warpDrive; $('btn-warpdrive').classList.toggle('on',S.warpDrive); $('warp-lines').classList.toggle('on',S.warpDrive); }
function refuel(){ S.fuel=100; toast('⛽ Bahan bakar penuh!'); }
function setRocket(id){
  S.rocketId=id; shipGroup.remove(rocketMesh); rocketMesh=builders[id]();
  rocketMesh.position.set(0,-1.0,-1.8); rocketMesh.rotation.x=-Math.PI/2; rocketMesh.scale.setScalar(SHIP_SCALE); shipGroup.add(rocketMesh); addRocketLights();
  document.querySelectorAll('#rocket-select button').forEach(b=>b.classList.toggle('active',b.dataset.r===id));
  const r=ROCKETS.find(x=>x.id===id); $('rocket-spec').textContent=`${r.name} · ${r.asal} · Panjang ${r.tinggiM} · Penggerak ${r.thrust} — ${r.desc}`;
  toast(`🛸 Pesawat: ${r.name}`);
}
// daftar roket splash
ROCKETS.forEach((r,i)=>{
  const b=document.createElement('button'); b.dataset.r=r.id; b.innerHTML=`<b>${r.name}</b><br/><small>${r.asal}<br/>${r.tinggiM}</small>`;
  if(i===0)b.classList.add('active'); b.onclick=()=>setRocket(r.id); $('rocket-select').appendChild(b);
});
setRocket('nsx-vanguard');
document.querySelectorAll('#mode-select button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#mode-select button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  const want=b.dataset.mode==='cockpit'; if(want!==S.cockpit) toggleCockpit();
});
$('btn-cockpit').onclick=toggleCockpit; $('m-cockpit').onclick=toggleCockpit;
$('btn-warpdrive').onclick=toggleWarpDrive; $('m-warp').onclick=toggleWarpDrive;
$('btn-boost').onclick=()=>{S.boost=!S.boost;$('btn-boost').classList.toggle('on',S.boost);};
$('m-thrust').onclick=()=>{S.boost=!S.boost;toast(S.boost?'⚡ Boost ON':'Boost OFF');};
$('m-info').onclick=showNearestInfo;
document.querySelectorAll('.warp-btn').forEach(b=>b.onclick=()=>{
  if(S.target||S.follow){ toast('⏳ Warp waktu dikunci selama autopilot/mode ikuti (agar rendezvous presisi)'); return; }
  setTimeWarp(+b.dataset.warp); });
function setTimeWarp(w){
  S.timeWarp=w;
  document.querySelectorAll('.warp-btn').forEach(x=>x.classList.toggle('active',+x.dataset.warp===w));
}
function restoreWarp(){
  if(S.savedWarp!=null){ setTimeWarp(S.savedWarp); S.savedWarp=null; }
}
function toggleMap(){ $('map-panel').classList.toggle('hidden'); }
$('btn-map').onclick=toggleMap; $('map-close').onclick=toggleMap;
$('btn-help').onclick=()=>$('help-modal').classList.remove('hidden');
$('help-close').onclick=()=>$('help-modal').classList.add('hidden');
$('btn-pause').onclick=()=>{S.paused=!S.paused;if(S.paused){S.firing=false;S.aimTarget=null;updateAimHud(null);}toast(S.paused?'⏸️ Jeda — klik ▶ untuk lanjut':'▶ Lanjut');$('btn-pause').textContent=S.paused?'▶':'⏸️';};
$('btn-sound').onclick=e=>{S.sound=!S.sound;e.target.textContent=S.sound?'🔊':'🔇';if(engGain)engGain.gain.value=0;};
$('panel-close').onclick=closePanel;
$('pp-refuel').onclick=refuel;
$('pp-warp').onclick=()=>{ if(S.nearBody){ flyTo(S.nearBody.data.id); } };
$('btn-stop-nav').onclick=()=>{S.target=null;S.follow=null;restoreWarp();renderPlanetList();toast('Autopilot / mode ikuti dimatikan');};
$('btn-launch').onclick=()=>{
  S.playing=true; $('splash').style.display='none'; initAudio(); AC?.resume();
  toast('🛫 Lepas landas! Dekati objek langit untuk info · M untuk autopilot');
  canvas.requestPointerLock?.();
};
// daftar tujuan autopilot, dikelompokkan per wilayah
function bodyCategory(b){
  const id=b.data.id;
  if(PLANETS.some(p=>p.id===id)||BONUS.some(x=>x.id===id))return 0;
  if(EXOPLANETS.some(x=>x.id===id))return 1;
  if(id==='cygnus-x1'||MILKYWAY.some(x=>x.id===id))return 2;
  return 3;
}
function renderPlanetList(){
  const el=$('planet-list'); el.innerHTML='';
  const heads=['🪐 Tata Surya','✨ Eksoplanet','🌠 Bima Sakti','🌌 Galaksi Lain'];
  const groups=[[],[],[],[]];
  bodies.forEach(b=>groups[bodyCategory(b)].push(b));
  groups.forEach((arr,gi)=>{
    if(!arr.length)return;
    const h=document.createElement('h4'); h.className='planet-group'; h.textContent=heads[gi]; el.appendChild(h);
    arr.forEach(b=>{
      const dead=b.entity?.destroyed;
      const emo=b.data.emoji||(b.isBlackHole?'🕳️':'🪐');
      const badge=dead?'💥':(S.visited.has(b.data.id)?'✅':emo);
      const btn=document.createElement('button');
      btn.textContent=dead?`${badge} ${b.data.name} — hancur (respawn 60 dtk)`
        :`${badge} ${b.data.name} — ${b.data.jarakAU?b.data.jarakAU+' AU':(b.data.jarakLy||b.data.type)}`;
      if(S.target===b)btn.classList.add('target');
      if(S.visited.has(b.data.id))btn.classList.add('visited');
      if(dead)btn.disabled=true;
      else btn.onclick=()=>flyTo(b.data.id);
      el.appendChild(btn);
    });
  });
}
function flyTo(id){
  const b=bodies.find(x=>x.data.id===id); if(!b)return;
  if(b.entity?.destroyed){ toast('💥 Target hancur — tunggu respawn 60 detik'); return; }
  S.follow=null; S.target=b;
  // Kunci warp waktu ke 1x selama autopilot: planet super-cepat (Proxima:
  // 1 putaran ≈ 4 dtk) mustahil direndezvous saat time-warp besar.
  if(S.savedWarp==null)S.savedWarp=S.timeWarp;
  setTimeWarp(1);
  renderPlanetList(); toggleMapIfOpen(); $('hud-target').textContent=`🎯 ${b.data.name}`;
  toast(`🧭 Autopilot → ${b.data.name} (warp waktu 1× otomatis). Gerakkan mouse/WASD untuk batal.`);
}
function toggleMapIfOpen(){ if(!$('map-panel').classList.contains('hidden'))$('map-panel').classList.add('hidden'); }

function bodyInfoHTML(d){
  const cells=[];
  if(d.hp){
    const e=entityByDataId.get(d.id);
    cells.push(['❤️ Kesehatan',e?`${e.hp} / ${e.maxHp}`:`${d.hp} / ${d.hp}`]);
  }
  if(d.diameterKm)cells.push(['⌀ Diameter',d.diameterKm.toLocaleString('id-ID')+' km']);
  else if(d.diameterLy)cells.push(['⌀ Diameter',d.diameterLy]);
  else if(d.massa)cells.push(['⚖️ Massa',d.massa]);
  const dist=d.jarakAU?d.jarakAU+' AU (dari Matahari)':(d.jarakLy||'Mengorbit Bumi');
  cells.push(['📏 Jarak',dist]);
  if(d.suhu||d.suhuDisk)cells.push(['🌡️ Suhu',d.suhu||d.suhuDisk]);
  if(d.gravitasi)cells.push(['🌍 Gravitasi',d.gravitasi]);
  (d.info||[]).forEach(([k,v])=>cells.push([k,v]));
  return cells.map(([k,v])=>`<div><b>${k}</b><br/>${v}</div>`).join('');
}
function openPanel(d){
  S.panelKey=d.id||d.name;
  $('pp-name').textContent=d.name; $('pp-type').textContent=d.type||'';
  $('pp-grid').innerHTML=bodyInfoHTML(d); $('pp-desc').textContent=d.desc||'';
  $('pp-facts').innerHTML=(d.facts||[]).map(f=>`<li>${f}</li>`).join('');
  $('planet-panel').classList.remove('hidden');
}
function closePanel(){ $('planet-panel').classList.add('hidden'); S.panelKey=null; }
function showNearestInfo(){
  const nearSun=shipGroup.position.length()<30&&!sunEntity.destroyed;
  const d=S.nearBody?S.nearBody.data:(nearSun?SUN:null);
  if(!d){ toast('Belum dekat objek langit — terbang lebih dekat atau pakai autopilot (M)'); return; }
  const key=d.id||d.name, panel=$('planet-panel');
  // Tekan E sekali → buka, tekan lagi (planet sama) → tutup
  if(!panel.classList.contains('hidden')&&S.panelKey===key)closePanel();
  else openPanel(d);
}
$('scene').addEventListener('dblclick',showNearestInfo);

/* ============ ENTITAS LANGIT, LASER & SISTEM KERUSAKAN ============ */
const entities=[], entityByDataId=new Map();
function registerEntity(ent){ entities.push(ent); if(ent.data.id)entityByDataId.set(ent.data.id,ent); return ent; }
for(const b of bodies){
  const d=b.data;
  let hitRadius=(d.renderRadius||1)*1.1+0.15;
  if(b.fixed){
    const sc=Array.isArray(d.scale)?Math.max(d.scale[0],d.scale[1]):(d.scale||10);
    hitRadius=d.visual==='blackhole'?Math.max((d.renderRadius||4)*2.5,10):Math.max(sc*0.5,10);
  } else if(b.isBlackHole){
    hitRadius=Math.max((d.renderRadius||4)*2.2,10);
  }
  const ent={kind:'body',body:b,data:d,mesh:b.mesh,name:d.name,hitRadius,
    hp:d.hp||1,maxHp:d.hp||1,isBig:!!b.fixed||!!b.isBlackHole,
    destroyed:false,respawnAt:0,
    color:Array.isArray(d.warnaBase)?d.warnaBase[0]:(Array.isArray(d.palette)?d.palette[0]:(d.warna||'#cbd5e1'))};
  b.entity=ent; registerEntity(ent);
}
const moonEntity=registerEntity({kind:'moon',body:null,parent:earth,data:BONUS[0],mesh:moonMesh,name:'Bulan',hitRadius:0.8,
  hp:BONUS[0].hp,maxHp:BONUS[0].hp,isBig:false,destroyed:false,respawnAt:0,color:'#c9c9c9'});
const sunEntity=registerEntity({kind:'sun',body:null,data:SUN,mesh:sunMesh,name:'Matahari',hitRadius:12,
  hp:SUN.hp,maxHp:SUN.hp,isBig:true,destroyed:false,respawnAt:0,color:'#ffcc55'});

const LASER_RANGE=700, LASER_CD=0.17, RESPAWN_MS=60000;
const _camPos=new THREE.Vector3(), _camDir=new THREE.Vector3(), _shotEnd=new THREE.Vector3();
const _shipPos=new THREE.Vector3(), _camQ=new THREE.Quaternion(), _gunR=new THREE.Vector3(), _gunU=new THREE.Vector3();

function raySphere(ox,oy,oz,dx,dy,dz,cx,cy,cz,r){
  const lx=ox-cx,ly=oy-cy,lz=oz-cz;
  const b=lx*dx+ly*dy+lz*dz, c=lx*lx+ly*ly+lz*lz-r*r, disc=b*b-c;
  if(disc<0)return -1;
  const t=-b-Math.sqrt(disc);
  if(t>0)return t;
  const t2=-b+Math.sqrt(disc);
  return t2>0?t2:-1;
}

function findAimTarget(){
  camera.getWorldPosition(_camPos); camera.getWorldDirection(_camDir);
  let best=null, bestT=LASER_RANGE;
  for(const e of entities){
    if(e.destroyed)continue;
    const p=e.mesh.position;
    const t=raySphere(_camPos.x,_camPos.y,_camPos.z,_camDir.x,_camDir.y,_camDir.z,p.x,p.y,p.z,e.hitRadius);
    if(t>0&&t<bestT){
      bestT=t; best={kind:'entity',ent:e,t,point:new THREE.Vector3().copy(_camPos).addScaledVector(_camDir,t)};
    }
  }
  // asteroid: bantuan bidik halus (batu sangat kecil) maksimal 220 unit
  const aRange=Math.min(220,bestT);
  const A=asteroidField;
  for(let i=0;i<A.COUNT;i++){
    if(!A.alive[i])continue;
    const cx=A.pos[i*3],cy=A.pos[i*3+1],cz=A.pos[i*3+2];
    const lx=_camPos.x-cx,ly=_camPos.y-cy,lz=_camPos.z-cz;
    const t=-(lx*_camDir.x+ly*_camDir.y+lz*_camDir.z);
    if(t<0.5||t>aRange)continue;
    const px=lx+_camDir.x*t, py=ly+_camDir.y*t, pz=lz+_camDir.z*t;
    const rr=Math.max(0.45,0.22*A.scale[i]*2.1);
    if(px*px+py*py+pz*pz<=rr*rr){
      bestT=t; best={kind:'asteroid',index:i,t,point:new THREE.Vector3(_camPos.x+_camDir.x*t,_camPos.y+_camDir.y*t,_camPos.z+_camDir.z*t)};
    }
  }
  return best;
}

const aimHud=$('aim-hud');
function updateAimHud(hit){
  if(!hit){ aimHud.classList.add('hidden'); $('crosshair').classList.remove('locked'); return; }
  aimHud.classList.remove('hidden'); $('crosshair').classList.add('locked');
  if(hit.kind==='asteroid'){
    $('aim-name').textContent='🪨 Asteroid';
    $('aim-fill').style.width='100%';
    $('aim-hp').textContent='HP 1 / 1';
  } else {
    const e=hit.ent;
    $('aim-name').textContent=`${e.data.emoji||(e.kind==='sun'?'☀️':'🪐')} ${e.name}`;
    const pct=Math.max(0,e.hp/e.maxHp*100);
    $('aim-fill').style.width=pct+'%';
    $('aim-hp').textContent=`HP ${e.hp} / ${e.maxHp}`;
  }
}
function flashCrosshair(){ const c=$('crosshair'); c.classList.add('hit'); clearTimeout(c._h); c._h=setTimeout(()=>c.classList.remove('hit'),120); }

/* --- suara laser & ledakan (WebAudio, ikut toggle) --- */
let _lastBoom=0;
function sfxLaser(){
  if(!S.sound||!AC)return;
  const t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain();
  o.type='square'; o.frequency.setValueAtTime(1300,t); o.frequency.exponentialRampToValueAtTime(220,t+0.09);
  g.gain.setValueAtTime(0.07,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.1);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t+0.11);
}
function sfxExplosion(big=false){
  if(!S.sound||!AC)return;
  const now=performance.now(); if(now-_lastBoom<70)return; _lastBoom=now;
  const dur=big?0.9:0.3, sr=AC.sampleRate, buf=AC.createBuffer(1,Math.floor(sr*dur),sr), d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,big?2:3);
  const src=AC.createBufferSource(); src.buffer=buf;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=big?240:650;
  const g=AC.createGain(); g.gain.value=big?0.45:0.2;
  src.connect(f).connect(g).connect(AC.destination); src.start();
}

/* --- efek visual: beam, flash, pecahan --- */
const beams=[];
for(let i=0;i<18;i++){
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
  const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x66eaff,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false}));
  line.frustumCulled=false; line.visible=false; scene.add(line); beams.push({line,life:0});
}
let _beamI=0;
function addBeam(from,to,color=0x66eaff){
  const b=beams[_beamI++%beams.length], a=b.line.geometry.attributes.position;
  a.setXYZ(0,from.x,from.y,from.z); a.setXYZ(1,to.x,to.y,to.z); a.needsUpdate=true;
  b.line.material.color.set(color); b.line.material.opacity=0.95; b.line.visible=true; b.life=0.1;
}
const flashes=[];
function addFlash(pos,color,size,life=0.22){
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(color),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.95}));
  sp.position.copy(pos); sp.scale.set(size,size,1); scene.add(sp);
  flashes.push({sp,life,max:life,size});
}
const debris=[], debrisGeo=new THREE.TetrahedronGeometry(1,0);
function entityColors(e){
  if(Array.isArray(e.data.warnaBase))return e.data.warnaBase;
  if(Array.isArray(e.data.palette))return e.data.palette;
  if(e.data.warna)return [e.data.warna,'#ffffff'];
  return [e.color||'#cbd5e1','#8899aa'];
}
function spawnDebris(pos,colors,count,power,sizeBase){
  for(let i=0;i<count;i++){
    const col=colors[Math.floor(Math.random()*colors.length)];
    const m=new THREE.Mesh(debrisGeo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:1}));
    m.position.copy(pos).add(new THREE.Vector3((Math.random()-0.5)*sizeBase*4,(Math.random()-0.5)*sizeBase*4,(Math.random()-0.5)*sizeBase*4));
    m.scale.setScalar(sizeBase*(0.5+Math.random()*1.2)); scene.add(m);
    const vel=new THREE.Vector3(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5).normalize().multiplyScalar(power*(0.5+Math.random()));
    debris.push({mesh:m,vel,spin:new THREE.Vector3(Math.random()*4,Math.random()*4,Math.random()*4),life:1.3+Math.random()*0.9,max:2.2});
  }
  while(debris.length>260){ const d=debris.shift(); scene.remove(d.mesh); d.mesh.material.dispose(); }
}

function destroyAsteroid(i,point){
  asteroidField.hide(i);
  addFlash(point,'#ffcf8a',1.5,0.28);
  spawnDebris(point,['#8a7f70','#b3a795','#5c5448'],8,5,0.16);
  sfxExplosion(false); flashCrosshair();
}

function destroyEntity(ent,point){
  ent.destroyed=true; ent.hp=0; ent.respawnAt=performance.now()+RESPAWN_MS;
  if(ent.kind==='sun'){ sunMesh.visible=false; glow.visible=false; sunLight.intensity=0; }
  else ent.mesh.visible=false;
  if(ent.body?.moons)for(const m of ent.body.moons)m.mesh.visible=false;
  const pos=point?point.clone():ent.mesh.position.clone();
  addFlash(pos,ent.kind==='sun'?'#ffdd66':(ent.data.warna||ent.color||'#ffcc88'),Math.max(2.5,ent.hitRadius*0.55),0.75);
  spawnDebris(pos,entityColors(ent),ent.isBig?34:22,ent.isBig?13:8,Math.max(0.14,ent.hitRadius*0.085));
  sfxExplosion(true); flashCrosshair();
  if(S.target===ent.body){ S.target=null; restoreWarp(); $('hud-target').textContent='🎯 —'; }
  if(S.follow===ent.body)S.follow=null;
  if(S.nearBody&&S.nearBody.data.id===ent.data.id)S.nearBody=null;
  if(S.panelKey===ent.data.id)closePanel();
  S.aimTarget=null; updateAimHud(null);
  toast(`${ent.kind==='sun'?'☀️ Matahari':(ent.data.emoji||'💥')+' '+ent.name} hancur! Respawn 60 dtk.`,3600);
  renderPlanetList();
}

function respawnEntity(ent){
  ent.destroyed=false; ent.hp=ent.maxHp; ent.respawnAt=0;
  if(ent.kind==='sun'){ sunMesh.visible=true; glow.visible=true; sunLight.intensity=2.2; }
  else if(ent.kind==='moon')ent.mesh.visible=!ent.parent?.entity?.destroyed;
  else ent.mesh.visible=true;
  if(ent.body?.moons)for(const m of ent.body.moons){
    if(m.mesh===moonMesh && moonEntity.destroyed)continue;
    m.mesh.visible=true;
  }
  const p=ent.mesh.position;
  if(shipGroup.position.distanceTo(p)<ent.hitRadius+2){
    _shotEnd.copy(shipGroup.position).sub(p); if(_shotEnd.lengthSq()<1e-6)_shotEnd.set(0,0,1);
    shipGroup.position.copy(p).addScaledVector(_shotEnd.normalize(),ent.hitRadius+6);
  }
  addFlash(p,'#aef6ff',Math.max(3,ent.hitRadius*0.6),0.5);
  toast(`♻️ ${ent.name} kembali!`,2200); renderPlanetList();
}

function fireLaser(){
  if(!S.playing||S.paused||S.laserCd>0)return;
  S.laserCd=LASER_CD;
  const hit=findAimTarget();
  camera.getWorldPosition(_camPos); camera.getWorldDirection(_camDir);
  _shotEnd.copy(_camPos).addScaledVector(_camDir,LASER_RANGE);
  if(hit)_shotEnd.copy(hit.point);
  shipGroup.getWorldPosition(_shipPos); camera.getWorldQuaternion(_camQ);
  _gunR.set(1,0,0).applyQuaternion(_camQ); _gunU.set(0,1,0).applyQuaternion(_camQ);
  const muzzle=_shipPos.clone().addScaledVector(_camDir,1.8);
  const left=muzzle.clone().addScaledVector(_gunR,0.55).addScaledVector(_gunU,-0.12);
  const rightGun=muzzle.clone().addScaledVector(_gunR,-0.55).addScaledVector(_gunU,-0.12);
  addBeam(left,_shotEnd); addBeam(rightGun,_shotEnd);
  addFlash(left,'#aef6ff',0.55,0.08); addFlash(rightGun,'#aef6ff',0.55,0.08);
  sfxLaser();
  if(!hit)return;
  addFlash(_shotEnd,'#ffd7a0',hit.kind==='asteroid'?0.9:Math.min(5,1.8+(hit.ent?hit.ent.hitRadius*0.05:0)),0.22);
  if(hit.kind==='asteroid'){ destroyAsteroid(hit.index,_shotEnd); return; }
  const e=hit.ent;
  e.hp=Math.max(0,e.hp-1); flashCrosshair(); updateAimHud(hit);
  if(e.hp<=0)destroyEntity(e,_shotEnd);
  else spawnDebris(_shotEnd,entityColors(e),3,4,0.08);
}

function updateCombat(dt){
  S.laserCd=Math.max(0,S.laserCd-dt);
  S.aimScanT-=dt;
  if(S.aimScanT<=0){ S.aimScanT=0.1; S.aimTarget=findAimTarget(); updateAimHud(S.aimTarget); }
  if(S.firing&&S.laserCd<=0)fireLaser();
}

function updateEffects(dt){
  for(const b of beams){ if(b.life>0){ b.life-=dt; if(b.life<=0)b.line.visible=false; else b.line.material.opacity=b.life*9.5; } }
  for(let i=flashes.length-1;i>=0;i--){
    const f=flashes[i]; f.life-=dt;
    if(f.life<=0){ scene.remove(f.sp); f.sp.material.dispose(); flashes.splice(i,1); continue; }
    const k=1-f.life/f.max; f.sp.material.opacity=Math.max(0,f.life/f.max); f.sp.scale.setScalar(f.size*(1+k*1.6));
  }
  for(let i=debris.length-1;i>=0;i--){
    const d=debris[i]; d.life-=dt;
    if(d.life<=0){ scene.remove(d.mesh); d.mesh.material.dispose(); debris.splice(i,1); continue; }
    d.mesh.position.addScaledVector(d.vel,dt); d.vel.multiplyScalar(0.985);
    d.mesh.rotation.x+=d.spin.x*dt; d.mesh.rotation.y+=d.spin.y*dt; d.mesh.rotation.z+=d.spin.z*dt;
    d.mesh.material.opacity=Math.max(0,d.life/d.max); d.mesh.scale.multiplyScalar(1-dt*0.16);
  }
  const now=performance.now();
  for(const e of entities)if(e.destroyed&&now>=e.respawnAt)respawnEntity(e);
}

// input laser
addEventListener('keyup',e=>{ if(e.code==='KeyF')S.firing=false; });
canvas.addEventListener('mousedown',e=>{
  if(e.button===0&&document.pointerLockElement===canvas&&S.playing&&!S.paused)S.firing=true;
});
addEventListener('mouseup',e=>{ if(e.button===0)S.firing=false; });
addEventListener('blur',()=>{ S.firing=false; });
{
  const mf=$('m-fire');
  if(mf){
    const start=e=>{ e.preventDefault(); if(S.playing&&!S.paused)S.firing=true; };
    const stop=e=>{ e.preventDefault(); S.firing=false; };
    mf.addEventListener('pointerdown',start); mf.addEventListener('pointerup',stop);
    mf.addEventListener('pointercancel',stop); mf.addEventListener('pointerleave',stop);
  }
}


/* ============ MINIMAP ============ */
const mm=$('minimap').getContext('2d');
const MAP_R=Math.max(...bodies.map(b=>b.data.orbitRadius||0))+30; // skala dinamis s/d lubang hitam
function drawMap(){
  mm.clearRect(0,0,260,260); mm.fillStyle='#02040c'; mm.fillRect(0,0,260,260);
  const sc=126/MAP_R, cx=130, cy=130;
  mm.fillStyle='#ffcc44'; mm.beginPath(); mm.arc(cx,cy,6,0,7); mm.fill();
  for(const b of bodies){
    if(!b.data.orbitRadius||b.entity?.destroyed)continue;
    mm.strokeStyle=b.isBlackHole?'rgba(200,60,80,.5)':'rgba(80,140,220,.3)'; mm.beginPath(); mm.arc(cx,cy,b.data.orbitRadius*sc,0,7); mm.stroke();
    const bx=cx+b.mesh.position.x*sc, bz=cy+b.mesh.position.z*sc;
    mm.fillStyle=b.isBlackHole?'#ff3355':(S.visited.has(b.data.id)?'#22c55e':(S.target===b?'#38e1ff':'#fff'));
    mm.beginPath(); mm.arc(bx,bz,S.target===b?5:3.5,0,7); mm.fill();
    if(S.target===b||b.isBlackHole){mm.fillStyle=b.isBlackHole?'#ff6677':'#38e1ff';mm.font='11px sans-serif';mm.fillText(b.data.name,bx+7,bz);}
  }
  // target luar peta (bima sakti/galaksi) ditandai di tepi lingkaran
  if(S.target&&S.target.fixed){
    const tx=cx+S.target.mesh.position.x*sc, tz=cy+S.target.mesh.position.z*sc;
    const tdx=tx-cx, tdz=tz-cy, tdd=Math.hypot(tdx,tdz)||1;
    const bx=cx+tdx/tdd*118, bz=cy+tdz/tdd*118;
    mm.fillStyle='#a78bfa'; mm.beginPath(); mm.arc(bx,bz,4,0,7); mm.fill();
    mm.font='10px sans-serif'; mm.fillText('🌌',bx+6,bz+3);
  }
  let sx=cx+shipGroup.position.x*sc, sz=cy+shipGroup.position.z*sc;
  const sdx=sx-cx, sdz=sz-cy, sdd=Math.hypot(sdx,sdz);
  if(sdd>120){ sx=cx+sdx/sdd*120; sz=cy+sdz/sdd*120; }
  mm.fillStyle='#ff5555'; mm.save(); mm.translate(sx,sz); mm.rotate(-S.yaw);
  mm.beginPath(); mm.moveTo(0,-7); mm.lineTo(5,5); mm.lineTo(-5,5); mm.closePath(); mm.fill(); mm.restore();
}

/* ============ LOOP UTAMA ============ */
const clock=new THREE.Clock();
const fwd=new THREE.Vector3(), right=new THREE.Vector3(), upV=new THREE.Vector3(), tmp=new THREE.Vector3(), tmp2=new THREE.Vector3(), tmp3=new THREE.Vector3();
let fpsA=60;

/* Kecepatan orbit sesaat sebuah body (vektor singgung), mengikuti timeWarp */
function bodyVelocity(b, out){
  const w=(b.speed||0)*S.timeWarp, R=b.data.orbitRadius||0;
  out.set(-Math.sin(b.angle)*R*w, 0, Math.cos(b.angle)*R*w);
  return out;
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),0.05);
  fpsA=fpsA*0.95+(1/Math.max(dt,1e-4))*0.05;

  // orbit planet (timeWarp mempercepat revolusi edukatif)
  const t=dt*S.timeWarp;
  for(const b of bodies){
    if(b.fixed){ if(!b.entity?.destroyed&&b.tick)b.tick(dt); continue; } // objek statis: bima sakti & galaksi lain
    b.angle+=b.speed*t; b.mesh.position.set(Math.cos(b.angle)*b.data.orbitRadius,0,Math.sin(b.angle)*b.data.orbitRadius);
    b.mesh.rotation.y+=b.spin*dt*S.timeWarp;
    for(const m of b.moons){ m.angle+=m.speed*t; m.mesh.position.set(b.mesh.position.x+Math.cos(m.angle)*m.dist,0.5,b.mesh.position.z+Math.sin(m.angle)*m.dist); }
  }
  sunMesh.rotation.y+=dt*0.02;
  bhDisk.rotation.z+=dt*0.5; photon.rotation.z-=dt*0.25; // cakram akresi berputar
  updateEffects(dt);

  if(S.playing && !S.paused){
    // stik kanan: arahkan kapal (analog, kecepatan putar halus)
    if(isTouch&&(joyLook.x||joyLook.y)){
      const turn=1.45;
      S.yaw-=joyLook.x*turn*dt;
      S.pitch-=joyLook.y*turn*dt;
      S.pitch=Math.max(-1.45,Math.min(1.45,S.pitch));
    }
    // orientasi kapal dari yaw/pitch
    shipGroup.quaternion.setFromEuler(new THREE.Euler(S.pitch,S.yaw,0,'YXZ'));
    shipGroup.getWorldDirection(fwd); fwd.negate(); // -Z = maju
    right.crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize();
    upV.crossVectors(right,fwd).normalize();

    // Input manual (tombol gerak / joystick) membatalkan autopilot & mode ikuti
    const manualThrust=keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD||keys.Space||keys.ControlLeft||keys.KeyQ||Math.abs(joy.x)>0.15||Math.abs(joy.y)>0.15||Math.abs(joyLook.x)>0.15||Math.abs(joyLook.y)>0.15;
    if(manualThrust&&(S.target||S.follow)){
      S.target=null;
      if(S.follow){S.follow=null; toast('🛸 Kontrol manual — mode ikuti planet dimatikan');}
      restoreWarp(); renderPlanetList();
    }

    // autopilot rendezvous: tembak titik intersepsi + samakan kecepatan planet
    if(S.target){
      const T=S.target;
      bodyVelocity(T,tmp2); // kecepatan orbit planet saat ini
      const pv=tmp2.length();
      tmp.copy(T.mesh.position).sub(shipGroup.position);
      const dist=tmp.length();
      // prediksi: planet bergerak selama kita mendekat → bidik titik depannya
      const closing=Math.max(S.vel.length(),25);
      tmp.addScaledVector(tmp2,Math.min(dist/closing,2));
      const pl=tmp.length()||1;
      const wantYaw=Math.atan2(-tmp.x,-tmp.z), wantPitch=Math.asin(THREE.MathUtils.clamp(tmp.y/pl,-1,1));
      let dy=wantYaw-S.yaw; while(dy>Math.PI)dy-=Math.PI*2; while(dy<-Math.PI)dy+=Math.PI*2;
      // laju belok ADAPTIF: target dekat & cepat (eksoplanet) butuh belok agresif
      // s/d 12/s — laju tetap 2,5/s mustahil mengejar target bermanuver cepat
      const track=Math.min(12,Math.max(2.5,(S.vel.length()+pv)/Math.max(dist,4)));
      S.yaw+=dy*Math.min(1,dt*track); S.pitch+=(wantPitch-S.pitch)*Math.min(1,dt*track);
      shipGroup.quaternion.setFromEuler(new THREE.Euler(S.pitch,S.yaw,0,'YXZ'));
      shipGroup.getWorldDirection(fwd); fwd.negate();
      // thrust: samakan kecepatan planet DULU, lalu tutup jarak perlahan.
      // closeSp = kecepatan mendekat RELATIF (proporsional jarak) — tanpa batas
      // maksimal, jadi planet secepat apa pun tetap terkejar tanpa overshoot.
      const closeSp=Math.min(Math.max(dist*1.5,1.5),400*S.timeWarp);
      tmp.normalize().multiplyScalar(closeSp).add(tmp2);
      // lerp velocity ikut dipercepat saat sudah dekat target cepat
      S.vel.lerp(tmp,Math.min(1,dt*Math.min(10,3+100/Math.max(dist,8))));
      // (sengaja TIDAK ada clamp/setLength di sini — mode ini unlimited)
      const flameAP=rocketMesh.getObjectByName('flame');
      if(flameAP){flameAP.visible=true;flameAP.scale.setScalar(1+Math.random()*0.4);}
      const haloAP=rocketMesh.getObjectByName('engineHalo');
      if(haloAP)haloAP.visible=true;
      const engAP=rocketMesh.getObjectByName('engineLight');
      if(engAP)engAP.intensity=3;
      const arriveBase=T.data.arriveRadius||(T.isBlackHole?30:Math.max(12,T.data.renderRadius*2+6));
      const arrive=arriveBase*(1+Math.log10(S.timeWarp)); // jendela tiba ikut membesar saat warp
      if(dist<arrive){
        bodyVelocity(T,S.vel); // samakan kecepatan penuh → melayang bersama planet
        S.follow=T; S.target=null; restoreWarp();
        S.visited.add(T.data.id); openPanel(T.data); renderPlanetList(); updateVisited();
        $('hud-target').textContent='🎯 —';
        toast(`🛰️ Tiba di ${T.data.name} — kecepatan disamakan, pesawat mengikutinya. Tekan E kapan saja untuk info.`);
      }
    } else if(S.follow){
      // MODE IKUTI: parkir di SISI SIANG planet (sisi menghadap Matahari,
      // bukan di atas kutub) sedekat mungkin + kapal selalu menghadap planet
      // agar detail permukaan terlihat jelas.
      const F=S.follow;
      bodyVelocity(F,tmp2);
      const stand=F.data.hoverRadius||(F.isBlackHole?20:(F.data.renderRadius*1.8+2));
      // arah dari planet ke Matahari (Matahari di 0,0,0) = sisi siang
      tmp.copy(F.mesh.position);
      if(tmp.lengthSq()<1e-4)tmp.set(0,0,1);
      tmp.normalize().multiplyScalar(-stand);
      tmp.y+=stand*0.25; // sedikit di atas ekliptika → sudut pandang 3/4
      tmp.add(F.mesh.position); // = titik hover
      // hadapkan hidung kapal tepat ke pusat planet
      tmp3.copy(F.mesh.position).sub(shipGroup.position);
      const fd=tmp3.length()||1;
      const fYaw=Math.atan2(-tmp3.x,-tmp3.z), fPitch=Math.asin(THREE.MathUtils.clamp(tmp3.y/fd,-1,1));
      let fdy=fYaw-S.yaw; while(fdy>Math.PI)fdy-=Math.PI*2; while(fdy<-Math.PI)fdy+=Math.PI*2;
      S.yaw+=fdy*Math.min(1,dt*3); S.pitch+=(fPitch-S.pitch)*Math.min(1,dt*3);
      tmp.sub(shipGroup.position); // vektor koreksi menuju hover
      if(tmp.length()>100)tmp.setLength(100);
      tmp.multiplyScalar(F.isBlackHole?4:1.2);
      if(tmp.length()>160)tmp.setLength(160);
      tmp.add(tmp2); // + kecepatan planet → formasi terkunci
      S.vel.lerp(tmp,Math.min(1,dt*2));
      const flameF=rocketMesh.getObjectByName('flame');
      if(flameF){flameF.visible=true;flameF.scale.setScalar(0.9+Math.random()*0.3);}
      const haloF=rocketMesh.getObjectByName('engineHalo');
      if(haloF)haloF.visible=true;
      const engF=rocketMesh.getObjectByName('engineLight');
      if(engF)engF.intensity=1.5;
    } else {
      // input manual FPS
      const acc=new THREE.Vector3();
      if(keys.KeyW)acc.add(fwd); if(keys.KeyS)acc.sub(fwd);
      if(keys.KeyD)acc.add(right); if(keys.KeyA)acc.sub(right);
      if(keys.Space)acc.add(upV); if(keys.ControlLeft||keys.KeyQ)acc.sub(upV);
      acc.addScaledVector(right,joy.x);   // stik kiri: kiri/kanan = strafe
      acc.addScaledVector(fwd,-joy.y);    // stik kiri: atas = maju, bawah = mundur
      if(document.getElementById('m-thrust')?.classList.contains('on'))acc.add(fwd);
      const thrusting=acc.lengthSq()>0.01;
      let max=8.125; // default tanpa boost = 50 km/dtk di HUD
      if(keys.ShiftLeft||keys.ShiftRight||S.boost)max=130; if(S.warpDrive)max=650;
      if(thrusting&&S.fuel>0){
        // joystick analog: dorongan ikut seberapa jauh tuas digeser (kontrol halus)
        const joyMag=Math.min(1,Math.hypot(joy.x,joy.y));
        const btnThrust=document.getElementById('m-thrust')?.classList.contains('on');
        const keyMove=keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD||keys.Space||keys.ControlLeft||keys.KeyQ;
        const analog=(keyMove||btnThrust)?1:Math.max(0.3,joyMag);
        acc.normalize().multiplyScalar(max*2.2*dt*analog);
        S.vel.add(acc);
        S.fuel=Math.max(0,S.fuel-(S.warpDrive?14:(max>42?5:1.4))*dt);
        if(S.fuel<=0)toast('⚠️ BBM habis! Tekan R untuk isi ulang.');
      } else {
        S.vel.multiplyScalar(Math.pow(0.4,dt)); // inertia redam
        S.fuel=Math.min(100,S.fuel+4*dt);
      }
      if(S.vel.length()>max)S.vel.setLength(max);
      // api + getar kokpit + cahaya mesin
      const flame=rocketMesh.getObjectByName('flame');
      if(flame){flame.visible=thrusting&&S.fuel>0;flame.scale.setScalar(0.8+Math.random()*0.5+(S.warpDrive?0.8:0));}
      const halo=rocketMesh.getObjectByName('engineHalo');
      if(halo){halo.visible=thrusting&&S.fuel>0;halo.material.opacity=0.5+Math.random()*0.4;}
      const engL=rocketMesh.getObjectByName('engineLight');
      if(engL)engL.intensity=(thrusting&&S.fuel>0)?(S.warpDrive?5:2.5):0;
      if(engGain&&AC){ const g=S.sound?(thrusting?0.25:(S.warpDrive?0.3:0.02)):0; engGain.gain.setTargetAtTime(g,AC.currentTime,0.1); }
      if(S.cockpit&&thrusting){ camera.position.x=(Math.random()-0.5)*0.03; }
    }
    shipGroup.position.addScaledVector(S.vel,dt);
    // strobo kedip agar pesawat mudah terlihat
    const strobe=rocketMesh.getObjectByName('strobe');
    if(strobe)strobe.visible=(performance.now()%1000)<120;
    // batas dunia: pantulkan lembut
    if(shipGroup.position.length()>2000){ shipGroup.position.setLength(2000); S.vel.multiplyScalar(-0.3); toast('🌌 Ujung simulasi — berbalik!'); }
    // hindari masuk matahari
    if(shipGroup.position.length()<16){ shipGroup.position.setLength(16); S.vel.multiplyScalar(0.2); toast('☀️ Terlalu panas! Menjauhlah dari Matahari.'); }
    // GRAVITASI LUBANG HITAM: menarik pesawat dalam radius 80, horizon di ~8
    // (dinonaktifkan saat mode ikuti BH: thruster penstabil otomatis mengimbangi)
    if(!(S.follow&&S.follow.isBlackHole)&&!bhBody.entity?.destroyed){
    {
      tmp.copy(bhBody.mesh.position).sub(shipGroup.position);
      const dBH=tmp.length();
      if(dBH<80){
        const pull=(1-dBH/80)*55*dt; // makin dekat makin kuat
        S.vel.addScaledVector(tmp.normalize(),pull);
        if(!S._bhW||performance.now()-S._bhW>5000){ S._bhW=performance.now(); toast('⚠️ Gravitasi lubang hitam menarikmu! Thrust menjauh / warp untuk kabur!'); }
        if(dBH<BLACKHOLE.renderRadius+2.5){ // menyentuh horizon: terlontar keluar
          S.vel.copy(tmp.multiplyScalar(-14)); // ketapel gravitasi
          shipGroup.position.copy(bhBody.mesh.position).addScaledVector(tmp.normalize(),BLACKHOLE.renderRadius+10);
          S.fuel=Math.max(0,S.fuel-25);
          toast('🌀 Kamu menyentuh horizon peristiwa dan terlontar! −25% BBM.');
        }
      }
    }
    }

    // deteksi objek terdekat. Skor = jarak / nearRadius (bukan jarak mentah),
    // supaya galaksi jauh tidak kalah oleh planet yang kebetulan searah.
    let best=null,bestScore=1;
    const consider=(b,dist)=>{
      if(!b||!b.data)return;
      if(b.entity?.destroyed)return;
      const nr=b.data.nearRadius||((b.data.renderRadius||0)*4+6);
      const score=dist/nr;
      if(score<bestScore){bestScore=score;best=b;}
    };
    for(const b of bodies)consider(b,shipGroup.position.distanceTo(b.mesh.position));
    // bulan juga bisa diinfo
    if(!moonEntity.destroyed&&moonMesh.visible)consider({data:BONUS[0],mesh:moonMesh},shipGroup.position.distanceTo(moonMesh.position));
    S.nearBody=best;
    if(S.nearBody && !S.target){
      $('prompt-info').style.display='block';
      $('prompt-info').innerHTML=`Dekat <b>${S.nearBody.data.name}</b> — tekan <b>E</b> untuk info`;
      if(!S.visited.has(S.nearBody.data.id)){
        S.visited.add(S.nearBody.data.id); updateVisited(); renderPlanetList(); refuelSilent();
        if(PLANETS.some(p=>p.id===S.nearBody.data.id)){
          const pc=[...S.visited].filter(id=>PLANETS.some(p=>p.id===id)).length;
          toast(`✅ Terkunjungi: ${S.nearBody.data.name} (planet ${pc}/8)`);
        } else toast(`✅ Terkunjungi: ${S.nearBody.data.name} — ${S.nearBody.data.type||'objek langit dalam'}`);
      }
    } else $('prompt-info').style.display='none';

    updateCombat(dt);

    // HUD — kecepatan dunia dinormalisasi: warp penuh (650) = 4000 km/dtk MAKS
    const kmh=S.vel.length();
    const WORLD_MAX=650, SPEED_MAX=4000;
    const dispKmh=Math.min(SPEED_MAX,Math.round(kmh/WORLD_MAX*SPEED_MAX));
    $('hud-speed').textContent=`🚀 ${Math.round(dispKmh).toLocaleString('id-ID')} km/dtk`;
    $('mfd-speed').textContent=Math.round(dispKmh).toLocaleString('id-ID');
    $('fuel-fill').style.width=S.fuel+'%'; $('fuel-pct').textContent=Math.round(S.fuel)+'%'; $('mfd-fuel').textContent=Math.round(S.fuel)+'%';
    const tgt=S.target||S.follow||S.nearBody;
    $('hud-target').textContent=tgt?`🎯 ${tgt.data.name} · ${Math.round(shipGroup.position.distanceTo(tgt.mesh.position))} unit`:'🎯 —';
    $('mfd-nav').textContent=tgt?tgt.data.name:'—';
    $('hud-fps').textContent=Math.round(fpsA)+' FPS';
    if(!$('map-panel').classList.contains('hidden'))drawMap();
  }
  renderer.render(scene,camera);
}
function refuelSilent(){ S.fuel=100; }
function updateVisited(){ const n=[...S.visited].filter(id=>PLANETS.some(p=>p.id===id)).length; $('hud-visited').textContent=`🪐 ${n}/8`;
  if(n===8)toast('🏆 MISI SELESAI! Kamu mengunjungi 8 planet!'); }
renderPlanetList();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
camera.position.set(0,2.4,5.5);
animate();
