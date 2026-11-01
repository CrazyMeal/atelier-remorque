import * as T from 'three';
export function createKitPart1(){
 const group=new T.Group(),guides=new T.Group();
 const material=new T.MeshStandardMaterial({color:0x303332,roughness:.85,metalness:.04,side:T.DoubleSide});
 const document={querySelector:()=>({value:35,textContent:''})};
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

 build();
 guides.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 group.scale.setScalar(.001);
 group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return group;
}export function createKitPart2(){
 const group=new T.Group(),guides=new T.Group();
 const material=new T.MeshStandardMaterial({color:0x303332,roughness:.85,metalness:.04,side:T.DoubleSide});
 const document={querySelector:()=>({value:35,textContent:''})};
 const box=(x0,x1,y0,y1,z0,z1)=>({x0,x1,y0,y1,z0,z1});
 const contains=(b,x,y,z)=>x>b.x0&&x<b.x1&&y>b.y0&&y<b.y1&&z>b.z0&&z<b.z1;
 function build(){
 for(const child of [...group.children]){child.geometry.dispose();group.remove(child);}
 for(const child of [...guides.children]){child.geometry.dispose();child.material.dispose();guides.remove(child);}
 const L=76.2,W=58,D=34.5,depth=42;
 // Broad face: x along 76.2, y from rear edge toward open U.
 const solids=[box(0,L,0,34.4,0,D),box(0,L,34.4,W,15.1,19.4),
 box(41.5,L,34.4,W,0,D)];
 const cuts=[
 box(46,71.9,4.5,30.4,-1,D+1),
 box(-1,42,4.3,30.2,4.3,30.2),
 // U channel opens at x=L and y=W, stops 30.5 mm into y.
 box(L-30.5,L+1,34.4,W+1,4.5,30)
 ]; const all=[...solids,...cuts];
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
 for(const [bounds,color] of [
 [[46,71.9,4.5,30.4,-8,D+8],0x378fce],
 [[-8,42,4.3,30.2,4.3,30.2],0xe0a34a],
 [[L-30.5,L+4,34.4,W+4,4.5,30],0x8995a3]]){
 const [x,X,y,Y,z,Z]=bounds;
 const mesh=new T.Mesh(new T.BoxGeometry(X-x,Y-y,Z-z),new T.MeshBasicMaterial({color,transparent:true,opacity:.2,depthWrite:false}));
 mesh.position.set((x+X)/2,(y+Y)/2,(z+Z)/2);guides.add(mesh);
 } document.querySelector('#status').textContent='Glisser pour tourner · molette pour zoomer · dimensions en mm';
}

 build();
 guides.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 group.scale.setScalar(.001);
 group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return group;
}export function createKitPart3(){
 const group=new T.Group(),guides=new T.Group();
 const material=new T.MeshStandardMaterial({color:0x303332,roughness:.85,metalness:.04,side:T.DoubleSide});
 const document={querySelector:()=>({value:35,textContent:''})};
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
}
 build();
 guides.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 group.scale.setScalar(.001);
 group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return group;
}