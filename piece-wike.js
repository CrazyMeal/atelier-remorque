import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
const host=document.querySelector('#view'), renderer=new T.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#e7e9e2');host.prepend(renderer.domElement);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,3000);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(79.4,38,17.25);controls.enableDamping=true;
scene.add(new T.HemisphereLight(0xffffff,0x69715f,3));
const light=new T.DirectionalLight(0xffffff,3);light.position.set(80,140,180);scene.add(light);
const fill=new T.DirectionalLight(0xc6d7ff,2);fill.position.set(-100,-100,100);scene.add(fill);
const material=new T.MeshStandardMaterial({color:0x303332,roughness:.85,metalness:.04,side:T.DoubleSide});
const group=new T.Group(),guides=new T.Group();scene.add(group,guides);
const box=(x0,x1,y0,y1,z0,z1)=>({x0,x1,y0,y1,z0,z1});
const contains=(b,x,y,z)=>x>b.x0&&x<b.x1&&y>b.y0&&y<b.y1&&z>b.z0&&z<b.z1;
function build(){
 for(const child of [...group.children]){child.geometry.dispose();group.remove(child);}
 for(const child of [...guides.children]){child.geometry.dispose();child.material.dispose();guides.remove(child);}
 const depth=Number(document.querySelector('#depth').value);document.querySelector('#depth-value').value=depth;
 const L=158.8,W=76,D=34.5,sockets=[46,128.4];
 // Front: central rib only, no continuous side flange.
 const solids=[box(0,L,0,34.9,0,D),box(0,L,34.9,W,15,19.5)];
 for(const x of sockets)solids.push(box(x-4.5,Math.min(L,x+30.4),30.4,W,0,D));
  // Rear pocket shell: outer return inferred with a 4.5 mm bottom.
 // Restricted to the gap between blue passages; no continuous front flange.
 solids.push(box(71.9,128.4,34.9,46.5,0,D));
 const cuts=[];
 for(const x of sockets){
 cuts.push(box(x,x+25.9,4.5,30.4,-1,D+1));
 cuts.push(box(x,x+25.9,W-depth,W+1,4.5,30));
 }
 // Rear opening measured from opposite longitudinal end; between blue passages.
  cuts.push(box(L-34.6-48.4,L-34.6,-1,42,4.5,30));
 // End socket centered in measured 34.5 mm thickness.
 cuts.push(box(-1,42,4.5,30.4,4.3,30.2));
 const all=[...solids,...cuts];
 const coords=(a,b,max)=>[...new Set([0,max,...all.flatMap(v=>[v[a],v[b]]).filter(n=>n>0&&n<max)])].sort((a,b)=>a-b);
 const xs=coords('x0','x1',L),ys=coords('y0','y1',W),zs=coords('z0','z1',D);
 const filled=(i,j,k)=>{
 if(i<0||j<0||k<0||i>=xs.length-1||j>=ys.length-1||k>=zs.length-1)return false;
 const x=(xs[i]+xs[i+1])/2,y=(ys[j]+ys[j+1])/2,z=(zs[k]+zs[k+1])/2;
 return solids.some(b=>contains(b,x,y,z))&&!cuts.some(b=>contains(b,x,y,z));
 };
 const vertices=[];
 function face(a,b,c,d){vertices.push(...a,...b,...c,...a,...c,...d);}
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++)for(let k=0;k<zs.length-1;k++){
 if(!filled(i,j,k))continue;
 const x=xs[i],X=xs[i+1],y=ys[j],Y=ys[j+1],z=zs[k],Z=zs[k+1];
 if(!filled(i-1,j,k))face([x,y,z],[x,y,Z],[x,Y,Z],[x,Y,z]);
 if(!filled(i+1,j,k))face([X,y,z],[X,Y,z],[X,Y,Z],[X,y,Z]);
 if(!filled(i,j-1,k))face([x,y,z],[X,y,z],[X,y,Z],[x,y,Z]);
 if(!filled(i,j+1,k))face([x,Y,z],[x,Y,Z],[X,Y,Z],[X,Y,z]);
 if(!filled(i,j,k-1))face([x,y,z],[x,Y,z],[X,Y,z],[X,y,z]);
 if(!filled(i,j,k+1))face([x,y,Z],[X,y,Z],[X,Y,Z],[x,Y,Z]);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();group.add(new T.Mesh(geometry,material));
 for(const x of sockets){
 const through=new T.Mesh(new T.BoxGeometry(24,24,D+22),new T.MeshBasicMaterial({color:0x378fce,transparent:true,opacity:.18,depthWrite:false}));through.position.set(x+12.95,17.45,D/2);guides.add(through);
 const socket=new T.Mesh(new T.BoxGeometry(24,depth+12,24),new T.MeshBasicMaterial({color:0xe0a34a,transparent:true,opacity:.22,depthWrite:false}));socket.position.set(x+12.95,W-depth/2+6,17.25);guides.add(socket);
 }
  const bottomGuide=new T.Mesh(new T.BoxGeometry(54,24,24),new T.MeshBasicMaterial({color:0x599b70,transparent:true,opacity:.22,depthWrite:false}));
 bottomGuide.position.set(15,17.45,D/2);guides.add(bottomGuide);
 document.querySelector('#status').textContent='Glisser pour tourner · molette pour zoomer · dimensions en mm';
}
function orient(name){
 camera.up.set(0,1,0);
 const center=new T.Vector3(79.4,38,17.25);
 const direction={iso:[-1,-1.3,1.8],face:[0,0,1],end:[0,1,0],side:[0,-1,0],bottom:[-1,0,0]}[name];
 if(name==='end'||name==='side')camera.up.set(0,0,1);
 camera.position.copy(center).add(new T.Vector3(...direction).normalize().multiplyScalar(340*Math.max(1,1/camera.aspect)));controls.target.copy(center);controls.update();
}
document.querySelector('#depth').addEventListener('input',build);
document.querySelector('#transparent').addEventListener('change',e=>{material.transparent=e.target.checked;material.opacity=e.target.checked?.32:1;material.depthWrite=!e.target.checked;material.needsUpdate=true;});
document.querySelector('#guides').addEventListener('change',e=>guides.visible=e.target.checked);
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>orient(b.dataset.view);
new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();orient('iso');}).observe(host);
build();orient('iso');
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});