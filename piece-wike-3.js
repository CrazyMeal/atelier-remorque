import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
const host=document.querySelector('#view'), renderer=new T.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#e7e9e2');host.prepend(renderer.domElement);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,3000);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(59.1,40,22.1);controls.enableDamping=true;
scene.add(new T.HemisphereLight(0xffffff,0x69715f,3));
const light=new T.DirectionalLight(0xffffff,3);light.position.set(80,140,180);scene.add(light);
const fill=new T.DirectionalLight(0xc6d7ff,2);fill.position.set(-100,-100,100);scene.add(fill);
const material=new T.MeshStandardMaterial({color:0x303332,roughness:.85,metalness:.04,side:T.DoubleSide});
const group=new T.Group(),guides=new T.Group();scene.add(group,guides);
const box=(x0,x1,y0,y1,z0,z1)=>({x0,x1,y0,y1,z0,z1});
const contains=(b,x,y,z)=>x>b.x0&&x<b.x1&&y>b.y0&&y<b.y1&&z>b.z0&&z<b.z1;
function build(){
 const D=44.2,S=Math.sqrt(98**2-(85.5-34.6)**2),L=S+34.5;
 function add(g,m=material){const o=new T.Mesh(g,m);group.add(o);return o;}
 function layer(z,d,inner){
 const shape=new T.Shape();
 const pts=inner?[[0,0],[L,0],[L,85.5],[L-4.5,85.5],[L-4.5,34.1],[S+4.3,34.1],[S+4.3,85.5],[S,85.5],[S,25.5],[0,25.5]]:
 [[0,0],[L,0],[L,85.5],[S,85.5],[0,34.6]];
 shape.moveTo(...pts[0]);for(const p of pts.slice(1))shape.lineTo(...p);shape.closePath();
 // At each z layer, clip holes that reach the recessed top to the boundary.
 // Separate extrusions for side skins and central body keep the recess clean.
 for(const [x,size] of [[4.5,25.6],[L-30.4,25.9]]){
 const top=4.6+size;
 if(inner&&x<S){
 // This layer uses a notch in the top edge instead of a touching hole.
 continue;
 }
 const h=new T.Path();h.moveTo(x,4.6);h.lineTo(x,top);h.lineTo(x+size,top);h.lineTo(x+size,4.6);h.closePath();shape.holes.push(h);
 }
 if(inner){
 // Replace straight left top edge with the through passage notch.
 const idx=pts.length;
 // Left passage subtraction performed by splitting this layer below.
 }
 const mesh=add(new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false}));mesh.position.z=z;
 }
 layer(0,9.3,false);layer(35,9.2,false);
 // Central layer: planar profile with recess and left passage notch.
 // Raised closed roof over the low blue passage: 25.5 + 8.7 = 34.2 mm.
 // Fill only above the 25.6 mm passage (its top is y=30.2).
 const roof=add(new T.BoxGeometry(34.6,4,25.7));roof.position.set(17.3,32.2,22.15);
 const outerWall=add(new T.BoxGeometry(4.5,8.7,25.7));outerWall.position.set(2.25,29.85,22.15);
 const innerWall=add(new T.BoxGeometry(4.5,8.7,25.7));innerWall.position.set(32.35,29.85,22.15);
 const cx=L/2;
 function profile(points,withHole){
 const s=new T.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();
 if(withHole){const h=new T.Path();h.moveTo(L-30.4,4.6);h.lineTo(L-30.4,30.5);h.lineTo(L-4.5,30.5);h.lineTo(L-4.5,4.6);h.closePath();s.holes.push(h);}
 const m=add(new T.ExtrudeGeometry(s,{depth:25.7,bevelEnabled:false}));m.position.z=9.3;
 }
 profile([[0,0],[cx-10,0],[cx-10,25.5],[30.1,25.5],[30.1,4.6],[4.5,4.6],[4.5,25.5],[0,25.5]],false);
 profile([[cx+10,0],[L,0],[L,85.5],[L-4.5,85.5],[L-4.5,34.1],[S+4.3,34.1],[S+4.3,85.5],[S,85.5],[S,25.5],[cx+10,25.5]],true);
 const bridge=new T.Shape();bridge.moveTo(cx-10,9.3);bridge.lineTo(cx+10,9.3);bridge.lineTo(cx+10,35);bridge.lineTo(cx-10,35);bridge.closePath();
 const passage=new T.Path();passage.absarc(cx,D/2,6.25,0,Math.PI*2,true);bridge.holes.push(passage);
 const block=add(new T.ExtrudeGeometry(bridge,{depth:25.5,bevelEnabled:false,curveSegments:48}));block.rotation.x=Math.PI/2;block.position.y=25.5; const metal=new T.MeshStandardMaterial({color:0xc3c7ce,metalness:.85,roughness:.28});
 const ring=new T.Shape();ring.absarc(0,0,14.85,0,Math.PI*2,false);
 const bore=new T.Path();bore.absarc(0,0,6.25,0,Math.PI*2,true);ring.holes.push(bore);
 const sleeve=add(new T.ExtrudeGeometry(ring,{depth:9,bevelEnabled:false,curveSegments:48}),metal);
 sleeve.rotation.x=Math.PI/2;sleeve.position.set(L/2,0,D/2);
 for(const [x,y,w,h,z,d,c] of [[4.5,4.6,25.6,25.6,-6,D+12,0x378fce],[L-30.4,4.6,25.9,25.9,-6,D+12,0x378fce],[S+4.3,34.1,25.7,57.4,9.3,25.7,0xe0a34a]]){
 const o=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.18,depthWrite:false}));o.position.set(x+w/2,y+h/2,z+d/2);guides.add(o);
 }
 document.querySelector('#status').textContent='Glisser pour tourner · molette pour zoomer · dimensions en mm';
}function orient(name){
 camera.up.set(0,1,0);
 const center=new T.Vector3(59.1,40,22.1);
 const direction={iso:[-1,-1.3,1.8],face:[0,0,1],end:[0,1,0],side:[0,-1,0],bottom:[-1,0,0]}[name];
 if(name==='end'||name==='side')camera.up.set(0,0,1);
 camera.position.copy(center).add(new T.Vector3(...direction).normalize().multiplyScalar(300*Math.max(1,1/camera.aspect)));controls.target.copy(center);controls.update();
}

document.querySelector('#transparent').addEventListener('change',e=>{material.transparent=e.target.checked;material.opacity=e.target.checked?.32:1;material.depthWrite=!e.target.checked;material.needsUpdate=true;});
document.querySelector('#guides').addEventListener('change',e=>guides.visible=e.target.checked);
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>orient(b.dataset.view);
new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();orient('iso');}).observe(host);
build();orient('iso');
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});