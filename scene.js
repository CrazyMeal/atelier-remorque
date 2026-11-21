import { createKitPart1, createKitPart2, createKitPart3 } from './kit-parts.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { derive, TUBE } from './model.js';

export function createScene(host, labelHost) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xe9ece4);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  host.append(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Remorque en 3D. Glisser pour tourner, défiler pour zoomer. Utiliser les boutons pour les vues de côté et de dessus.');
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe9ece4, 7, 15);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 50);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .1;
  controls.minDistance = 1.2;
  controls.maxDistance = 8;
  controls.maxPolarAngle = Math.PI * .49;
  controls.enablePan = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7a816c, 2.8));
  const key = new THREE.DirectionalLight(0xfff6e1, 3.5);
  key.position.set(-2.5, 5, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: .1, far: 12 });
  key.shadow.bias = -.0003;
  key.shadow.normalBias = .015;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe3ebff, 1.6);
  fill.position.set(3, 2, -4);
  scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0xe9ece4, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.003;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(12, 120, 0xd7ddce, 0xdce1d5);
  grid.position.y = -.001;
  grid.material.transparent = true;
  grid.material.opacity = .38;
  scene.add(grid);

  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 512; woodCanvas.height = 128;
  const ctx = woodCanvas.getContext('2d');
  ctx.fillStyle = '#c9ab7c'; ctx.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 140; i++) {
    const y = i * .94;
    ctx.beginPath(); ctx.strokeStyle = i % 3 ? 'rgba(112,78,40,.10)' : 'rgba(239,218,176,.24)';
    ctx.lineWidth = .4 + (i % 5) * .15;
    for (let x = 0; x <= 512; x += 8) {
      const yy = y + Math.sin(x * .012 + i * .8) * (1 + (i % 4));
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  const woodTexture = new THREE.CanvasTexture(woodCanvas);
  woodTexture.colorSpace = THREE.SRGBColorSpace;
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const mats = {
    aluminium: new THREE.MeshStandardMaterial({ color: 0xc6cdcd, metalness: .68, roughness: .31 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x64716e, metalness: .72, roughness: .32 }),
    black: new THREE.MeshStandardMaterial({ color: 0x303633, roughness: .72 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x222725, roughness: .96 }),
    rim: new THREE.MeshStandardMaterial({ color: 0xc9d0cb, metalness: .8, roughness: .25 }),
    spoke: new THREE.MeshStandardMaterial({ color: 0xa6afa6, metalness: .65, roughness: .4 }),
    red: new THREE.MeshStandardMaterial({ color: 0xa82a22, roughness: .3, metalness: .15 }),
    wood: new THREE.MeshStandardMaterial({ map: woodTexture, roughness: .85 }),
    forest: new THREE.MeshStandardMaterial({ color: 0x52664e, roughness: .78 }),
    sand: new THREE.MeshStandardMaterial({ color: 0xd5c8ac, roughness: .8 }),
    charcoal: new THREE.MeshStandardMaterial({ color: 0x43484a, roughness: .8 }),
    dimension: new THREE.LineBasicMaterial({ color: 0x82916f, transparent: true, opacity: .65 })
  };
  let assembly = new THREE.Group(), dimensions = new THREE.Group();
  scene.add(assembly, dimensions);
  let labels = [], currentState, scheduled = false, currentView = 'perspective';

  function mesh(geometry, material, position, group = assembly) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(...position);
    item.castShadow = true; item.receiveShadow = true;
    group.add(item);
    return item;
  }
  function box(x, y, z, pos, material, group) { return mesh(new THREE.BoxGeometry(x, y, z), material, pos, group); }
  function rod(a, b, radius, material, group = assembly) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const delta = end.clone().sub(start);
    const item = mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 12), material, start.clone().add(end).multiplyScalar(.5).toArray(), group);
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return item;
  }
  function clear(group) {
    group.traverse(item => item.geometry?.dispose());
    group.clear();
  }
  function dimension(a, b, text, offset = [0, .04, 0]) {
    const points = [new THREE.Vector3(...a), new THREE.Vector3(...b)];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), mats.dimension);
    dimensions.add(line);
    const axis = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize();
    const tick = Math.abs(axis.y) > .8 ? [0, 0, .025] : [0, .025, 0];
    for (const p of [a, b]) {
      dimensions.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p[0] - tick[0], p[1] - tick[1], p[2] - tick[2]),
        new THREE.Vector3(p[0] + tick[0], p[1] + tick[1], p[2] + tick[2])
      ]), mats.dimension));
    }
    const label = document.createElement('span');
    label.className = 'dimension-label'; label.textContent = text; labelHost.append(label);
    labels.push({ element: label, position: new THREE.Vector3((a[0] + b[0]) / 2 + offset[0], (a[1] + b[1]) / 2 + offset[1], (a[2] + b[2]) / 2 + offset[2]) });
  }
  function wheel(x, z) {
    const group = new THREE.Group();
    assembly.add(group); group.position.set(x, .31-((Math.sqrt(98**2-(85.5-34.6)**2)+34.5)/2-17.4)/1000, z);
    mesh(new THREE.TorusGeometry(.232, .023, 12, 72), mats.rubber, [0, 0, 0], group);
    mesh(new THREE.TorusGeometry(.211, .009, 8, 72), mats.rim, [0, 0, 0], group);
    for (let i = 0; i < 32; i++) {
      const angle = i / 32 * Math.PI * 2;
      const angle2 = angle + (i % 2 ? .16 : -.16);
      rod([.02 * Math.cos(angle2), .02 * Math.sin(angle2), i % 2 ? -.022 : .022],
        [.209 * Math.cos(angle), .209 * Math.sin(angle), 0], .0013, mats.spoke, group);
    }
    rod([0, 0, -.035], [0, 0, .035], .024, mats.rim, group);
    rod([0, 0, -.065], [0, 0, .065], .008, mats.rim, group);
    // Tire shoulder rings make the wheel readable from both directions.
    for (const side of [-1, 1]) mesh(new THREE.TorusGeometry(.232, .0025, 6, 72), mats.black, [0, 0, side * .021], group);
  }
  function rebuild(s, dimensionLabel) {
    currentState = s;
    const d = derive(s);
    clear(assembly); clear(dimensions); labelHost.replaceChildren(); labels = [];
    const L = d.L / 1000, W = d.W / 1000, H = d.H / 1000, t = TUBE / 1000, p = s.thickness / 1000;
    const innerL = d.innerL / 1000, innerW = d.innerW / 1000, wallH = d.wallH / 1000;
    const b = .31, top = b + H - t, e = s.exploded ? .22 : 0;
    const metal = mats[s.frame], panel = s.finish === 'natural' ? mats.wood : mats[s.finish];
    for (const y of [b, top + e]) {
      for (const sign of [-1, 1]) {
        box(innerL, t, t, [0, y, sign * (W - t) / 2], metal);
        box(t, t, innerW, [sign * (L - t) / 2, y, 0], metal);
      }
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (L - t) / 2, z = sz * (W - t) / 2;
      box(t, wallH, t, [x, b + (H - t) / 2, z], metal);
      // Map measured connector axes onto the frame. Anchor at blue passage center.
      function corner(factory,anchor,height,vertical){
        const part=factory();
        part.name=vertical<0?'Coin de plateforme Wike':'Coin supérieur Wike';
        const basis=new THREE.Matrix4().makeBasis(
          new THREE.Vector3(0,vertical,0),new THREE.Vector3(0,0,-sz),new THREE.Vector3(-sx,0,0));
        part.matrixAutoUpdate=false;
        part.matrix.copy(new THREE.Matrix4().makeTranslation(x,height,z))
          .multiply(basis).multiply(new THREE.Matrix4().makeScale(.001,.001,.001))
          .multiply(new THREE.Matrix4().makeTranslation(-anchor, -17.45,-17.25));
        assembly.add(part);
      }
      corner(createKitPart1,58.95,b,-1);
      corner(createKitPart2,58.95,top+e,1);
    }
    for(const sz of [-1,1])box(innerL,t,t,[0,b-.0824,sz*(W-t)/2],metal);
    // Second transverse rail follows the second pair of lower-corner passages.
    for(const sx of [-1,1])box(t,t,innerW,[sx*(L-t)/2,b-.0824,0],metal);    if (s.floor) box(innerL, p, innerW, [0, b + t / 2 - p / 2 + e * 1.8, 0], panel);
    const count = s.walls === 'slats' ? d.slatCount : 1;
    const ph = s.walls === 'slats' ? d.slatHeight / 1000 : wallH;
    if (s.walls !== 'none') for (let n = 0; n < count; n++) {
      const y = b + t / 2 + ph / 2 + n * (ph + .02);
      for (const sign of [-1, 1]) {
        box(innerL, ph, p, [0, y, sign * (innerW / 2 - p / 2 + e)], panel);
        box(p, ph, innerW - 2 * p, [sign * (innerL / 2 - p / 2 + e), y, 0], panel);
        // Fastener heads on the side panels.
        for (const x of [-innerL / 2 + .035, innerL / 2 - .035]) {
          rod([x, y, sign * (innerW / 2 + e)], [x, y, sign * (innerW / 2 + e + .002)], .003, mats.rim);
        }
      }
    }
    const axleX = L * .13;
    for (const sign of [-1, 1]) {
      const support=createKitPart3();
      support.name='Support de roue Wike';
      // Blue passages run along the longitudinal rail; axle points outward.
      const span=Math.sqrt(98**2-(85.5-34.6)**2)+34.5;
      const basis=new THREE.Matrix4().makeBasis(new THREE.Vector3(0,-1,0),new THREE.Vector3(0,0,-sign),new THREE.Vector3(1,0,0));
      support.matrixAutoUpdate=false;
      support.matrix.copy(new THREE.Matrix4().makeTranslation(axleX,b,sign*(W-t)/2))
        .multiply(basis).multiply(new THREE.Matrix4().makeScale(.001,.001,.001))
        .multiply(new THREE.Matrix4().makeTranslation(-17.4,-17.4,-22.1));
      assembly.add(support);
      rod([axleX, b-((Math.sqrt(98**2-(85.5-34.6)**2)+34.5)/2-17.4)/1000, sign * W / 2], [axleX, b-((Math.sqrt(98**2-(85.5-34.6)**2)+34.5)/2-17.4)/1000, sign * (W / 2 + .085 + e)], .009, mats.rim);
      wheel(axleX, sign * (W / 2 + .074 + e));
      box(.012, .035, .065, [L / 2 + .009, b + .018, sign * (W / 2 - .1)], mats.red);
    }
    const tow = [[-L / 2 + .15, b, -W / 2 - .025], [-L / 2 - .22, b, -W / 2 - .025],
      [-L / 2 - .48, b + .025, -W / 2 + .08], [-L / 2 - .85, b + .05, -.05]];
    for (let i = 1; i < tow.length; i++) rod(tow[i - 1], tow[i], .014, metal);
    const tip = tow.at(-1);
    rod([tip[0] - .05, tip[1], tip[2]], tip, .019, mats.black);
    mesh(new THREE.TorusGeometry(.019, .006, 8, 20), mats.black, [tip[0] - .064, tip[1], tip[2]]).rotation.x = Math.PI / 2;
    if (s.dimensions && !s.exploded) {
      dimension([-L / 2, .06, W / 2 + .20], [L / 2, .06, W / 2 + .20], dimensionLabel(s.length));
      dimension([L / 2 + .14, .06, -W / 2], [L / 2 + .14, .06, W / 2], dimensionLabel(s.width));
      dimension([L / 2 + .12, b - t / 2, -W / 2 - .10], [L / 2 + .12, b + H - t / 2, -W / 2 - .10], dimensionLabel(s.height), [.06, 0, 0]);
    }
    invalidate();
  }
  function fit(view = currentView) {
    currentView = view;
    if (!currentState) return;
    const bounds = new THREE.Box3().setFromObject(assembly);
    const center = bounds.getCenter(new THREE.Vector3());
    const radius = bounds.getBoundingSphere(new THREE.Sphere()).radius;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const distance = radius / Math.sin(Math.min(vFov, hFov) / 2) * 1.16;
    controls.target.copy(center);
    camera.up.set(0, 1, 0);
    const direction = view === 'top' ? new THREE.Vector3(0, 1, .0001)
      : view === 'side' ? new THREE.Vector3(0, .025, 1)
      : new THREE.Vector3(-2.5, 1.95, 2.6);
    camera.position.copy(center).add(direction.normalize().multiplyScalar(distance));
    controls.update();
    invalidate();
  }
  function updateLabels() {
    for (const { element, position } of labels) {
      const projected = position.clone().project(camera);
      element.hidden = projected.z > 1 || projected.z < -1;
      element.style.left = ((projected.x + 1) / 2 * host.clientWidth) + 'px';
      element.style.top = ((1 - projected.y) / 2 * host.clientHeight) + 'px';
    }
  }
  function render() {
    scheduled = false;
    controls.update();
    renderer.render(scene, camera);
    updateLabels();
  }
  function invalidate() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(render); }
  }
  controls.addEventListener('change', invalidate);
  new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.updateProjectionMatrix(); fit();
  }).observe(host);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    document.querySelector('#render-error').hidden = false;
  });
  function snapshot() {
    renderer.render(scene, camera);
    return new Promise((resolve, reject) => renderer.domElement.toBlob(blob => blob ? resolve(blob) : reject(new Error('Capture indisponible')), 'image/png'));
  }
  return { update: rebuild, fit, snapshot };
}