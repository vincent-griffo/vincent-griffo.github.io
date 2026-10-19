// Generated from the supplied axis-review application. Kinematic code is preserved.
// Load engine.js first as a classic script; its THREE and OrbitControls bindings
// are intentionally shared with this isolated viewer document.
(async function initializeMotionStudy() {
"use strict";
const ASSET_BASE=new URL('.',document.currentScript?.src||location.href);
const modelResponse=await fetch(new URL('model.json',ASSET_BASE));
if(!modelResponse.ok)throw Error('Could not load model.json ('+modelResponse.status+')');
const MODEL=await modelResponse.json();
const PACKED_ASSETS={"geometry-payload":{"file":"geometry.bin","packedBytes":17603065,"rawBytes":43949688},"chassis-payload":{"file":"chassis.bin","packedBytes":585913,"rawBytes":2232288}};
// Same geometric model and branch choices as kinematics/gecko_kinematics.py.
const RoverMotion=(()=>{
 const g=MODEL.geometry;
 const add=(a,b)=>a.map((v,i)=>v+b[i]);
 const sub=(a,b)=>a.map((v,i)=>v-b[i]);
 const scale=(a,k)=>a.map(v=>v*k);
 const norm=a=>Math.hypot(...a);
 const bearing=v=>Math.atan2(v[1],v[0]);
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 function circle(a,ra,b,rb,branch) {
  const delta=sub(b,a),d=norm(delta);
  if(d<1e-10||d>ra+rb+1e-8||d<Math.abs(ra-rb)-1e-8)throw Error('Target outside linkage workspace');
  const e=scale(delta,1/d),t=(ra*ra-rb*rb+d*d)/(2*d),height=ra*ra-t*t;
  if(height<-.000001)throw Error('Linkage cannot close at target');
  return add(add(a,scale(e,t)),scale([-e[1],e[0]],branch*Math.sqrt(Math.max(0,height))));
 }
 function planar(q1,q2) {
  const a=g.a0-q1,b=g.b0-q2;
  const D=add(g.a,scale([Math.cos(a),Math.sin(a)],g.ad));
  const C=add(g.a,scale([Math.cos(b),Math.sin(b)],g.bc));
  const E=circle(D,g.de,C,g.ce,g.fk_branch);
  const F=add(D,scale(sub(E,D),g.df/g.de));
  return {D,C,E,F};
 }
 const reference=planar(0,0),ce0=bearing(sub(reference.E,reference.C));
 const X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
 const u=new THREE.Vector3(...g.primary_axis0),w=new THREE.Vector3().crossVectors(Z,u);
 const angleMax=Math.acos(28.125/128.125);
 function targetAt(cyclePhase,mode='gecko') {
  const apex=MODEL.modalities[mode].apex_mm;
  const phase=((cyclePhase+.75)%1+1)%1;
  const name=phase<.5?'stance':'swing';
  const progress=phase<.5?2*phase:2*(phase-.5);
  const t=progress**3*(10+progress*(-15+6*progress));
  const angle=angleMax*(1-2*t);
  const target=name==='stance'?[apex[0]-125+250*t,apex[1],apex[2]-100]:[apex[0]+128.125*Math.sin(angle),apex[1],apex[2]-128.125+128.125*Math.cos(angle)];
  return {target,phase:name,progress};
 }
 function inverse(target,pitch,heading=0,baseRotation=null) {
  const offset=new THREE.Vector3(...g.contact_offset).applyAxisAngle(Z,heading).toArray();
  if(baseRotation)new THREE.Vector3(...offset).applyQuaternion(baseRotation.clone().invert()).toArray().forEach((v,i)=>offset[i]=v);
  const center=new THREE.Vector3(...sub(target,offset)).applyAxisAngle(Y,-pitch).toArray();
  const relative=sub(center,g.pivot),h=g.f_height-g.pivot[2];
  const radicand=relative[1]**2+relative[2]**2-h*h;
  if(radicand<-1e-7)throw Error('Target cannot intersect the rolled plane');
  const localY=-Math.sqrt(Math.max(0,radicand));
  const gamma=wrap(Math.atan2(relative[2],relative[1])-Math.atan2(h,localY));
  const F=[center[0],g.pivot[1]+localY];
  const D=circle(g.a,g.ad,F,g.df,g.ik_d_branch);
  const E=add(D,scale(sub(F,D),g.de/g.df));
  const C=circle(g.a,g.bc,E,g.ce,g.ik_c_branch);
  const q1=-wrap(bearing(sub(D,g.a))-g.a0),q2=-wrap(bearing(sub(C,g.a))-g.b0);
  return [q1,q2,gamma,pitch];
 }
 function contactAt(values,heading=0,baseRotation=null) {
  const [q1,q2,gamma,pitch]=values,{F}=planar(q1,q2);
  const local=new THREE.Vector3(F[0]-g.pivot[0],F[1]-g.pivot[1],g.f_height-g.pivot[2]).applyAxisAngle(X,gamma).add(new THREE.Vector3(...g.pivot)).applyAxisAngle(Y,pitch);
  const offset=new THREE.Vector3(...g.contact_offset).applyAxisAngle(Z,heading);
  if(baseRotation)offset.applyQuaternion(baseRotation.clone().invert());
  return local.add(offset).toArray();
 }
 function fromJoints(values,{heading=0,wheel=0,baseRotation=null,...state}={}) {
  const [q1,q2,gamma,pitch]=values,{D,C,E,F}=planar(q1,q2);
  const delta=wrap(bearing(sub(F,D))-g.phi0);
  const upstream=(baseRotation?baseRotation.clone():new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(Y,pitch)).multiply(new THREE.Quaternion().setFromAxisAngle(X,gamma)).multiply(new THREE.Quaternion().setFromAxisAngle(Z,delta));
  const n=Z.clone().applyQuaternion(upstream.clone().invert());
  const beta=Math.asin(THREE.MathUtils.clamp(n.dot(u),-1,1));
  const alpha=Math.atan2(-n.dot(w),n.z);
  const orientation=upstream.clone().multiply(new THREE.Quaternion().setFromAxisAngle(u,alpha)).multiply(new THREE.Quaternion().setFromAxisAngle(w,beta));
  const forward=X.clone().applyQuaternion(orientation),yaw=Math.atan2(forward.y,forward.x),swerve=wrap(heading-yaw);
  const ceDelta=wrap(bearing(sub(E,C))-ce0),side14=alpha-(13/18)*beta,side13=-alpha-(13/18)*beta;
  const joints={revolute_1:pitch,revolute_2:-(124/48)*pitch,revolute_3:gamma,revolute_4:-gamma,revolute_5:(34/24)*q2,
   revolute_6:q1,revolute_7:q2-q1,revolute_8:-ceDelta-q2,revolute_9:delta+q1,revolute_10:ceDelta-delta,
   revolute_13:side13,revolute_14:side14,revolute_11:alpha-side14,revolute_12_loop_closure:-alpha,
   revolute_15:-beta,revolute_16:-beta,revolute_17:2*beta,revolute_18:swerve,revolute_19:-wheel};
  const angles={m1:q1,m2:-q2,m2_relative_ad:-(q2-q1),m3:-gamma,primary:-alpha,secondary:beta,swerve,wheel,m4:pitch,
   diff1:alpha+(13/18)*beta,diff2:-alpha+(13/18)*beta};
  return {...state,joints,angles,heading};
 }
 function solve(cyclePhase,mode='gecko') {
  const pitch=MODEL.modalities[mode].motor4_deg*Math.PI/180,state=targetAt(cyclePhase,mode);
  return fromJoints(inverse(state.target,pitch),state);
 }
 function flagsAt(cyclePhase,mode='gecko') {
  const profile=MODEL.modalities[mode],phase=((cyclePhase%1)+1)%1;
  const neighbors=samples=>{if(!samples?.length)return [];const index=Math.floor(phase*(samples.length-1));return [samples[index],samples[Math.min(index+1,samples.length-1)]];};
  return {collisionParts:[...new Set(neighbors(profile.collision_samples).flatMap(s=>s.parts))],pathValid:neighbors(profile.path_samples).every(s=>s.valid)};
 }
 return {solve,targetAt,flagsAt,inverse,fromJoints,contactAt};
})();

// The offline plan is generated/audited by kinematics/transformations.py.
const TransformationMotion=(()=>{
 const plan=MODEL.transformation,order=plan.order;
 const smooth=t=>t*t*t*(10+t*(-15+6*t));
 const totalRoll=plan.transitions.reduce((sum,t)=>sum+t.roll_rad,0);
 const interpolate=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 function driveValues(transition,s) {
  const rows=transition.drive_samples,f=s*(rows.length-1),i=Math.min(Math.floor(f),rows.length-2),t=f-i;
  return [1,2,3,4,5,6].map(k=>rows[i][k]+(rows[i+1][k]-rows[i][k])*t);
 }
 function transitionAt(transition,u) {
  const edge=plan.steering_fraction,rows=transition.drive_samples;
  let s,heading,wheel,phase;
  if(u<edge) {s=0;heading=rows[0][1]*smooth(u/edge);wheel=0;phase='steer for drive';}
  else if(u>1-edge) {s=1;heading=rows.at(-1)[1]*(1-smooth((u-(1-edge))/edge));wheel=transition.roll_rad;phase='align for stepping';}
  else {s=smooth((u-edge)/(1-2*edge));[heading,wheel]=driveValues(transition,s);phase='grounded drive';}
  const [,,x,y,height,pitch]=driveValues(transition,s),xy=[x,y];
  const q=RoverMotion.inverse([x,y,-height],pitch,heading);
  const root_mm=[0,0,height];
  return {q,heading,wheel,phase,root_mm,target:[...xy,plan.ground_z_mm],progress:u};
 }
 function solve(phase,loopIndex=0) {
  let unit=(((phase%1)+1)%1)*plan.phase_units_per_loop,wheel=loopIndex*totalRoll,state;
  for(let i=0;i<order.length;i++) {
   const mode=order[i];
   if(unit<4) {
    const cycle=(plan.start_phase+unit/2)%1,local=RoverMotion.solve(cycle,mode),cfg=MODEL.modalities[mode],root_mm=[0,0,100-cfg.apex_mm[2]];
    const result=RoverMotion.fromJoints([local.angles.m1,-local.angles.m2,-local.angles.m3,local.angles.m4],{...local,wheel,heading:0});
    return {...result,root_mm,target:local.target.map((v,j)=>v+root_mm[j]),kind:'walk',segment:mode,activeMode:mode,step:Math.min(2,Math.floor(unit/2)+1),localCycle:cycle};
   }
   unit-=4;const transition=plan.transitions[i];
   if(unit<2) {
    state=transitionAt(transition,unit/2);state.wheel+=wheel;
    const result=RoverMotion.fromJoints(state.q,state);
    const flags=flagsAt(transition,state.progress,result.angles);
    return {...result,kind:'transform',segment:transition.id,source:transition.source,destination:transition.destination,flags};
   }
   unit-=2;wheel+=transition.roll_rad;
  }
  throw Error('Transformation timeline segment missing');
 }
 function flagsAt(transition,progress,angles) {
  const rows=transition.collision_samples||[],i=Math.min(Math.floor(progress*(rows.length-1)),rows.length-1);
  const neighbors=rows.length?[rows[i],rows[Math.min(i+1,rows.length-1)]]:[];
  const unverified=Math.abs(angles.secondary)>Math.PI/4+1e-8&&Math.abs(angles.m3+Math.PI/2)>1e-8;
  return {collisionParts:[...new Set(neighbors.flatMap(row=>row.parts))],unverified,
   outsideLimits:neighbors.some(row=>row.limit_violations?.length)};
 }
 function paths() {
  const paths=[];
  for(const mode of order) {
   const cfg=MODEL.modalities[mode],zOffset=100-cfg.apex_mm[2],points=[];
   for(let i=0;i<=400;i++)points.push(RoverMotion.targetAt(i/400,mode).target.map((v,j)=>v+(j===2?zOffset:0)));
   paths.push({id:mode,label:cfg.label+' steps',points});
  }
  for(const t of plan.transitions) {
   const points=[];
   for(let i=0;i<=300;i++)points.push(transitionAt(t,plan.steering_fraction+(1-2*plan.steering_fraction)*i/300).target);
   paths.push({id:t.id,label:MODEL.modalities[t.source].label+' → '+MODEL.modalities[t.destination].label,points});
  }
  return paths;
 }
 return {solve,paths,transitionAt,flagsAt,totalRoll,durationUnits:plan.phase_units_per_loop};
})();

// Explicit presentation timeline. One time unit is two seconds at normal playback.
const PresentationMotion=(()=>{
 const plan=MODEL.centered,layout=MODEL.rover,wrap=t=>((t%1)+1)%1;
 const smooth=t=>t*t*t*(10+t*(-15+6*t)),radius=plan.wheel_radius_mm;
 const caches=new Map(),pathCaches=new Map(),samples=1800;
 function offsets(scope,pose) {
  const signs=scope==='rover'?layout.mounts.map(m=>m.signs[0]):[1];
  if(pose==='center')return signs.map(()=>0);
  if(pose==='spread')return signs.map(()=>-125); // Front forward, rear backward in world X.
  if(scope==='leg')return [125];
  return signs.map((s,i)=>{const f=wrap(-i*.25);return s*(f<.2?125-250*f/.2:-125+250*(f-.2)/.8);});
 }
 function timeline(scope,mode) {
  const key=scope+':'+mode;if(caches.has(key))return caches.get(key);
  const order=['tracing','transformation'].includes(mode)?['gecko','spider','dog']:[mode];
  const count=scope==='rover'?4:1,segments=[];
  let units=0,advance=0,wheels=Array(count).fill(0);
  const add=s=>{
   s.start=units;s.advanceStart=advance;s.wheelStart=[...wheels];
   s.advanceDelta=s.advanceDelta||0;s.wheelDelta=s.wheelDelta||Array(count).fill(0);
   segments.push(s);units+=s.units;advance+=s.advanceDelta;wheels=wheels.map((v,i)=>v+s.wheelDelta[i]);
  };
  const reposition=(m,from,to,label)=>{
   const a=offsets(scope,from),b=offsets(scope,to);
   add({kind:'reposition',mode:m,from:a,to:b,units:.5,phase:label,id:m+'-'+from+'-'+to,
        wheelDelta:a.map((v,i)=>(b[i]-v)/radius)});
  };
  for(let i=0;i<order.length;i++) {
   const m=order[i];reposition(m,'center','walk','drive into stepping positions');
   add({kind:'walk',mode:m,units:scope==='rover'?2.5:4,id:m+'-steps',advanceDelta:scope==='rover'?625:500});
   const rollPose=scope==='rover'?'spread':'center';
   reposition(m,'walk',rollPose,scope==='rover'?'drive to widest fore/aft stance':'drive to stance center');
   const distance=plan.rolling_speed_mm_s*plan.rolling_seconds;
   add({kind:'roll',mode:m,pose:rollPose,units:plan.rolling_seconds/2,id:m+'-rolling',phase:'drive forward · 250 mm/s',advanceDelta:distance,
        wheelDelta:(scope==='rover'?layout.mounts.map(m=>m.signs[0]):[1]).map(s=>-s*distance/radius)});
   if(scope==='rover')reposition(m,'spread','center','drive to stance centers');
   if(order.length>1)for(const id of plan.sequence_routes[i]) {
    const route=plan.transitions.find(t=>t.id===id);
    add({kind:'transform',route,mode:route.source,units:plan.route_seconds/2,id,phase:'grounded transformation',wheelDelta:Array(count).fill(route.roll_rad)});
   }
  }
  const result={segments,units,advance,wheels,scope,mode};caches.set(key,result);return result;
 }
 function sampled(route,s) {
  const f=s*(route.drive_samples.length-1),i=Math.min(Math.floor(f),route.drive_samples.length-2),t=f-i;
  return route.drive_samples[i].slice(1).map((v,k)=>v+(route.drive_samples[i+1][k+1]-v)*t);
 }
 function transition(route,u) {
  const edge=plan.steering_fraction;let s,heading,wheel,phase;
  if(u<edge){s=0;heading=route.drive_samples[0][1]*smooth(u/edge);wheel=0;phase='steer in place';}
  else if(u>1-edge){s=1;heading=route.drive_samples.at(-1)[1]*(1-smooth((u-1+edge)/edge));wheel=route.roll_rad;phase='align for stepping';}
  else{s=smooth((u-edge)/(1-2*edge));[heading,wheel]=sampled(route,s);phase='grounded drive';}
  const [,,x,y,height,pitch]=sampled(route,s);return {s,heading,wheel,phase,local:[x,y,-height],height,pitch};
 }
 function solve(scope,mode,phase,loop=0) {
  const tl=timeline(scope,mode),unit=wrap(phase)*tl.units;
  const segment=tl.segments.find(s=>unit<s.start+s.units)||tl.segments.at(-1);
  const u=(unit-segment.start)/segment.units,cfg=MODEL.modalities[segment.mode];
  let advance=loop*tl.advance+segment.advanceStart,baseHeight=100-cfg.apex_mm[2],tr;
  if(segment.kind==='walk') {
   if(scope==='rover')advance+=segment.advanceDelta*u;
   else {const cycles=2*u,completed=Math.floor(cycles),f=cycles-completed;advance+=250*(completed+(f>=.5?smooth(2*f-1):0));}
  } else if(segment.kind==='roll')advance+=segment.advanceDelta*u;
  else if(segment.kind==='transform'){tr=transition(segment.route,u);baseHeight=tr.height;}
  const body=[-advance,0,baseHeight-(scope==='rover'?layout.mount_height_mm:0)];
  const mounts=scope==='rover'?layout.mounts:[{id:'FL',origin_mm:[0,0,0],signs:[1,1,1]}];
  const legs=mounts.map((mount,i)=>{
   const zDelta=scope==='rover'?mount.origin_mm[2]-layout.mount_height_mm:0;
   let local,heading=0,wheel=loop*tl.wheels[i]+segment.wheelStart[i],pitch=cfg.motor4_deg*Math.PI/180;
   let phase=segment.phase,swing=false,localCycle=0,dx,lift=0;
   if(segment.kind==='walk') {
    const cycle=wrap(2*u),f=scope==='rover'?wrap(cycle-i*.25):cycle;
    swing=f<(scope==='rover'?.2:.5);
    const p=swing?f/(scope==='rover'?.2:.5):(f-(scope==='rover'?.2:.5))/(scope==='rover'?.8:.5);
    const progress=scope==='rover'?p:smooth(p);
    dx=(swing?125-250*progress:-125+250*progress)*(scope==='rover'?mount.signs[0]:1);
    if(swing)lift=-28.125+Math.sqrt(Math.max(0,128.125**2-dx**2));
    phase=swing?'swing':'stance';localCycle=f;
   } else if(segment.kind==='transform') {
    local=[tr.local[0],tr.local[1],tr.local[2]-zDelta];heading=tr.heading;wheel+=tr.wheel;pitch=tr.pitch;phase=tr.phase;
   } else {
    const p=segment.kind==='reposition'?smooth(u):u;
    dx=segment.kind==='reposition'?segment.from[i]+(segment.to[i]-segment.from[i])*p:offsets(scope,segment.pose)[i];
    wheel+=segment.wheelDelta[i]*p;
   }
   if(!local)local=[cfg.apex_mm[0]+dx,cfg.apex_mm[1],-baseHeight+lift-zDelta];
   const root=body.map((v,j)=>v+mount.origin_mm[j]);
   const target=local.map((v,j)=>root[j]+mount.signs[j]*v);
   const q=RoverMotion.inverse(local,pitch,heading),state=RoverMotion.fromJoints(q,{heading,wheel});
   const flags={collisionParts:[],unverified:Math.abs(state.angles.secondary)>Math.PI/4+1e-8&&Math.abs(state.angles.m3+Math.PI/2)>1e-8};
   if(segment.kind==='transform'){
    const rows=segment.route.collision_samples||[],f=u*(rows.length-1),k=Math.min(Math.floor(f),rows.length-1);
    flags.collisionParts=rows.length?[...new Set([rows[k],rows[Math.min(k+1,rows.length-1)]].flatMap(r=>r.parts))]:[];
   }
   return {...state,q,id:mount.id,root_mm:root,target,localTarget:local,kind:segment.kind,phase,swing,localCycle,activeMode:segment.mode,
           source:segment.route?.source,destination:segment.route?.destination,segment:segment.id,flags,step:Math.min(2,Math.floor(2*u)+1),progress:u};
  });
  return {body_mm:body,legs,kind:segment.kind,segment:segment.id,activeMode:segment.mode,phase:legs[0].phase,
          source:segment.route?.source,destination:segment.route?.destination,advance_mm:advance,swingLeg:legs.find(l=>l.swing)?.id||null,
          step:Math.min(2,Math.floor(2*u)+1),segmentProgress:u};
 }
 function template(scope,mode) {
  const key=scope+':'+mode;if(!pathCaches.has(key)){
   const rows=[];for(let i=0;i<=samples;i++) {
    const s=solve(scope,mode,i===samples?0:i/samples,i===samples?1:0);
    rows.push({body:s.body_mm,contact:s.legs[0].target,contacts:s.legs.map(l=>l.target),segment:s.segment,kind:s.kind,swingLeg:s.swingLeg});
   }pathCaches.set(key,rows);
  }return pathCaches.get(key);
 }
 function trail(scope,mode,absolute) {
  const rows=template(scope,mode),tl=timeline(scope,mode),start=absolute>=0?Math.max(0,absolute-1):absolute,end=absolute>=0?absolute:Math.min(0,absolute+1);
  const points={body:[],contacts:Array.from({length:scope==='rover'?4:1},()=>[])};
  for(let k=Math.ceil(start*samples);k<end*samples;k++) {
   const loop=Math.floor(k/samples),row=rows[((k%samples)+samples)%samples],shift=loop*tl.advance;
   points.body.push(row.body.map((v,j)=>v-(j===0?shift:0)));
   row.contacts.forEach((p,i)=>points.contacts[i].push(p.map((v,j)=>v-(j===0?shift:0))));
  }
  if(absolute<0){points.body.reverse();points.contacts.forEach(p=>p.reverse());}
  const loop=Math.floor(absolute),s=solve(scope,mode,absolute-loop,loop);points.body.push(s.body_mm);s.legs.forEach((l,i)=>points.contacts[i].push(l.target));
  return {...points,contact:points.contacts[0]};
 }
 return {solve,timeline,template,trail,samples,transition};
})();

// Contact-constrained terrain illustration; not a force/compliance simulation.
const TerrainMotion=(()=>{
 const wavelength=1000,radius=MODEL.centered.wheel_radius_mm,Y=new THREE.Vector3(0,1,0),samples=PresentationMotion.samples;
 const height=x=>25+75*Math.sin(2*Math.PI*x/wavelength);
 const slope=x=>75*2*Math.PI/wavelength*Math.cos(2*Math.PI*x/wavelength);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 let enabled=false;
 const templates=new Map();
 function preferred(state) {
  const points=state.legs.map(l=>({x:l.target[0],z:height(l.target[0])}));
  const mx=points.reduce((s,p)=>s+p.x,0)/points.length,mz=points.reduce((s,p)=>s+p.z,0)/points.length;
  const variance=points.reduce((s,p)=>s+(p.x-mx)**2,0);
  const gradient=variance>1e-8?points.reduce((s,p)=>s+(p.x-mx)*(p.z-mz),0)/variance:slope(mx);
  return [clamp(mz+gradient*(state.body_mm[0]-mx),-150,250),clamp(-Math.atan(gradient),-.48,.48)];
 }
 function pose(state,offset,pitch,strict=false) {
  const rotation=new THREE.Quaternion().setFromAxisAngle(Y,pitch),inverse=rotation.clone().invert();
  const body=state.body_mm.map((v,j)=>v+(j===2?offset:0)),B=new THREE.Vector3(...body);
  let violation=0;const constraints=[];
  const legs=state.legs.map((leg,i)=>{
   const mount=state.legs.length===1?{origin_mm:[0,0,0],signs:[1,1,1]}:MODEL.rover.mounts[i];
   const root=new THREE.Vector3(...mount.origin_mm).applyQuaternion(rotation).add(B);
   const target=[leg.target[0],leg.target[1],leg.target[2]+height(leg.target[0])];
   const local=new THREE.Vector3(...target).sub(root).applyQuaternion(inverse).multiply(new THREE.Vector3(...mount.signs));
   const baseRotation=new THREE.Quaternion().setFromAxisAngle(Y,pitch*mount.signs[0]);
   try {
    const q=RoverMotion.inverse(local.toArray(),leg.q[3],leg.heading,baseRotation);
    const output=RoverMotion.fromJoints(q,{heading:leg.heading,wheel:leg.angles.wheel,baseRotation}),a=output.angles,d=180/Math.PI;
    const dog=leg.kind!=='transform'?leg.activeMode==='dog':Math.abs(leg.angles.m3+Math.PI/2)<1e-8&&Math.abs(leg.q[3])<1e-8;
    const margin=strict?.3:0;
    const ranges=[[a.m1*d,-50.355151+margin,39.644849-margin],
     [a.m2_relative_ad*d,-54.29675+margin,2.42-margin],
     [a.m3*d,-90,dog?0:-margin],
     [a.primary*d,margin,180-margin],
     [a.secondary*d,dog?-89:-45+margin,dog?89:45-margin],
     [q[1]*d,-28+margin,180]];
    if(!dog&&MODEL.terrain?.wristEnvelope&&a.secondary>0) {
     const rows=MODEL.terrain.wristEnvelope.rows,f=clamp(a.primary*d/5,0,rows.length-1),index=Math.min(Math.floor(f),rows.length-2);
     const cap=rows[index][1]+(rows[index+1][1]-rows[index][1])*(f-index);
     ranges.push([a.secondary*d-cap,-180,-margin]);
    }
    for(const [v,lo,hi] of ranges){violation+=Math.max(0,lo-v,v-hi)**2;constraints.push([v,lo,hi]);}
    if(dog)violation+=(a.m3*d+90)**2+(a.primary*d-90)**2;
    return {...leg,...output,q,root_mm:root.toArray(),target,localTarget:local.toArray(),baseRotation:baseRotation.toArray(),
      flags:{collisionParts:[],unverified:!dog&&Math.abs(a.secondary)>Math.PI/4+1e-8,terrain:true,clearanceUnverified:true}};
   } catch(error){violation+=1e8;return {...leg,terrainError:error.message};}
  });
  return {...state,body_mm:body,body_pitch_rad:pitch,body_rotation:rotation.toArray(),terrain:true,terrain_offset_mm:offset,legs,violation,constraints};
 }
 function project(state,target,old,repair=false) {
  let h=target[0],p=target[1],result=pose(state,h,p,true);
  for(let iteration=0;iteration<10&&result.violation>1e-12;iteration++) {
   const dh=pose(state,h+.1,p,true),dp=pose(state,h,p+.0003,true);
   if(result.constraints.length!==dh.constraints.length||result.constraints.length!==dp.constraints.length)break;
   let aa=.00001,ab=0,bb=.00001,ra=0,rb=0;
   result.constraints.forEach(([v,lo,hi],i)=>{
    const r=v<lo?lo-v+.00001:v>hi?hi-v-.00001:0;if(!r)return;
    const a=(dh.constraints[i][0]-v)*300,b=(dp.constraints[i][0]-v)*(.08/.0003);
    aa+=a*a;ab+=a*b;bb+=b*b;ra+=a*r;rb+=b*r;
   });
   const determinant=aa*bb-ab*ab,sh=clamp((bb*ra-ab*rb)/determinant,-1,1)*30,sp=clamp((aa*rb-ab*ra)/determinant,-1,1)*.08;
   let improved=false;
   for(let t=1;t>=1/32;t/=2){const nh=clamp(h+t*sh,-160,260),np=clamp(p+t*sp,-.5,.5),next=pose(state,nh,np,true);if(next.violation<result.violation){h=nh;p=np;result=next;improved=true;break;}}
   if(!improved)break;
  }
  return result.violation<1e-12?{h,p}:repair?fit(state,old,target):old;
 }
 function fit(state,previous=null,target=null) {
  const pref=target||preferred(state);let best=null,bestFeasible=null;
  const assess=(h,p)=>{
   h=clamp(h,-160,260);p=clamp(p,-.5,.5);
   const output=pose(state,h,p,true),cost=((h-pref[0])/45)**2+((p-pref[1])/.16)**2;
   const candidate={h,p,violation:output.violation,cost,score:output.violation*1e6+cost};
   if(!best||candidate.score<best.score)best=candidate;
   if(candidate.violation<1e-12&&(!bestFeasible||cost<bestFeasible.cost))bestFeasible=candidate;
   return candidate;
  };
  assess(...pref);if(bestFeasible)return bestFeasible;
  if(previous)assess(previous.h,previous.p);
  let center=best;
  for(let scale=1;scale>=1/128;scale/=2) {
   for(let repeat=0;repeat<4;repeat++) {
    const old=center;
    for(const dh of [-30,0,30])for(const dp of [-.08,0,.08])assess(old.h+dh*scale,old.p+dp*scale);
    center=best;if(center===old)break;
   }
  }
  if(!bestFeasible) {
   for(let p=-.48;p<=.48001;p+=.04)for(let h=-120;h<=220;h+=10)assess(h,p);
   center=best;
   for(let scale=.5;scale>=1/256;scale/=2){const old=center;for(const dh of [-10,0,10])for(const dp of [-.04,0,.04])assess(old.h+dh*scale,old.p+dp*scale);center=best;}
  }
  if(!bestFeasible)throw Error(`Terrain posture unavailable: ${state.segment}; ${best.violation}`);
  return bestFeasible;
 }
 function entry(scope,mode) {return MODEL.terrain.modes[scope+':'+mode];}
 function values(scope,mode,phase,loop) {
  const data=entry(scope,mode),absolute=loop+phase,period=Math.floor(absolute/data.period_loops),t=absolute-period*data.period_loops;
  const f=t*data.samples_per_loop,i=Math.min(Math.floor(f),data.rows.length-2),u=f-i;
  return {data,period,index:i,offset:data.rows[i][0]+(data.rows[i+1][0]-data.rows[i][0])*u,
   pitch:data.rows[i][1]+(data.rows[i+1][1]-data.rows[i][1])*u,
   correction:data.rows[i].slice(2).map((v,j)=>v+(data.rows[i+1][j+2]-v)*u+period*data.rows.at(-1)[j+2])};
 }
 function solve(scope,mode,phase,loop=0) {
  const flat=PresentationMotion.solve(scope,mode,phase,loop),v=values(scope,mode,phase,loop);
  const state=pose(flat,v.offset,v.pitch);
  if(state.violation>1e-7) {
   const fitted=project(flat,[v.offset,v.pitch],{h:v.offset,p:v.pitch},true);Object.assign(state,pose(flat,fitted.h,fitted.p));
  }
  state.legs.forEach((l,i)=>{
   l.angles.wheel+=v.correction[i];l.joints.revolute_19=-l.angles.wheel;
   const localPhase=((loop+phase)%v.data.period_loops+v.data.period_loops)%v.data.period_loops;
   const rows=v.data.collision_samples||[],nearest=rows.length?rows.reduce((a,b)=>Math.abs(b.phase-localPhase)<Math.abs(a.phase-localPhase)?b:a):null;
   if(nearest&&Math.abs(nearest.phase-localPhase)<.015) {
    l.flags.collisionParts=nearest.parts[i]||[];l.flags.clearanceUnverified=false;
   }
  });
  return state;
 }
 function template(scope,mode,loop=0) {
  const key=scope+':'+mode+':'+loop;if(templates.has(key))return templates.get(key);
  const flat=PresentationMotion.template(scope,mode),advance=PresentationMotion.timeline(scope,mode).advance;
  const rows=flat.map((row,i)=>{
   const atEnd=i===samples,phase=atEnd?0:i/samples,k=loop+(atEnd?1:0),v=values(scope,mode,phase,k);
   const body=row.body.map((x,j)=>x-(j===0?loop*advance:0)+(j===2?v.offset:0));
   const contacts=row.contacts.map(p=>{const x=p[0]-loop*advance;return [x,p[1],p[2]+height(x)];});
   return {...row,body,contacts,contact:contacts[0]};
  });
  templates.set(key,rows);if(templates.size>8)templates.delete(templates.keys().next().value);return rows;
 }
 function trail(scope,mode,absolute) {
  const start=absolute>=0?Math.max(0,absolute-1):absolute,end=absolute>=0?absolute:Math.min(0,absolute+1);
  const points={body:[],contacts:Array.from({length:scope==='rover'?4:1},()=>[])};
  for(let k=Math.ceil(start*samples);k<end*samples;k++) {
   const loop=Math.floor(k/samples),row=template(scope,mode,loop)[((k%samples)+samples)%samples];
   points.body.push(row.body);row.contacts.forEach((p,i)=>points.contacts[i].push(p));
  }
  if(absolute<0){points.body.reverse();points.contacts.forEach(p=>p.reverse());}
  const loop=Math.floor(absolute),state=solve(scope,mode,absolute-loop,loop);points.body.push(state.body_mm);state.legs.forEach((l,i)=>points.contacts[i].push(l.target));
  return {...points,contact:points.contacts[0]};
 }
 return {height,slope,preferred,pose,fit,project,solve,template,trail,wavelength,get enabled(){return enabled;},setEnabled:value=>{enabled=Boolean(value);}};
})();

const TraceMotion=(()=>{
 const solve=(phase,loop=0,mode='tracing')=>{
  const s=(TerrainMotion.enabled?TerrainMotion:PresentationMotion).solve('leg',mode,phase,loop);
  return {...s.legs[0],advance_mm:s.advance_mm,body_rotation:s.body_rotation,body_pitch_rad:s.body_pitch_rad,terrain:s.terrain,tracing:true};
 };
 return {solve,trail:(absolute,mode='tracing')=>(TerrainMotion.enabled?TerrainMotion:PresentationMotion).trail('leg',mode,absolute),
         templateFor:(mode,loop=0)=>TerrainMotion.enabled?TerrainMotion.template('leg',mode,loop):PresentationMotion.template('leg',mode),
         duration:mode=>PresentationMotion.timeline('leg',mode).units,
         advance:mode=>PresentationMotion.timeline('leg',mode).advance,
         samples:PresentationMotion.samples};
})();

const RoverGait={
 solve:(phase,loop=0,mode='tracing')=>(TerrainMotion.enabled?TerrainMotion:PresentationMotion).solve('rover',mode,phase,loop),
 duration:mode=>PresentationMotion.timeline('rover',mode).units,
 advance:mode=>PresentationMotion.timeline('rover',mode).advance,
 template:(mode,loop=0)=>TerrainMotion.enabled?TerrainMotion.template('rover',mode,loop):PresentationMotion.template('rover',mode),
 trail:(absolute,mode)=>(TerrainMotion.enabled?TerrainMotion:PresentationMotion).trail('rover',mode,absolute),
 samples:PresentationMotion.samples
};

'use strict';
const viewport = document.getElementById('viewport');
const labelLayer = document.getElementById('labels');
const leaderSvg = document.getElementById('leaders');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.005, 20);
camera.up.set(0,0,1);
const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.96;
viewport.prepend(renderer.domElement);
const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.minDistance = 0.18;
controls.maxDistance = 3.5;
controls.target.set(-0.025,-0.245,-0.095);
scene.add(new THREE.HemisphereLight(0xe5f2ff,0x546963,1.45));
const keyLight = new THREE.DirectionalLight(0xfff1d6,2.0);
keyLight.position.set(1,-0.7,1.5);scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xd9ecff,0.9);
fillLight.position.set(-1,0.5,0.6);scene.add(fillLight);
const body = new THREE.Group();scene.add(body);
const modelMaterials = [];
const labelItems = [];
const axisItems = new Map();
let selected = 'm1';
let modelReady = false;
let renderPending = false;
let playing = true;
let cyclePhase = 0;
let phaseSeconds = 2;
let playbackDirection = 1;
let lastTimestamp = null;
let currentMotion = null;
let currentContact = null;
let currentMode = 'gecko';
let sequenceLoopIndex = 0;
let traceFollowOffsetMm = 0;
let highlightedParts = [];
let masterTab='leg',selectedLegId='FL',wholeState=null;
let terrainPathLoop=null;
const transformationProfile={label:'Gait transformation',animate:true,status:'loop',camera_target_m:[-.01,-.24,.30],camera_distance_m:1.9,
 note:'Attachment X/Y stays fixed during transformations. Body height can overshoot to keep the differential inside its intermediate envelope; extra secondary bend is used only after entering Dog. Wheels steer in place and follow short, tangent-continuous routes.'};
const tracingProfile={label:'Motion tracing',animate:true,status:'loop',camera_target_m:[-.05,-.24,.30],camera_distance_m:2.6,
 note:'Red: body attachment / URDF origin. Cyan: wheel contact beneath the swerve axis. Stance holds the wheel on the ground and pushes the attachment forward (−X); swing holds the attachment and advances the wheel. Two steps per mode, a four-second forward drive, then centered grounded transformations. Spider returns through Gecko before Dog.'};
const isSequence=()=>currentMode==='transformation'||currentMode==='tracing';
const profile = () => currentMode==='tracing'?tracingProfile:currentMode==='transformation'?transformationProfile:MODEL.modalities[currentMode];
const durationUnits=()=>masterTab==='rover'?RoverGait.duration(currentMode):TraceMotion.duration(currentMode);
const rigidGroups = new Map();
const identityMatrix = new THREE.Matrix4();
const matrixFromRows = rows => new THREE.Matrix4().set(...rows.flat());
const rigRecords = MODEL.articulation.map(record=>({...record,rest:matrixFromRows(record.rest),inverseReference:matrixFromRows(record.inverse_reference),axis:new THREE.Vector3(...record.axis).normalize(),world:new THREE.Matrix4(),delta:new THREE.Matrix4()}));
const islandDeltas = new Map([['base',identityMatrix]]);
const islandWorlds = new Map([['base',identityMatrix]]);
for(const record of rigRecords){islandDeltas.set(record.id,record.delta);islandWorlds.set(record.id,record.world);}
const wheelReference = matrixFromRows(MODEL.wheelReference);
const wheelReferenceInverse = wheelReference.clone().invert();
const wheelWorld = new THREE.Matrix4();
const rotationScratch = new THREE.Matrix4();
const contactLocal = new THREE.Vector3(...MODEL.wheelContactLocal.slice(0,3));
const meters = p => new THREE.Vector3(...p.map(n=>n/1000));
const selectedRing = new THREE.Mesh(new THREE.SphereGeometry(0.006,20,12),new THREE.MeshBasicMaterial({color:0xd8f9e4,transparent:true,opacity:0.8,depthTest:false}));
selectedRing.renderOrder=120;scene.add(selectedRing);

// Display spans are shortened on their exact axis lines; point pairs define directions,
// rather than the physical length of the shafts.
const spans = {
 m4drive:[[169.2,-60,0],170],m4:[[0,-60,0],170],
 m3drive:[[0,-65.325,0],145],m3:[[0,-161.703,-0.301],350],
 m2drive:[[69.5,-161.703,40],160],m2:[[-69.5,-161.703,40],180],m1:[[-69.5,-161.703,40],180],
 d1drive:[[-96.838,-388.8735,73.374],100],d2drive:[[-96.838,-388.8735,43.374],100],
 d1end:[[0,-448.050,58.374],155],d2end:[[0,-448.050,58.374],155],
 primary:[[0,-448.050,58.374],155],secondary:[[0.8535,-448.622,58.374],140],
 swerve:[[0,-448.050,-90],300],wheel:[[0,-440,-164.334],175]
};
const shortNames = {m4:'M4 · +Y',m3:'M3 · −X',m1:'M1 · −Z',m2:'M2 · +Z',m4drive:'M4 drive · +Y',m3drive:'M3 drive · −X',m2drive:'M2 drive · +Z',d1drive:'Diff 1 input',d2drive:'Diff 2 input',d1end:'Diff 1 sprocket',d2end:'Diff 2 sprocket',primary:'Primary bend · reversed',secondary:'Secondary bend',swerve:'Swerve · +Z',wheel:'Wheel · +Y'};

function addLabel(text,anchor,color,id,classes='') {
 const el=document.createElement('div');el.className='axis-label '+classes;el.textContent=text;el.style.setProperty('--axis',color);
 if(id)el.addEventListener('click',()=>selectAxis(id));labelLayer.append(el);
 const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('stroke',color);line.setAttribute('stroke-width','1');line.setAttribute('opacity','.55');leaderSvg.append(line);
 const item={el,line,anchor,axisId:id,visible:true,world:classes==='world'};labelItems.push(item);return item;
}

function makeArrow(origin,direction,length,color,thickness=0.0009) {
 const group=new THREE.Group();
 const shaft=new THREE.Mesh(new THREE.CylinderGeometry(thickness,thickness,length-0.015,8),new THREE.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:0.9}));
 shaft.position.copy(origin).addScaledVector(direction,(length-0.015)/2);shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);shaft.renderOrder=100;
 const tip=new THREE.Mesh(new THREE.ConeGeometry(0.0045,0.015,12),new THREE.MeshBasicMaterial({color,depthTest:false}));
 tip.position.copy(origin).addScaledVector(direction,length-0.0075);tip.quaternion.copy(shaft.quaternion);tip.renderOrder=101;
 group.add(shaft,tip);return group;
}

for(const axis of MODEL.axes) {
 const direction=new THREE.Vector3(...axis.direction).normalize();
 const center=meters(spans[axis.id][0]);
 const length=spans[axis.id][1]/1000;
 const origin=center.clone().addScaledVector(direction,-length/2);
 const arrow=makeArrow(origin,direction,length,axis.color);arrow.matrixAutoUpdate=false;scene.add(arrow);
 const tip=origin.clone().addScaledVector(direction,length);
 const label=addLabel(shortNames[axis.id],tip,axis.color,axis.id);
 const row=document.createElement('div');row.className='axis-row';row.dataset.axis=axis.id;
 const check=document.createElement('input');check.type='checkbox';check.checked=axis.group==='main';check.setAttribute('aria-label','Show '+axis.name);
 const dot=document.createElement('span');dot.className='dot';dot.style.background=axis.color;
 const name=document.createElement('button');name.className='axis-name';name.textContent=axis.name;
 name.addEventListener('click',()=>{check.checked=true;setAxisVisible(axis.id,true);selectAxis(axis.id);});
 check.addEventListener('change',()=>setAxisVisible(axis.id,check.checked));
 row.append(check,dot,name);document.getElementById(axis.group==='main'?'main-axes':'drive-axes').append(row);
 const perpendicular=new THREE.Vector3().crossVectors(direction,Math.abs(direction.x)>.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0)).normalize();
 const reverseMatrix=new THREE.Matrix4().makeTranslation(...center.toArray()).multiply(new THREE.Matrix4().makeRotationAxis(perpendicular,Math.PI)).multiply(new THREE.Matrix4().makeTranslation(...center.clone().negate().toArray()));
 axisItems.set(axis.id,{axis,arrow,label,row,check,center,reverseMatrix,referenceTip:tip.clone(),visible:check.checked});
 arrow.visible=check.checked;label.visible=check.checked;
}

const worldGroup=new THREE.Group();scene.add(worldGroup);
const worldLabels=[];
for(const [direction,color,text] of [
 [new THREE.Vector3(1,0,0),'#ff7873','+X backward'],
 [new THREE.Vector3(0,1,0),'#62d990','+Y right'],
 [new THREE.Vector3(0,0,1),'#69b5ff','+Z up']]) {
 worldGroup.add(makeArrow(new THREE.Vector3(),direction,0.125,color,0.0012));
 worldLabels.push(addLabel(text,direction.clone().multiplyScalar(.125),color,null,'world'));
}

const pathGroup=new THREE.Group();scene.add(pathGroup);
const sequencePathGroup=new THREE.Group();pathGroup.add(sequencePathGroup);
const sequencePaths=new Map();
sequencePathGroup.visible=false;
const tracePathGroup=new THREE.Group();pathGroup.add(tracePathGroup);tracePathGroup.visible=false;
const traceLines={};
for(const [key,color] of [['body',0xff6c68],['contact',0x7ce2cf]]) {
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array((TraceMotion.samples+4)*3),3));geometry.setDrawRange(0,0);
 const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color,depthTest:false}));line.frustumCulled=false;line.renderOrder=109;tracePathGroup.add(line);
 const ghost=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x697b79,transparent:true,opacity:.22,depthTest:false}));ghost.renderOrder=93;tracePathGroup.add(ghost);
 traceLines[key]={line,ghost};
}
const attachmentMarker=new THREE.Mesh(new THREE.SphereGeometry(.005,18,12),new THREE.MeshBasicMaterial({color:0xff6c68,depthTest:false}));attachmentMarker.renderOrder=126;tracePathGroup.add(attachmentMarker);
const attachmentLabel=addLabel('Body attachment',attachmentMarker.position,'#ff6c68',null,'body-marker');attachmentLabel.visible=false;
const contactTraceLabel=addLabel('Wheel contact',new THREE.Vector3(),'#7ce2cf',null,'contact-marker');contactTraceLabel.visible=false;
const pathLine=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.85,depthTest:false}));
pathLine.renderOrder=95;pathGroup.add(pathLine);
const apex=meters(MODEL.referenceMm);
const pointMaterial=new THREE.MeshBasicMaterial({color:0x9df4d7,depthTest:false});
const pathMarkers=[];
for(let i=0;i<3;i++) {
 const point=new THREE.Mesh(new THREE.SphereGeometry(.0032,16,10),pointMaterial);point.renderOrder=102;pathGroup.add(point);pathMarkers.push(point);
}
const apexLabel=addLabel('Swing peak',apex,'#7ce2cf',null,'apex');
const movingContact=new THREE.Mesh(new THREE.SphereGeometry(.004,18,12),new THREE.MeshBasicMaterial({color:0xeaffbd,depthTest:false}));
movingContact.renderOrder=125;scene.add(movingContact);
const grid=new THREE.GridHelper(1.6,32,0x4c6a60,0x2a413d);grid.rotation.x=Math.PI/2;grid.position.set(0,-.24,MODEL.groundZMm/1000-.001);grid.material.transparent=true;grid.material.opacity=.35;scene.add(grid);

function refreshPath() {
 terrainPathLoop=sequenceLoopIndex;
 if(masterTab==='rover'){refreshRoverPaths();return;}
 roverPathGroup.visible=false;sequencePathGroup.visible=true;tracePathGroup.visible=true;pathLine.visible=false;
 pathMarkers.forEach(point=>point.visible=false);apexLabel.visible=false;
 grid.scale.set(3,1,3);grid.position.set(0,-.25,-.001);
 const rows=TraceMotion.templateFor(currentMode,sequenceLoopIndex),sets=new Map();
 for(const path of sequencePaths.values()){path.line.geometry.dispose();sequencePathGroup.remove(path.line);}sequencePaths.clear();
 for(let i=1;i<rows.length;i++) {
  const a=rows[i-1],b=rows[i];if(a.segment!==b.segment)continue;
  const points=sets.get(b.segment)||[];points.push(a.contact,b.contact);sets.set(b.segment,points);
 }
 for(const [id,points] of sets) {
  const line=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points.map(meters)),new THREE.LineBasicMaterial({color:0x697b79,transparent:true,opacity:.3,depthTest:false}));
  line.renderOrder=94;sequencePathGroup.add(line);sequencePaths.set(id,{line,highlight:{visible:false}});
 }
 for(const key of ['body','contact']) {
  traceLines[key].ghost.geometry.dispose();traceLines[key].ghost.geometry=new THREE.BufferGeometry().setFromPoints(rows.map(r=>meters(r[key])));
 }
 document.getElementById('path-card').innerHTML='<strong>World-space motion trails</strong><div class="legend"><span style="color:#ff6c68">Red: body attachment / URDF origin</span><br><span style="color:#7ce2cf">Cyan: contact beneath swerve axis</span><br>Grey: full loop · Green: active wheel route<br>Stance pushes the attachment forward (−X).<br>Two steps, then four seconds driving at 250 mm/s.<br>Transformations start at stance centers.<br>Spider → Gecko → Dog avoids the direct fold.<br>Trails retain the latest loop.</div>';
}

function setMode(mode) {
 if(!MODEL.modalities[mode]&&!['transformation','tracing'].includes(mode))throw Error('Unknown modality: '+mode);
 if(mode==='transformation')mode='tracing';
 currentMode=mode;cyclePhase=0;sequenceLoopIndex=0;traceFollowOffsetMm=0;lastTimestamp=null;
 const cfg=profile();
 document.querySelectorAll('[data-mode]').forEach(button=>{button.setAttribute('aria-selected',String(button.dataset.mode===mode));button.tabIndex=button.dataset.mode===mode?0:-1;});
 document.getElementById('mode-title').textContent=`${cfg.label} / ${isSequence()?'loop':cfg.animate?'stepping cycle':'constrained pose'}`;
 document.getElementById('mode-heading').textContent=`${cfg.label} ${cfg.status}`;
 document.getElementById('mode-subtitle').textContent=mode==='tracing'?'World travel · Red attachment and cyan wheel trails':isSequence()?'Shared ground · Direct steering and rolling transformations':'World motion trails · Two steps followed by a forward drive';
 document.getElementById('mode-intro').textContent=isSequence()?'Two steps per mode · 4 s rolling · Centered transformations via Gecko.':'250 mm stride · 100 mm lift · Two steps, then 4 s rolling.';
 document.getElementById('sequence-progress').hidden=false;document.getElementById('tracing-options').hidden=false;
 const note=document.getElementById('mode-note');note.textContent=cfg.note;note.classList.toggle('warning',!cfg.animate||cfg.status==='collision review'||cfg.clearance_screen?.passed===false);
 for(const id of ['play-pause','cycle-position','reverse-cycle'])document.getElementById(id).disabled=!cfg.animate;
 refreshPath();setPlaying(cfg.animate);
 if(masterTab==='rover')updateRoverCopy();
 if(modelReady)updateMotion();
 setPhaseSeconds(phaseSeconds);selectAxis(selected);setView('perspective');
 requestFrame();
}
document.querySelectorAll('[data-mode]').forEach(button=>{
 button.addEventListener('click',()=>setMode(button.dataset.mode));
  button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const modes=[...document.querySelectorAll('[data-mode]')].map(b=>b.dataset.mode),index=modes.indexOf(currentMode);const next=event.key==='Home'?0:event.key==='End'?modes.length-1:(index+(event.key==='ArrowRight'?1:-1)+modes.length)%modes.length;setMode(modes[next]);document.querySelector(`[data-mode="${modes[next]}"]`).focus();});
});

function setAxisVisible(id,visible) {
 const item=axisItems.get(id);item.visible=visible;item.arrow.visible=visible;item.label.visible=visible;
 item.check.checked=visible;
 if(selected===id)selectedRing.visible=visible;
 syncAllAxes();
 if(masterTab==='rover'&&roverGeometryReady)for(const [leg,rig] of roverRigs)rig.axes.get(id).visible=leg!==selectedLegId&&visible;
 requestFrame();
}
function syncAllAxes() {
 const toggle=document.getElementById('all-axes'),count=[...axisItems.values()].filter(item=>item.visible).length;
 toggle.checked=count===axisItems.size;toggle.indeterminate=count>0&&count<axisItems.size;
}
function setAllAxes(visible) {for(const id of axisItems.keys())setAxisVisible(id,visible);}
document.getElementById('all-axes').addEventListener('change',event=>setAllAxes(event.target.checked));
syncAllAxes();

function selectAxis(id) {
 selected=id;const item=axisItems.get(id);selectedRing.position.copy(item.center).applyMatrix4(islandDeltas.get(item.axis.owner));selectedRing.visible=item.visible;
 for(const [key,value] of axisItems) {value.row.classList.toggle('selected',key===id);value.label.el.classList.toggle('selected',key===id);}
 const axis=item.axis;const format=p=>`(${p.map(n=>Number(n.toFixed(3))).join(', ')})`;
 let rom=axis.rom;
 if(id==='m4')rom=isSequence()?'0° to +90° during the transformation loop.':'−90° to +90°; held at '+profile().motor4_deg+'° in '+profile().label+'.';
 if(id==='m3'&&currentMode==='spider')rom='−90° to +90°; bidirectional yaw approved for Spider.';
 if(id==='secondary'&&profile().secondary_range_deg)rom='−90° to +90° in Dog only.';
 if(id==='primary'&&profile().fixed_primary_deg!==undefined)rom='Held at '+profile().fixed_primary_deg+'° throughout Dog; no primary travel required.';
 if(isSequence()&&id==='secondary')rom='Gecko/Spider: ±45°. Dog: ±90°. Extra intermediate travel is unverified and highlighted amber.';
 if(isSequence()&&id==='primary')rom='0° to +180°; held at 90° while stepping in Dog.';
 document.getElementById('axis-detail').innerHTML=`<div class="detail-title" style="color:${axis.color}">${axis.name}</div><div class="detail-row"><span>Point 1</span><span class="detail-value" id="detail-p1">${format(axis.p1)} mm</span></div><div class="detail-row"><span>Point 2</span><span class="detail-value" id="detail-p2">${format(axis.p2)} mm</span></div><div class="detail-row"><span>Angle</span><span class="detail-value" id="detail-angle">0.0°</span></div><div class="detail-row"><span>Positive</span><span class="detail-value">Point 1 → Point 2</span></div>${rom?`<div class="detail-row"><span>ROM</span><span class="detail-value">${rom}</span></div>`:''}${axis.teeth?`<div class="detail-row"><span>Drive</span><span class="detail-value">${axis.teeth}</span></div>`:''}<div class="detail-note">Point coordinates move with the supporting body. Positive rotation follows the right-hand rule.</div>`;
 if(currentMotion)updateLiveReadouts();
 requestFrame();
}

document.getElementById('xray').addEventListener('change',event=>{
 for(const material of modelMaterials) {material.transparent=event.target.checked;material.opacity=event.target.checked?.23:1;material.depthWrite=!event.target.checked;material.needsUpdate=true;}
});
document.getElementById('show-world').addEventListener('change',event=>{worldGroup.visible=event.target.checked;worldLabels.forEach(item=>item.visible=event.target.checked);});
document.getElementById('show-path').addEventListener('change',event=>{pathGroup.visible=event.target.checked;apexLabel.visible=false;grid.visible=event.target.checked&&!TerrainMotion.enabled;movingContact.visible=event.target.checked;attachmentLabel.visible=event.target.checked&&true&&document.getElementById('trace-body').checked;contactTraceLabel.visible=event.target.checked&&true&&document.getElementById('trace-wheel').checked;});
for(const id of ['trace-body','trace-wheel','follow-travel'])document.getElementById(id).addEventListener('change',()=>{if(modelReady)updateMotion();requestFrame();});

function setPlaying(value) {
 playing=Boolean(value)&&profile().animate;lastTimestamp=null;
 document.getElementById('play-pause').textContent=playing?'Pause':'Play';
 requestFrame();
}
function setPhase(value) {
 cyclePhase=profile().animate?((Number(value)%1)+1)%1:0;
 sequenceLoopIndex=0;
 if(modelReady)updateMotion();
 requestFrame();
}
function setPhaseSeconds(value) {
 phaseSeconds=THREE.MathUtils.clamp(Number(value),.5,15);
 if(!Number.isFinite(phaseSeconds))phaseSeconds=2;
 document.getElementById('playback-speed').value=Math.log2(2/phaseSeconds);
 const speed=2/phaseSeconds;
 document.getElementById('phase-duration').textContent=`${Number(speed.toFixed(2))}× · ${phaseSeconds.toFixed(2)} s / phase`;
 if(masterTab==='rover')document.getElementById('phase-duration').textContent=`${Number(speed.toFixed(2))}× · ${phaseSeconds.toFixed(2)} s stance · ${(phaseSeconds/4).toFixed(2)} s swing`;
 lastTimestamp=null;
}
document.getElementById('play-pause').addEventListener('click',()=>setPlaying(!playing));
document.getElementById('reset-pose').addEventListener('click',()=>{setPlaying(false);setPhase(0);});
document.getElementById('cycle-position').addEventListener('input',event=>{setPlaying(false);setPhase(Number(event.target.value));});
document.getElementById('playback-speed').addEventListener('input',event=>setPhaseSeconds(2/(2**Number(event.target.value))));
document.getElementById('reverse-cycle').addEventListener('click',event=>{playbackDirection*=-1;event.target.setAttribute('aria-pressed',String(playbackDirection<0));});
document.addEventListener('visibilitychange',()=>{lastTimestamp=null;requestFrame();});

function updateMotion() {
 if(TerrainMotion.enabled&&terrainPathLoop!==sequenceLoopIndex)refreshPath();
 if(masterTab==='rover') {
  wholeState=RoverGait.solve(cyclePhase,sequenceLoopIndex,currentMode);
  const leg=wholeState.legs.find(l=>l.id===selectedLegId);
  currentMotion={...leg,step:wholeState.step||1,segment:wholeState.segment,advance_mm:wholeState.advance_mm};
  updateRoverPose();
 } else {
 currentMotion=TraceMotion.solve(cyclePhase,sequenceLoopIndex,currentMode);
 const root=currentMotion.root_mm||[0,0,0];identityMatrix.compose(meters(root),currentMotion.body_rotation?new THREE.Quaternion(...currentMotion.body_rotation):new THREE.Quaternion(),new THREE.Vector3(1,1,1));
 if(rigidGroups.has('base'))rigidGroups.get('base').matrix.copy(identityMatrix);
 for(const record of rigRecords) {
  record.world.copy(islandWorlds.get(record.parent)).multiply(record.rest).multiply(rotationScratch.makeRotationAxis(record.axis,currentMotion.joints[record.id]||0));
  record.delta.copy(record.world).multiply(record.inverseReference);
  const group=rigidGroups.get(record.id);if(group)group.matrix.copy(record.delta);
 }
 }
 for(const item of axisItems.values()) {
  const delta=islandDeltas.get(item.axis.owner);
  item.arrow.matrix.copy(delta);
  const axialSign=masterTab==='rover'?roverAxisSign(selectedLegId):1;
  if(axialSign<0)item.arrow.matrix.multiply(item.reverseMatrix);
  item.label.anchor.copy(item.referenceTip);if(axialSign<0)item.label.anchor.multiplyScalar(-1).addScaledVector(item.center,2);item.label.anchor.applyMatrix4(delta);
  const prefixes={m1:'M1',m2:'M2',m3:'M3',m4:'M4',m2drive:'M2 drive',m3drive:'M3 drive',m4drive:'M4 drive'};
  if(prefixes[item.axis.id]) {
   const direction=new THREE.Vector3(...item.axis.direction).transformDirection(delta).multiplyScalar(axialSign).toArray(),index=direction.findIndex(v=>Math.abs(v)>.99999);
   item.label.el.textContent=prefixes[item.axis.id]+(index>=0?` · ${direction[index]>0?'+':'−'}${'XYZ'[index]}`:'');
  }
 }
 const item=axisItems.get(selected);selectedRing.position.copy(item.center).applyMatrix4(islandDeltas.get(item.axis.owner));
 wheelWorld.copy(islandDeltas.get('revolute_19')).multiply(wheelReference);
 // The bottom contact is a geometric point on the upright carrier, not a tread
 // marker that rises off the floor when the wheel mesh spins.
 currentContact=contactLocal.clone().applyMatrix4(wheelReference).applyMatrix4(islandDeltas.get('revolute_18'));
 movingContact.position.copy(currentContact);
 highlightedParts=currentMotion.flags.collisionParts;
 const unverified=currentMotion.flags?.unverified;
 for(const material of modelMaterials) {
  if(material.userData.rover)continue;
  const flagged=highlightedParts.includes(material.userData.island);
  const unknown=unverified&&['revolute_11','revolute_13','revolute_14','revolute_15','revolute_16','revolute_17'].includes(material.userData.island);
  material.emissive.set(flagged?0xff4b26:unknown?0xffb941:0x000000);material.emissiveIntensity=flagged||unknown?.7:0;
 }
 for(const [id,path] of sequencePaths) {
  const active=id===currentMotion.segment;path.line.material.color.set(active?0x8ff1c4:0x697b79);path.line.material.opacity=active?1:.3;path.line.renderOrder=active?105:94;
  path.highlight.visible=active;
  document.querySelector(`[data-path-key="${id}"]`)?.classList.toggle('active',active);
 }
 updateLiveReadouts();
 if(masterTab==='rover')updateRoverTrails();else updateTraces();
 updateTerrainSurface();
}
function updateTraces() {
 const absolute=sequenceLoopIndex+cyclePhase,trail=TraceMotion.trail(absolute,currentMode);
 for(const key of ['body','contact']) {
  const {line,ghost}=traceLines[key],points=trail[key],attribute=line.geometry.getAttribute('position');
  points.forEach((point,i)=>attribute.array.set(point.map(v=>v/1000),i*3));attribute.needsUpdate=true;line.geometry.setDrawRange(0,points.length);
  line.visible=document.getElementById(key==='body'?'trace-body':'trace-wheel').checked;ghost.visible=line.visible;ghost.position.x=TerrainMotion.enabled?0:-sequenceLoopIndex*TraceMotion.advance(currentMode)/1000;
 }
 attachmentMarker.position.copy(meters(currentMotion.root_mm));attachmentMarker.visible=traceLines.body.line.visible;
 attachmentLabel.visible=traceLines.body.line.visible&&document.getElementById('show-path').checked;
 contactTraceLabel.anchor.copy(currentContact);contactTraceLabel.visible=traceLines.contact.line.visible&&document.getElementById('show-path').checked;
 if(document.getElementById('follow-travel').checked) {
  const next=currentMotion.root_mm[0],delta=(next-traceFollowOffsetMm)/1000;
  camera.position.x+=delta;controls.target.x+=delta;traceFollowOffsetMm=next;
 }
 for(const {line} of sequencePaths.values())line.position.x=TerrainMotion.enabled?0:-sequenceLoopIndex*TraceMotion.advance(currentMode)/1000;
 grid.position.x=traceFollowOffsetMm/1000;
}
function updateLiveReadouts() {
 const degrees=angle=>angle*180/Math.PI;
 for(const key of ['m1','m2_relative_ad','m3','m4','primary','secondary','swerve','wheel'])document.getElementById('angle-'+key).textContent=`${degrees(currentMotion.angles[key]).toFixed(1)}°`;
 const sequence=isSequence(),label=currentMotion.kind==='walk'?`${MODEL.modalities[currentMotion.activeMode].label} · step ${currentMotion.step}/2 · ${currentMotion.phase}`:currentMotion.kind==='transform'?`${MODEL.modalities[currentMotion.source].label} → ${MODEL.modalities[currentMotion.destination].label} · ${currentMotion.phase}`:`${MODEL.modalities[currentMotion.activeMode].label} · ${currentMotion.phase}`;
 document.getElementById('phase-name').textContent=label;
 document.getElementById('cycle-percent').textContent=`${Math.round(cyclePhase*100)}% of cycle`;
 document.getElementById('cycle-position').value=cyclePhase;
 document.getElementById('current-contact').textContent=`Contact (${currentMotion.target.map(v=>v.toFixed(1)).join(', ')}) mm`;
 document.getElementById('pose-status').textContent=profile().animate?`${playing?'Playing':'Paused'} · ${currentMotion.phase} · ${(durationUnits()*phaseSeconds).toFixed(1)} s / ${sequence?'loop':'cycle'}`:'Static Dog pose · cycle outside joint limits';
 const clearance=document.getElementById('clearance-status');clearance.classList.toggle('collision',highlightedParts.length>0);
 clearance.classList.toggle('unverified',Boolean(currentMotion.flags?.unverified));
 clearance.textContent=highlightedParts.length?'CAD clearance flag · orange parts':currentMotion.flags?.unverified?'Unverified secondary travel (>45°) · amber wrist':TerrainMotion.enabled?(currentMotion.flags.clearanceUnverified?'Terrain contact preview · clearance unverified':'Terrain contact preview · no sampled clearance flag'):profile().animate?'No flagged contact at this sampled pose':'Valid static pose · requested cycle disabled';
 document.getElementById('sequence-progress').textContent=`${currentMotion.phase} · Mount Z = ${currentMotion.root_mm[2].toFixed(1)} mm · Forward travel = ${currentMotion.advance_mm.toFixed(0)} mm · ${(durationUnits()*phaseSeconds).toFixed(1)} s loop`;

 const item=axisItems.get(selected),delta=islandDeltas.get(item.axis.owner);
 const format=p=>`(${meters(p).applyMatrix4(delta).multiplyScalar(1000).toArray().map(v=>v.toFixed(2)).join(', ')}) mm`;
 const flip=masterTab==='rover'&&roverAxisSign(selectedLegId)<0;
 document.getElementById('detail-p1').textContent=format(flip?item.axis.p2:item.axis.p1);
 document.getElementById('detail-p2').textContent=format(flip?item.axis.p1:item.axis.p2);
 const keys={m2:'m2_relative_ad',m2drive:'m2',m3drive:'m3',m4drive:'m4',d1drive:'diff1',d1end:'diff1',d2drive:'diff2',d2end:'diff2'};
 let angle=currentMotion.angles[keys[selected]||selected]||0;
 if(selected==='m2drive')angle*=34/24;
 if(selected==='m4drive')angle*=124/48;
 document.getElementById('detail-angle').textContent=`${degrees(angle).toFixed(2)}°${selected==='m2'?' relative to AD':''}`;
}

function resize() {
 const {width,height}=viewport.getBoundingClientRect();camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);
 requestFrame();
}
new ResizeObserver(resize).observe(viewport);
function setView(view) {
 const target=new THREE.Vector3(-.05+traceFollowOffsetMm/1000,-.24,.30);controls.target.copy(target);
 
 if(masterTab==='rover'){target.set(traceFollowOffsetMm/1000,0,.32);controls.target.copy(target);}
const distance=(masterTab==='rover'?3.4:currentMode==='tracing'?2.6:currentMode==='dog'?2.3:1.9)*(camera.aspect<1?1.22:1);
 camera.up.set(0,0,1);
 if(view==='top') {camera.position.copy(target).add(new THREE.Vector3(0,0,distance));camera.up.set(0,1,0);}
 else if(view==='front')camera.position.copy(target).add(new THREE.Vector3(-distance,0,0));
 else if(view==='left')camera.position.copy(target).add(new THREE.Vector3(0,-distance,0));
 else camera.position.copy(target).add(new THREE.Vector3(.70,-.62,.53).normalize().multiplyScalar(distance));
 camera.lookAt(target);controls.update();
 document.querySelectorAll('[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
 requestFrame();
}
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));

function positionLabels() {
 const width=viewport.clientWidth,height=viewport.clientHeight;const occupied=[];
 const showLabels=document.getElementById('show-labels').checked;
 const sorted=[...labelItems].sort((a,b)=>(b.axisId===selected)-(a.axisId===selected));
 for(const item of sorted) {
  const projected=item.anchor.clone().project(camera);
  const show=item.visible&&showLabels&&projected.z>-1&&projected.z<1;
  item.el.style.display=show?'block':'none';item.line.style.display=show?'block':'none';if(!show)continue;
  const anchorX=(projected.x+1)*width/2,anchorY=(1-projected.y)*height/2;
  const w=item.el.offsetWidth,h=item.el.offsetHeight;
  let x=Math.max(14,Math.min(width-w-14,anchorX+12));
  let y=Math.max(155,Math.min(height-h-102,anchorY-15));
  const preferred=item.axisId==='secondary'?-30:item.axisId==='primary'?15:0;y+=preferred;
  for(let tries=0;tries<20;tries++) {
   const overlap=occupied.find(r=>x<r.x+r.w+5&&x+w+5>r.x&&y<r.y+r.h+5&&y+h+5>r.y);
   if(!overlap)break;
   if(overlap.y+overlap.h+h+10<height-95)y=overlap.y+overlap.h+6;
   else {y=Math.max(155,overlap.y-h-6);x=Math.max(14,x-w*.45);}
  }
  occupied.push({x,y,w,h});item.el.style.transform=`translate(${x}px,${y}px)`;
  item.line.setAttribute('x1',anchorX);item.line.setAttribute('y1',anchorY);item.line.setAttribute('x2',Math.max(x,Math.min(x+w,anchorX)));item.line.setAttribute('y2',y+h/2);
 }
}

async function loadGeometry() {
 const buffer=await unpackPayload('geometry-payload');
 for(const descriptor of MODEL.meshes) {
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(buffer,descriptor.positions.offset,descriptor.positions.length),3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(buffer,descriptor.normals.offset,descriptor.normals.length),3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer,descriptor.indices.offset,descriptor.indices.length),1));
  geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({color:new THREE.Color(...descriptor.color.slice(0,3)),metalness:.18,roughness:.58,side:THREE.DoubleSide});
  material.userData.island=descriptor.island;
  modelMaterials.push(material);
  if(!rigidGroups.has(descriptor.island)) {const group=new THREE.Group();group.matrixAutoUpdate=false;rigidGroups.set(descriptor.island,group);body.add(group);}
  rigidGroups.get(descriptor.island).add(new THREE.Mesh(geometry,material));
 }
 await loadRoverGeometry();
 modelReady=true;document.getElementById('loading').remove();
 updateMotion();
 window.__axisReview={ready:true,stats:MODEL.stats,axes:MODEL.axes.map(a=>({id:a.id,direction:a.direction})),renderer,scene,camera,controls,setView,selectAxis,setAxisVisible,setAllAxes,
  pause:()=>setPlaying(false),play:()=>setPlaying(true),setPhase,setPhaseSeconds,setMode,setMasterTab,setInspectLeg,setTerrain,
  getState:()=>({terrainEnabled:TerrainMotion.enabled,durationSeconds:durationUnits()*phaseSeconds,masterTab,mode:currentMode,playing,cyclePhase,phaseSeconds,playbackDirection,sequenceLoopIndex,highlightedParts,...currentMotion,actualContactMm:currentContact.clone().multiplyScalar(1000).toArray(),wheelFrameDelta:wheelWorld.clone().multiply(wheelReferenceInverse).elements,
   uprightFrameDelta:islandDeltas.get('revolute_18').elements,activePaths:[...sequencePaths].filter(([id,path])=>path.line.material.opacity===1).map(([id])=>id),
   jointAxesVisible:[...axisItems.values()].filter(item=>item.visible).map(item=>item.axis.id),
   bodyAttachmentMm:new THREE.Vector3().setFromMatrixPosition(identityMatrix).multiplyScalar(1000).toArray(),tracePointCounts:Object.fromEntries(Object.entries(traceLines).map(([key,item])=>[key,item.line.geometry.drawRange.count])),traceFollowOffsetMm,
   traceEndpointsMm:Object.fromEntries(Object.entries(traceLines).map(([key,item])=>{const count=item.line.geometry.drawRange.count;return [key,count?Array.from(item.line.geometry.getAttribute('position').array.slice((count-1)*3,count*3)).map(v=>v*1000):null];})),
   axisDirections:Object.fromEntries([...axisItems].map(([id,item])=>[id,new THREE.Vector3(...item.axis.direction).transformDirection(islandDeltas.get(item.axis.owner)).multiplyScalar(masterTab==='rover'?roverAxisSign(selectedLegId):1).toArray()])),...(masterTab==='rover'?roverStateForReview():{})})};
 requestFrame();
}
const roverGroup=new THREE.Group();scene.add(roverGroup);roverGroup.visible=false;
const chassisGroup=new THREE.Group();roverGroup.add(chassisGroup);chassisGroup.matrixAutoUpdate=false;
const roverRigs=new Map(),roverPathGroup=new THREE.Group();pathGroup.add(roverPathGroup);roverPathGroup.visible=false;
const roverPaths=new Map(),roverTrailLines=new Map();
const roverOriginMarker=new THREE.Mesh(new THREE.SphereGeometry(.007,16,10),new THREE.MeshBasicMaterial({color:0xff6c68,depthTest:false}));roverOriginMarker.renderOrder=126;roverPathGroup.add(roverOriginMarker);
const masterMemory={leg:{mode:'gecko',phase:0,loop:0,playing:true},rover:{mode:'gecko',phase:0,loop:0,playing:true}};
let roverGeometryReady=false;
for(const key of ['body',...MODEL.rover.mounts.map(m=>m.id)]) {
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array((RoverGait.samples+4)*3),3));geometry.setDrawRange(0,0);
 const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:key==='body'?0xff6c68:0x7ce2cf,depthTest:false}));line.frustumCulled=false;line.renderOrder=109;roverPathGroup.add(line);roverTrailLines.set(key,line);
}
async function unpackPayload(id) {
 const asset=PACKED_ASSETS[id];
 if(!asset)throw Error('Unknown geometry asset: '+id);
 const response=await fetch(new URL(asset.file,ASSET_BASE));
 if(!response.ok)throw Error('Could not load '+asset.file+' ('+response.status+')');
 const packed=await response.arrayBuffer();
 if(packed.byteLength!==asset.packedBytes)throw Error('Unexpected geometry size: '+asset.file);
 const buffer=await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 if(buffer.byteLength!==asset.rawBytes)throw Error('Invalid decompressed geometry: '+asset.file);
 return buffer;
}
async function loadRoverGeometry() {
 // Geometry buffers are shared by every leg. Separate transforms preserve
 // reflected handedness and correct normals without negative instanced scales.
 for(const mount of MODEL.rover.mounts) {
  const group=new THREE.Group();roverGroup.add(group);const groups=new Map(),materials=[];
  for(const [island,original] of rigidGroups) {
   const child=new THREE.Group();child.matrixAutoUpdate=false;groups.set(island,child);group.add(child);
   for(const mesh of original.children) {
    const material=mesh.material.clone();material.emissiveIntensity=0;material.userData={island,rover:mount.id};materials.push(material);modelMaterials.push(material);child.add(new THREE.Mesh(mesh.geometry,material));
   }
  }
  const base=new THREE.Matrix4(),records=MODEL.articulation.map(r=>({...r,rest:matrixFromRows(r.rest),inverseReference:matrixFromRows(r.inverse_reference),axis:new THREE.Vector3(...r.axis).normalize(),world:new THREE.Matrix4(),delta:new THREE.Matrix4()}));
  const worlds=new Map([['base',base]]),deltas=new Map([['base',base]]),axes=new Map();
  for(const record of records){worlds.set(record.id,record.world);deltas.set(record.id,record.delta);}
  for(const [id,item] of axisItems) {const arrow=item.arrow.clone(true);arrow.matrixAutoUpdate=false;scene.add(arrow);axes.set(id,arrow);arrow.visible=false;}
  roverRigs.set(mount.id,{mount,group,groups,records,base,worlds,deltas,materials,axes,contact:new THREE.Vector3()});
 }
 const buffer=await unpackPayload('chassis-payload');
 for(const descriptor of MODEL.rover.meshes) {
  const geometry=new THREE.BufferGeometry();
  for(const [key,name] of [['positions','position'],['normals','normal']])geometry.setAttribute(name,new THREE.BufferAttribute(new Float32Array(buffer,descriptor[key].offset,descriptor[key].length),3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer,descriptor.indices.offset,descriptor.indices.length),1));geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({color:new THREE.Color(...descriptor.color.slice(0,3)),metalness:.18,roughness:.58,side:THREE.DoubleSide});material.userData.rover='chassis';modelMaterials.push(material);chassisGroup.add(new THREE.Mesh(geometry,material));
 }
 roverGeometryReady=true;
}
function updateRoverPose() {
 body.visible=false;roverGroup.visible=true;
 const rotation=wholeState.body_rotation?new THREE.Quaternion(...wholeState.body_rotation):new THREE.Quaternion();
 chassisGroup.matrix.compose(meters(wholeState.body_mm),rotation,new THREE.Vector3(1,1,1));
 for(let i=0;i<wholeState.legs.length;i++) {
  const state=wholeState.legs[i],rig=roverRigs.get(state.id),mount=rig.mount;
  rig.base.compose(meters(state.root_mm),rotation,new THREE.Vector3(...mount.signs));
  rig.groups.get('base').matrix.copy(rig.base);
  for(const record of rig.records) {
   record.world.copy(rig.worlds.get(record.parent)).multiply(record.rest).multiply(rotationScratch.makeRotationAxis(record.axis,state.joints[record.id]||0));
   record.delta.copy(record.world).multiply(record.inverseReference);rig.groups.get(record.id)?.matrix.copy(record.delta);
  }
  rig.contact.copy(contactLocal).applyMatrix4(wheelReference).applyMatrix4(rig.deltas.get('revolute_18'));
  for(const material of rig.materials) {
   const flag=state.flags.collisionParts.includes(material.userData.island),unknown=state.flags.unverified&&['revolute_11','revolute_13','revolute_14','revolute_15','revolute_16','revolute_17'].includes(material.userData.island);
   material.emissive.set(flag?0xff4b26:unknown?0xffb941:0x000000);material.emissiveIntensity=flag||unknown?.7:0;
  }
  for(const [id,arrow] of rig.axes){const item=axisItems.get(id);arrow.matrix.copy(rig.deltas.get(item.axis.owner));if(roverAxisSign(state.id)<0)arrow.matrix.multiply(item.reverseMatrix);arrow.visible=state.id!==selectedLegId&&item.visible;}
 }
 const selectedRig=roverRigs.get(selectedLegId);identityMatrix.copy(selectedRig.base);
 for(const record of rigRecords)record.delta.copy(selectedRig.deltas.get(record.id));
}
function roverAxisSign(id) {
 // Rotation axes are axial vectors: a reflection transforms them with
 // det(S)*S, preserving the right-hand rule for the displayed joint angle.
 const signs=MODEL.rover.mounts.find(m=>m.id===id).signs;return signs[0]*signs[1]*signs[2];
}
function setMasterTab(tab) {
 if(!['leg','rover'].includes(tab))throw Error('Unknown master tab');
 masterMemory[masterTab]={mode:currentMode,phase:cyclePhase,loop:sequenceLoopIndex,playing};masterTab=tab;
 const memory=masterMemory[tab];
 document.querySelectorAll('[data-master]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.master===tab));b.tabIndex=b.dataset.master===tab?0:-1;});
 document.getElementById('assembly-eyebrow').textContent=tab==='rover'?'Four-leg crawl study':'Single-leg motion study';
 document.getElementById('leg-selector-row').hidden=tab!=='rover';
 document.querySelector('.masthead .eyebrow').textContent=tab==='rover'?'Multimodal lunar rover · Full assembly':'Multimodal lunar rover · Front left';
 body.visible=tab==='leg';roverGroup.visible=tab==='rover';roverPathGroup.visible=tab==='rover';
 controls.maxDistance=tab==='rover'?8:3.5;
 for(const rig of roverRigs.values())for(const arrow of rig.axes.values())arrow.visible=false;
 attachmentLabel.el.textContent=tab==='rover'?'Chassis origin':'Body attachment';
 const ends=document.querySelectorAll('.range-ends span');ends[0].textContent=tab==='rover'?'15 s stance':'15 s / phase';ends[1].textContent=tab==='rover'?'0.5 s stance · 4×':'0.5 s / phase · 4×';
 setMode(memory.mode);cyclePhase=memory.phase;sequenceLoopIndex=memory.loop;setPlaying(memory.playing);
 if(modelReady)updateMotion();setView('perspective');requestFrame();
}
function setInspectLeg(id) {
 if(!roverRigs.has(id))throw Error('Unknown leg');selectedLegId=id;document.getElementById('leg-selector').value=id;
 if(masterTab==='rover'&&modelReady){updateMotion();selectAxis(selected);}requestFrame();
}
function updateRoverCopy() {
 document.getElementById('mode-subtitle').textContent='Constant chassis speed while walking · One leg swings at a time · 4 s forward drives';
 document.getElementById('mode-intro').textContent='80% stance · 20% swing · 4× swing XY speed relative to chassis. Two crawl cycles, then 4 s rolling at 250 mm/s with front wheels forward and rear wheels back.';
 document.getElementById('mode-note').textContent='Old chassis with the newer reviewed leg at its measured mounts. Red tracks the chassis URDF origin. Walking advances only −X; transformations hold chassis X/Y fixed and change Z. Mirrored legs are a visualization assembly; balance and inter-leg clearance are not validated.';
 document.getElementById('sequence-progress').hidden=false;
 setPhaseSeconds(phaseSeconds);
}
function refreshRoverPaths() {
 sequencePathGroup.visible=false;tracePathGroup.visible=false;pathLine.visible=false;pathMarkers.forEach(m=>m.visible=false);apexLabel.visible=false;
 roverPathGroup.visible=true;grid.scale.set(4,1,4);grid.position.set(0,0,-.001);
 for(const value of roverPaths.values()){value.line.geometry.dispose();roverPathGroup.remove(value.line);}roverPaths.clear();
 const template=RoverGait.template(currentMode,sequenceLoopIndex),sets=new Map();
 for(let j=1;j<template.length;j++) {
  const a=template[j-1],b=template[j];if(a.segment!==b.segment)continue;
  MODEL.rover.mounts.forEach((m,i)=>{const id=b.segment+':'+m.id,points=sets.get(id)||[];points.push(a.contacts[i],b.contacts[i]);sets.set(id,points);});
 }
 for(const [id,points] of sets) {
  const line=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points.map(meters)),new THREE.LineBasicMaterial({color:0x697b79,transparent:true,opacity:.28,depthTest:false}));line.renderOrder=94;roverPathGroup.add(line);roverPaths.set(id,{line});
 }
 document.getElementById('path-card').innerHTML='<strong>Whole-rover world paths</strong><div class="legend"><span style="color:#ff6c68">Red: chassis URDF origin</span><br><span style="color:#7ce2cf">Cyan: four wheel contact trails</span><br>Grey: all wheel routes for this loop<br>Green: active moving wheel route<br>FL → RR → FR → RL swing order<br>312.5 mm chassis travel per crawl cycle<br>Transformations: centered stance, chassis X/Y fixed.<br>Spider → Gecko → Dog via reversible routes.</div>';
 attachmentLabel.visible=document.getElementById('show-path').checked;contactTraceLabel.visible=attachmentLabel.visible;
}
function updateRoverTrails() {
 const absolute=sequenceLoopIndex+cyclePhase,points=RoverGait.trail(absolute,currentMode),bodyVisible=document.getElementById('trace-body').checked,contactVisible=document.getElementById('trace-wheel').checked;
 for(const [key,line] of roverTrailLines) {
  const rows=key==='body'?points.body:points.contacts[MODEL.rover.mounts.findIndex(m=>m.id===key)],attribute=line.geometry.getAttribute('position');
  rows.forEach((p,i)=>attribute.array.set(p.map(v=>v/1000),i*3));attribute.needsUpdate=true;line.geometry.setDrawRange(0,rows.length);line.visible=key==='body'?bodyVisible:contactVisible;
 }
 for(const [id,{line}] of roverPaths) {
  const [segment,leg]=id.split(':'),active=segment===wholeState.segment&&(wholeState.kind!=='walk'||leg===wholeState.swingLeg);
  line.material.color.set(active?0x8ff1c4:0x697b79);line.material.opacity=active?1:.28;line.renderOrder=active?105:94;line.position.x=TerrainMotion.enabled?0:-sequenceLoopIndex*RoverGait.advance(currentMode)/1000;
 }
 attachmentMarker.position.copy(meters(wholeState.body_mm));attachmentMarker.visible=bodyVisible;
 roverOriginMarker.position.copy(meters(wholeState.body_mm));roverOriginMarker.visible=bodyVisible;
 // The existing marker belongs to the single-leg trail group; place the label
 // directly at the chassis origin in this view.
 attachmentLabel.anchor.copy(meters(wholeState.body_mm));attachmentLabel.visible=bodyVisible&&document.getElementById('show-path').checked;
 contactTraceLabel.anchor.copy(currentContact);contactTraceLabel.visible=contactVisible&&document.getElementById('show-path').checked;
 if(document.getElementById('follow-travel').checked){const next=wholeState.body_mm[0],delta=(next-traceFollowOffsetMm)/1000;camera.position.x+=delta;controls.target.x+=delta;traceFollowOffsetMm=next;}
 grid.position.x=traceFollowOffsetMm/1000;
 const speeds=`${phaseSeconds.toFixed(2)} s stance · ${(phaseSeconds/4).toFixed(2)} s swing`;
 document.getElementById('phase-duration').textContent=`${Number((2/phaseSeconds).toFixed(2))}× · ${speeds}`;
 document.getElementById('sequence-progress').textContent=`${wholeState.kind==='walk'?`Step ${wholeState.step||1}/2 · ${wholeState.swingLeg?'Swing '+wholeState.swingLeg:'All wheels grounded'}`:wholeState.phase} · Chassis origin Z = ${wholeState.body_mm[2].toFixed(1)} mm · ${(durationUnits()*phaseSeconds).toFixed(1)} s / ${isSequence()?'loop':'cycle'}`;
}
function roverStateForReview() {
 const lineState=key=>{const line=roverTrailLines.get(key),n=line.geometry.drawRange.count;return {count:n,end:n?Array.from(line.geometry.getAttribute('position').array.slice((n-1)*3,n*3)).map(v=>v*1000):null};};
 return {selectedLegId,wholeState,chassisOriginMm:wholeState.body_mm,allContactsMm:Object.fromEntries([...roverRigs].map(([id,rig])=>[id,rig.contact.clone().multiplyScalar(1000).toArray()])),
  tracePointCounts:{body:lineState('body').count,contact:lineState(selectedLegId).count},traceEndpointsMm:{body:lineState('body').end,contact:lineState(selectedLegId).end},
  activePaths:[...roverPaths].filter(([id,p])=>p.line.material.opacity===1).map(([id])=>id),
  jointAxesVisibleCount:[...axisItems.values()].filter(a=>a.visible).length*4};
}
document.querySelectorAll('[data-master]').forEach(b=>b.addEventListener('click',()=>setMasterTab(b.dataset.master)));
document.querySelectorAll('[data-master]').forEach(b=>b.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();setMasterTab(event.key==='Home'?'leg':event.key==='End'?'rover':masterTab==='leg'?'rover':'leg');document.querySelector(`[data-master="${masterTab}"]`).focus();}}));
document.getElementById('leg-selector').addEventListener('change',event=>setInspectLeg(event.target.value));

const terrainGroup=new THREE.Group();scene.add(terrainGroup);terrainGroup.visible=false;
const terrainGeometry=new THREE.PlaneGeometry(12,5,600,40);
const terrainMaterial=new THREE.MeshStandardMaterial({color:0x687063,roughness:1,metalness:0,side:THREE.DoubleSide});
const terrainSurface=new THREE.Mesh(terrainGeometry,terrainMaterial);terrainGroup.add(terrainSurface);
const terrainWire=new THREE.LineSegments(new THREE.WireframeGeometry(terrainGeometry),new THREE.LineBasicMaterial({color:0x9da68b,transparent:true,opacity:.075}));
terrainWire.position.z=.0007;terrainGroup.add(terrainWire);
let terrainCenter=null;
const terrainShapes=new Map();
function updateTerrainSurface() {
 terrainGroup.visible=TerrainMotion.enabled;grid.visible=document.getElementById('show-path').checked&&!TerrainMotion.enabled;
 if(!TerrainMotion.enabled)return;
 const bodyX=masterTab==='rover'?wholeState.body_mm[0]:currentMotion.root_mm[0],center=Math.round(bodyX/500)*500;
 if(center===terrainCenter)return;terrainCenter=center;
 const phase=((center%1000)+1000)%1000;
 if(!terrainShapes.has(phase)) {
  const geometry=new THREE.PlaneGeometry(12,5,600,40),positions=geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++)positions.setZ(i,TerrainMotion.height(phase+1000*positions.getX(i))/1000);
  positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  terrainShapes.set(phase,{geometry,wire:new THREE.WireframeGeometry(geometry)});
 }
 const shape=terrainShapes.get(phase);terrainSurface.geometry=shape.geometry;terrainWire.geometry=shape.wire;
 terrainSurface.position.x=center/1000;terrainWire.position.x=center/1000;
}
function setTerrain(value) {
 TerrainMotion.setEnabled(value);document.getElementById('terrain-toggle').checked=TerrainMotion.enabled;
 document.getElementById('terrain-note').hidden=!TerrainMotion.enabled;terrainPathLoop=null;terrainCenter=null;
 refreshPath();if(modelReady)updateMotion();requestFrame();
}
document.getElementById('terrain-toggle').addEventListener('change',event=>setTerrain(event.target.checked));

resize();setMode('gecko');setPhaseSeconds(2);
function requestFrame() {
 if(renderPending)return;
 renderPending=true;
 requestAnimationFrame(timestamp=>{
  renderPending=false;
  if(modelReady&&playing&&!document.hidden) {
   if(lastTimestamp!==null) {
    const next=cyclePhase+playbackDirection*(timestamp-lastTimestamp)/1000/(durationUnits()*phaseSeconds);
    sequenceLoopIndex+=Math.floor(next);
    cyclePhase=((next%1)+1)%1;
   }
   lastTimestamp=timestamp;updateMotion();
  }
  controls.update();renderer.render(scene,camera);positionLabels();
  if(modelReady&&playing&&!document.hidden)requestFrame();
 });
}
controls.addEventListener('change',requestFrame);
document.addEventListener('change',requestFrame);
requestFrame();
loadGeometry().catch(error=>{console.error(error);document.getElementById('loading').textContent='The model could not load: '+error.message;window.__axisReview={ready:false,error:error.message};});
})().catch(error=>{
 console.error(error);
 const loading=document.getElementById('loading');
 if(loading)loading.textContent='The model could not load: '+error.message;
 window.__axisReview={ready:false,error:error.message};
});
