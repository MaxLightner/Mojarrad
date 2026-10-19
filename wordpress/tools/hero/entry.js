/* Bundled with Three.js by GitHub Actions. Source version from the original animated building hero. */
import * as THREE from 'three';

(function mountMojarradHero() {
  'use strict';
  const container = document.getElementById('moj-three-hero');
  if (!container || !window.WebGLRenderingContext) return;
  const parent = container.closest('.hero-home');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.innerWidth < 768;
  const themes = {
    navy: {body:0x14263f,emissive:0x1a3050,accent:0xff8a3d,fog:0x0a1424,ground:0x0c1728,ambient:.45,rim:0x9ec1ff},
    dark: {body:0x16161f,emissive:0x1c1c28,accent:0xd4a531,fog:0x0a0a0f,ground:0x0c0c12,ambient:.40,rim:0xd4a531},
    light:{body:0xd9d2c2,emissive:0xe8e2d2,accent:0x9c7a14,fog:0xfaf7f0,ground:0xefeadd,ambient:.85,rim:0xffffff},
    pastel:{body:0xdec4a8,emissive:0xe9d3bb,accent:0xc1764a,fog:0xf6ece2,ground:0xf0e0d1,ambient:.8,rim:0xffe9d6},
  };
  function theme() { return themes[document.body.dataset.mojTheme] || themes.navy; }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({alpha:true,antialias:!mobile,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,mobile?1.3:1.6));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000,0);
  } catch (error) {
    console.warn('Mojarrad 3D unavailable, retaining accessible 2D building fallback.', error);
    return;
  }
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(theme().fog,.026);
  const camera = new THREE.PerspectiveCamera(38,1,.1,120);
  camera.position.set(0,5.5,15);
  camera.lookAt(0,5,0);
  const ambient = new THREE.AmbientLight(0xffffff,theme().ambient);
  const rim = new THREE.DirectionalLight(theme().rim,1.2);
  rim.position.set(-6,10,5);
  const key = new THREE.PointLight(theme().accent,65,37);
  key.position.set(4,7,7);
  scene.add(ambient,rim,key);
  const tower = new THREE.Group();
  tower.position.x=mobile?-2.3:-3.0;
  scene.add(tower);
  const floors=[], outlines=[], lines=[], winMats=[], bodyMats=[], edgeMats=[];
  const widths=[2.6,2.6,2.45,2.45,2.3,2.3,2.15,2.15,2.0];
  const floorHeight=1.05;
  for(let i=0;i<9;i++){
    const width=widths[i], y=1.1+i*floorHeight;
    const geo = new THREE.BoxGeometry(width,.82*floorHeight,width*.85);
    const bodyMat=new THREE.MeshStandardMaterial({
      color:theme().body,metalness:.58,roughness:.33,
      emissive:theme().emissive,emissiveIntensity:.28,transparent:true,opacity:0
    });
    const floor = new THREE.Mesh(geo,bodyMat);
    floor.position.y=y;
    const edgeMat=new THREE.LineBasicMaterial({color:theme().accent,transparent:true,opacity:0});
    const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geo),edgeMat);
    edge.position.y=y;
    const blueprintMat=new THREE.LineBasicMaterial({color:theme().accent,transparent:true,opacity:0});
    const blueprint=new THREE.LineSegments(new THREE.EdgesGeometry(geo),blueprintMat);
    blueprint.position.y=y+floorHeight;
    blueprint.scale.setScalar(1.04);
    const windowMat=new THREE.MeshBasicMaterial({color:theme().accent,transparent:true,opacity:0,side:THREE.DoubleSide});
    const windowMesh=new THREE.Mesh(new THREE.PlaneGeometry(width*.78,floorHeight*.35),windowMat);
    windowMesh.position.set(0,y,width*.85/2+.012);
    tower.add(floor,edge,blueprint,windowMesh);
    floors.push({floor,edge,blueprint,windowMesh,bodyMat,edgeMat,blueprintMat,windowMat,y});
    bodyMats.push(bodyMat);edgeMats.push(edgeMat);winMats.push(windowMat);outlines.push(blueprintMat);
  }
  const podiumGeometry=new THREE.BoxGeometry(3.2,.65,2.8);
  const podiumMaterial=new THREE.MeshStandardMaterial({color:theme().body,metalness:.56,roughness:.42,emissive:theme().emissive,emissiveIntensity:.23});
  const podium=new THREE.Mesh(podiumGeometry,podiumMaterial);
  podium.position.y=.34;
  const podiumOutlineMaterial=new THREE.LineBasicMaterial({color:theme().accent,transparent:true,opacity:.35});
  const podiumOutline=new THREE.LineSegments(new THREE.EdgesGeometry(podiumGeometry),podiumOutlineMaterial);
  podiumOutline.position.copy(podium.position);
  tower.add(podium,podiumOutline);
  const crownMat=new THREE.MeshStandardMaterial({color:theme().accent,metalness:.85,roughness:.2,emissive:theme().accent,emissiveIntensity:.5,transparent:true,opacity:0});
  const crown=new THREE.Mesh(new THREE.CylinderGeometry(.10,.42,1.4,4,1),crownMat);
  crown.position.y=11.1;
  tower.add(crown);
  const groundMat=new THREE.MeshStandardMaterial({color:theme().ground,metalness:.3,roughness:.5});
  const ground=new THREE.Mesh(new THREE.CircleGeometry(40,48),groundMat);
  ground.rotation.x=-Math.PI/2;ground.position.y=-.05;
  scene.add(ground);
  const grid=new THREE.GridHelper(50,50,theme().accent,theme().ground);
  grid.material.transparent=true;grid.material.opacity=.13;
  scene.add(grid);
  const backGroup=new THREE.Group();
  const backMat=new THREE.MeshStandardMaterial({color:theme().body,transparent:true,opacity:.25,roughness:.7});
  for(let i=0;i<8;i++){
    const h=2.5+Math.random()*7,w=1+Math.random()*1.3;
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),backMat);
    b.position.set(-12+i*.6,h/2,-5-Math.random()*5);backGroup.add(b);
  }
  scene.add(backGroup);
  const count=mobile?120:340,positions=new Float32Array(count*3);
  for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*25;positions[i*3+1]=Math.random()*15;positions[i*3+2]=(Math.random()-.5)*25;}
  const pointGeometry=new THREE.BufferGeometry();
  pointGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const pointMaterial=new THREE.PointsMaterial({color:theme().accent,size:mobile?.055:.04,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending});
  scene.add(new THREE.Points(pointGeometry,pointMaterial));
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-Math.pow(1-x,3);
  const tAssembly=.4+8*.55+1.1+.9,tHold=tAssembly+4.5,tTotal=tHold+2.4;
  const clock=new THREE.Clock();
  const pointer={x:0,y:0};
  let request=0,visible=true,disposed=false;
  function onPointer(e){pointer.x=(e.clientX/window.innerWidth-.5)*2;pointer.y=(e.clientY/window.innerHeight-.5)*2;}
  function resize() {
    if(!container.isConnected)return;
    const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  function applyTheme(){
    const c=theme();
    scene.fog.color.setHex(c.fog);
    bodyMats.forEach(m=>{m.color.setHex(c.body);m.emissive.setHex(c.emissive);});
    edgeMats.forEach(m=>m.color.setHex(c.accent));
    outlines.forEach(m=>m.color.setHex(c.accent));
    winMats.forEach(m=>m.color.setHex(c.accent));
    groundMat.color.setHex(c.ground);podiumMaterial.color.setHex(c.body);podiumMaterial.emissive.setHex(c.emissive);
    podiumOutlineMaterial.color.setHex(c.accent);crownMat.color.setHex(c.accent);crownMat.emissive.setHex(c.accent);
    pointMaterial.color.setHex(c.accent);key.color.setHex(c.accent);rim.color.setHex(c.rim);
    ambient.intensity=c.ambient;backMat.color.setHex(c.body);
    grid.material.color.setHex(c.accent);
  }
  function frame(){
    if(disposed)return;
    request=requestAnimationFrame(frame);
    if(!visible || document.hidden)return;
    const t=reduced?tAssembly+1:clock.getElapsedTime()%tTotal;
    const fade=t>tHold?clamp(1-(t-tHold)/2.4):1;
    tower.rotation.y=.38+(reduced?.4:Math.min(t*.21,1.5));
    crown.rotation.y=-t*.28;
    for(let i=0;i<floors.length;i++){
      const p=floors[i],start=.4+i*.55,built=ease(clamp((t-start)/1.1));
      p.floor.scale.y=Math.max(.001,built);
      p.floor.position.y=p.y-(1-built)*1.5;
      p.bodyMat.opacity=built*fade;
      p.edgeMat.opacity=(built<1?.85:.38)*built*fade;
      p.blueprint.position.y=p.y+floorHeight*(1-clamp((t-start+.32)/.65));
      p.blueprintMat.opacity=clamp((t-start+.35)/.6)*(1-built)*fade;
      const win=clamp((t-start-.8)/1.2);
      p.windowMat.opacity=win*(.55+Math.sin(t*2.2+i)*.15)*fade;
      p.windowMesh.scale.x=Math.max(.001,win);
    }
    const crownProgress=clamp((t-tAssembly+1.3)/1.3);
    crown.scale.setScalar(Math.max(.001,ease(crownProgress)));
    crownMat.opacity=crownProgress*fade;
    key.position.y=1+10*clamp(t/tAssembly);
    key.intensity=25+45*fade;
    camera.position.x+=(pointer.x*.85-camera.position.x)*.04;
    camera.position.y+=(5.5-pointer.y*.5-camera.position.y)*.04;
    camera.lookAt(0,4.9,0);
    if(!reduced){
      const arr=pointGeometry.attributes.position;
      for(let i=0;i<count;i++){
        const next=arr.getY(i)+.008;
        arr.setY(i,next>15?0:next);
      }
      arr.needsUpdate=true;
    }
    renderer.render(scene,camera);
  }
  const observer=new MutationObserver(applyTheme);
  observer.observe(document.body,{attributes:true,attributeFilter:['data-moj-theme']});
  const io=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;});
  io.observe(container);
  const ro=new ResizeObserver(resize);
  ro.observe(container);
  window.addEventListener('pointermove',onPointer,{passive:true});
  const onContextLoss=event=>{event.preventDefault();visible=false;parent?.classList.remove('hero-three-active');};
  renderer.domElement.addEventListener('webglcontextlost',onContextLoss);
  container.appendChild(renderer.domElement);
  resize();
  applyTheme();
  parent?.classList.add('hero-three-active');
  frame();
  window.addEventListener('pagehide',function cleanup(){
    if(disposed)return;disposed=true;
    cancelAnimationFrame(request);observer.disconnect();ro.disconnect();io.disconnect();
    window.removeEventListener('pointermove',onPointer);
    renderer.domElement.removeEventListener('webglcontextlost',onContextLoss);
    scene.traverse(obj=>{
      if(obj.geometry)obj.geometry.dispose();
      if(obj.material){const ms=Array.isArray(obj.material)?obj.material:[obj.material];ms.forEach(m=>m.dispose());}
    });
    renderer.dispose();
    window.removeEventListener('pagehide',cleanup);
  },{once:true});
})();
