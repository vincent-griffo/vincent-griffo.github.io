(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,43216,e=>{"use strict";let t,i;var n=e.i(31067),r=e.i(71645),a=e.i(90072),o=e.i(48546),s=a,l=a;let d=new l.Box3,u=new l.Vector3;class c extends l.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new l.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new l.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let i=new l.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new l.InterleavedBufferAttribute(i,3,0)),this.setAttribute("instanceEnd",new l.InterleavedBufferAttribute(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));let n=new l.InstancedInterleavedBuffer(i,2*t,1);return this.setAttribute("instanceColorStart",new l.InterleavedBufferAttribute(n,t,0)),this.setAttribute("instanceColorEnd",new l.InterleavedBufferAttribute(n,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new l.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new l.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),d.setFromBufferAttribute(t),this.boundingBox.union(d))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new l.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let i=this.boundingSphere.center;this.boundingBox.getCenter(i);let n=0;for(let r=0,a=e.count;r<a;r++)u.fromBufferAttribute(e,r),n=Math.max(n,i.distanceToSquared(u)),u.fromBufferAttribute(t,r),n=Math.max(n,i.distanceToSquared(u));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var f=a,p=e.i(8560),m=e.i(31497);class h extends f.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:f.UniformsUtils.clone(f.UniformsUtils.merge([p.UniformsLib.common,p.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new f.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${m.version>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let g=m.version>=125?"uv1":"uv2",v=new s.Vector4,y=new s.Vector3,b=new s.Vector3,w=new s.Vector4,x=new s.Vector4,S=new s.Vector4,_=new s.Vector3,E=new s.Matrix4,A=new s.Line3,O=new s.Vector3,z=new s.Box3,P=new s.Sphere,C=new s.Vector4;function L(e,t,n){return C.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),C.multiplyScalar(1/C.w),C.x=i/n.width,C.y=i/n.height,C.applyMatrix4(e.projectionMatrixInverse),C.multiplyScalar(1/C.w),Math.abs(Math.max(C.x,C.y))}class j extends s.Mesh{constructor(e=new c,t=new h({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let e=0,r=0,a=t.count;e<a;e++,r+=2)y.fromBufferAttribute(t,e),b.fromBufferAttribute(i,e),n[r]=0===r?0:n[r-1],n[r+1]=n[r]+y.distanceTo(b);let r=new s.InstancedInterleavedBuffer(n,2,1);return e.setAttribute("instanceDistanceStart",new s.InterleavedBufferAttribute(r,1,0)),e.setAttribute("instanceDistanceEnd",new s.InterleavedBufferAttribute(r,1,1)),this}raycast(e,n){let r,a,o=this.material.worldUnits,l=e.camera;null!==l||o||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let d=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let u=this.matrixWorld,c=this.geometry,f=this.material;if(i=f.linewidth+d,null===c.boundingSphere&&c.computeBoundingSphere(),P.copy(c.boundingSphere).applyMatrix4(u),o)r=.5*i;else{let e=Math.max(l.near,P.distanceToPoint(t.origin));r=L(l,e,f.resolution)}if(P.radius+=r,!1!==t.intersectsSphere(P)){if(null===c.boundingBox&&c.computeBoundingBox(),z.copy(c.boundingBox).applyMatrix4(u),o)a=.5*i;else{let e=Math.max(l.near,z.distanceToPoint(t.origin));a=L(l,e,f.resolution)}z.expandByScalar(a),!1!==t.intersectsBox(z)&&(o?function(e,n){let r=e.matrixWorld,a=e.geometry,o=a.attributes.instanceStart,l=a.attributes.instanceEnd,d=Math.min(a.instanceCount,o.count);for(let a=0;a<d;a++){A.start.fromBufferAttribute(o,a),A.end.fromBufferAttribute(l,a),A.applyMatrix4(r);let d=new s.Vector3,u=new s.Vector3;t.distanceSqToSegment(A.start,A.end,u,d),u.distanceTo(d)<.5*i&&n.push({point:u,pointOnLine:d,distance:t.origin.distanceTo(u),object:e,face:null,faceIndex:a,uv:null,[g]:null})}}(this,n):function(e,n,r){let a=n.projectionMatrix,o=e.material.resolution,l=e.matrixWorld,d=e.geometry,u=d.attributes.instanceStart,c=d.attributes.instanceEnd,f=Math.min(d.instanceCount,u.count),p=-n.near;t.at(1,S),S.w=1,S.applyMatrix4(n.matrixWorldInverse),S.applyMatrix4(a),S.multiplyScalar(1/S.w),S.x*=o.x/2,S.y*=o.y/2,S.z=0,_.copy(S),E.multiplyMatrices(n.matrixWorldInverse,l);for(let n=0;n<f;n++){if(w.fromBufferAttribute(u,n),x.fromBufferAttribute(c,n),w.w=1,x.w=1,w.applyMatrix4(E),x.applyMatrix4(E),w.z>p&&x.z>p)continue;if(w.z>p){let e=w.z-x.z,t=(w.z-p)/e;w.lerp(x,t)}else if(x.z>p){let e=x.z-w.z,t=(x.z-p)/e;x.lerp(w,t)}w.applyMatrix4(a),x.applyMatrix4(a),w.multiplyScalar(1/w.w),x.multiplyScalar(1/x.w),w.x*=o.x/2,w.y*=o.y/2,x.x*=o.x/2,x.y*=o.y/2,A.start.copy(w),A.start.z=0,A.end.copy(x),A.end.z=0;let d=A.closestPointToPointParameter(_,!0);A.at(d,O);let f=s.MathUtils.lerp(w.z,x.z,d),m=f>=-1&&f<=1,h=_.distanceTo(O)<.5*i;if(m&&h){A.start.fromBufferAttribute(u,n),A.end.fromBufferAttribute(c,n),A.start.applyMatrix4(l),A.end.applyMatrix4(l);let i=new s.Vector3,a=new s.Vector3;t.distanceSqToSegment(A.start,A.end,a,i),r.push({point:a,pointOnLine:i,distance:t.origin.distanceTo(a),object:e,face:null,faceIndex:n,uv:null,[g]:null})}}}(this,l,n))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(v),this.material.uniforms.resolution.value.set(v.z,v.w))}}class M extends c{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,i=new Float32Array(2*t);for(let n=0;n<t;n+=3)i[2*n]=e[n],i[2*n+1]=e[n+1],i[2*n+2]=e[n+2],i[2*n+3]=e[n+3],i[2*n+4]=e[n+4],i[2*n+5]=e[n+5];return super.setPositions(i),this}setColors(e,t=3){let i=e.length-t,n=new Float32Array(2*i);if(3===t)for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];else for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5],n[2*r+6]=e[r+6],n[2*r+7]=e[r+7];return super.setColors(n,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class U extends j{constructor(e=new M,t=new h({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let R=r.forwardRef(function({points:e,color:t=0xffffff,vertexColors:i,linewidth:s,lineWidth:l,segments:d,dashed:u,...f},p){var m,g;let v=(0,o.useThree)(e=>e.size),y=r.useMemo(()=>d?new j:new U,[d]),[b]=r.useState(()=>new h),w=(null==i||null==(m=i[0])?void 0:m.length)===4?4:3,x=r.useMemo(()=>{let n=d?new c:new M,r=e.map(e=>{let t=Array.isArray(e);return e instanceof a.Vector3||e instanceof a.Vector4?[e.x,e.y,e.z]:e instanceof a.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(n.setPositions(r.flat()),i){t=0xffffff;let e=i.map(e=>e instanceof a.Color?e.toArray():e);n.setColors(e.flat(),w)}return n},[e,d,i,w]);return r.useLayoutEffect(()=>{y.computeLineDistances()},[e,y]),r.useLayoutEffect(()=>{u?b.defines.USE_DASH="":delete b.defines.USE_DASH,b.needsUpdate=!0},[u,b]),r.useEffect(()=>()=>{x.dispose(),b.dispose()},[x]),r.createElement("primitive",(0,n.default)({object:y,ref:p},f),r.createElement("primitive",{object:x,attach:"geometry"}),r.createElement("primitive",(0,n.default)({object:b,attach:"material",color:t,vertexColors:!!i,resolution:[v.width,v.height],linewidth:null!=(g=null!=s?s:l)?g:1,dashed:u,transparent:4===w},f)))});e.s(["Line",0,R],43216)},28523,e=>{"use strict";let t=(0,e.i(56420).default)("pause",[["rect",{x:"14",y:"3",width:"5",height:"18",rx:"1",key:"kaeet6"}],["rect",{x:"5",y:"3",width:"5",height:"18",rx:"1",key:"1wsw3u"}]]);e.s(["Pause",0,t],28523)},21357,e=>{"use strict";let t=(0,e.i(56420).default)("play",[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]]);e.s(["Play",0,t],21357)},85437,(e,t,i)=>{"use strict";e.i(47167),Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"Image",{enumerable:!0,get:function(){return x}});let n=e.r(55682),r=e.r(90809),a=e.r(43476),o=r._(e.r(71645)),s=n._(e.r(74080)),l=n._(e.r(25633)),d=e.r(8927),u=e.r(87690),c=e.r(18556),f=e.r(65856),p=n._(e.r(1948)),m=e.r(18581),h={deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],qualities:[75],path:"/_next/image/",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!1};function g(e,t,i,n,r,a,o){let s=e?.src;e&&e["data-loaded-src"]!==s&&(e["data-loaded-src"]=s,("decode"in e?e.decode():Promise.resolve()).catch(()=>{}).then(()=>{if(e.parentElement&&e.isConnected){if("empty"!==t&&r(!0),i?.current){let t=new Event("load");Object.defineProperty(t,"target",{writable:!1,value:e});let n=!1,r=!1;i.current({...t,nativeEvent:t,currentTarget:e,target:e,isDefaultPrevented:()=>n,isPropagationStopped:()=>r,persist:()=>{},preventDefault:()=>{n=!0,t.preventDefault()},stopPropagation:()=>{r=!0,t.stopPropagation()}})}n?.current&&n.current(e)}}))}function v(e){return o.use?{fetchPriority:e}:{fetchpriority:e}}"u"<typeof window&&(globalThis.__NEXT_IMAGE_IMPORTED=!0);let y="u"<typeof window?o.useEffect:o.useLayoutEffect,b=(0,o.forwardRef)(({src:e,srcSet:t,sizes:i,height:n,width:r,decoding:s,className:l,style:d,fetchPriority:u,placeholder:c,loading:f,unoptimized:p,fill:h,onLoadRef:b,onLoadingCompleteRef:w,setBlurComplete:x,setShowAltText:S,sizesInput:_,onLoad:E,onError:A,...O},z)=>{let P=(0,o.useRef)(!1),C=(0,o.useRef)(null);y(()=>{let{current:e}=P,{current:t}=C;e||null===t||(A&&(t.src=t.src),t.complete&&g(t,c,b,w,x,p,_),P.current=!0)},[e,c,b,w,A,p,_]);let L=(0,m.useMergedRef)(z,C);return(0,a.jsx)("img",{...O,...v(u),loading:f,width:r,height:n,decoding:s,"data-nimg":h?"fill":"1",className:l,style:d,sizes:i,srcSet:t,src:e,ref:L,onLoad:e=>{g(e.currentTarget,c,b,w,x,p,_)},onError:e=>{S(!0),"empty"!==c&&x(!0),A&&A(e)}})});function w({isAppRouter:e,imgAttributes:t}){let i={as:"image",imageSrcSet:t.srcSet,imageSizes:t.sizes,crossOrigin:t.crossOrigin,referrerPolicy:t.referrerPolicy,...v(t.fetchPriority)};return e&&s.default.preload?(s.default.preload(t.src,i),null):(0,a.jsx)(l.default,{children:(0,a.jsx)("link",{rel:"preload",href:t.srcSet?void 0:t.src,...i},"__nimg-"+t.src+t.srcSet+t.sizes)})}let x=(0,o.forwardRef)((e,t)=>{let i=(0,o.useContext)(f.RouterContext),n=(0,o.useContext)(c.ImageConfigContext),r=(0,o.useMemo)(()=>{let e=h||n||u.imageConfigDefault,t=[...e.deviceSizes,...e.imageSizes].sort((e,t)=>e-t),i=e.deviceSizes.sort((e,t)=>e-t),r=e.qualities?.sort((e,t)=>e-t);return{...e,allSizes:t,deviceSizes:i,qualities:r,localPatterns:"u"<typeof window?n?.localPatterns:e.localPatterns}},[n]),{onLoad:s,onLoadingComplete:l}=e,m=(0,o.useRef)(s);(0,o.useEffect)(()=>{m.current=s},[s]);let g=(0,o.useRef)(l);(0,o.useEffect)(()=>{g.current=l},[l]);let[v,y]=(0,o.useState)(!1),[x,S]=(0,o.useState)(!1),{props:_,meta:E}=(0,d.getImgProps)(e,{defaultLoader:p.default,imgConf:r,blurComplete:v,showAltText:x});return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(b,{..._,unoptimized:E.unoptimized,placeholder:E.placeholder,fill:E.fill,onLoadRef:m,onLoadingCompleteRef:g,setBlurComplete:y,setShowAltText:S,sizesInput:e.sizes,ref:t}),E.preload?(0,a.jsx)(w,{isAppRouter:!i,imgAttributes:_}):null]})});("function"==typeof i.default||"object"==typeof i.default&&null!==i.default)&&void 0===i.default.__esModule&&(Object.defineProperty(i.default,"__esModule",{value:!0}),Object.assign(i.default,i),t.exports=i.default)},70965,(e,t,i)=>{"use strict";function n(e,t){let i=e||75;return t?.qualities?.length?t.qualities.reduce((e,t)=>Math.abs(t-i)<Math.abs(e-i)?t:e,t.qualities[0]):i}Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"findClosestQuality",{enumerable:!0,get:function(){return n}})},8927,(e,t,i)=>{"use strict";e.i(47167),Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"getImgProps",{enumerable:!0,get:function(){return d}});let n=e.r(43369),r=e.r(88143),a=e.r(87690),o=["-moz-initial","fill","none","scale-down",void 0];function s(e){return void 0!==e.default}function l(e){return void 0===e?e:"number"==typeof e?Number.isFinite(e)?e:NaN:"string"==typeof e&&/^[0-9]+$/.test(e)?parseInt(e,10):NaN}function d({src:e,sizes:t,unoptimized:i=!1,priority:u=!1,preload:c=!1,loading:f,className:p,quality:m,width:h,height:g,fill:v=!1,style:y,overrideSrc:b,onLoad:w,onLoadingComplete:x,placeholder:S="empty",blurDataURL:_,fetchPriority:E,decoding:A="async",layout:O,objectFit:z,objectPosition:P,lazyBoundary:C,lazyRoot:L,...j},M){var U;let R,B,D,{imgConf:I,showAltText:T,blurComplete:k,defaultLoader:q}=M,V=I||a.imageConfigDefault;if("allSizes"in V)R=V;else{let e=[...V.deviceSizes,...V.imageSizes].sort((e,t)=>e-t),t=V.deviceSizes.sort((e,t)=>e-t),i=V.qualities?.sort((e,t)=>e-t);R={...V,allSizes:e,deviceSizes:t,qualities:i}}if(void 0===q)throw Object.defineProperty(Error("images.loaderFile detected but the file is missing default export.\nRead more: https://nextjs.org/docs/messages/invalid-images-config"),"__NEXT_ERROR_CODE",{value:"E163",enumerable:!1,configurable:!0});let N=j.loader||q;delete j.loader,delete j.srcSet;let H="__next_img_default"in N;if(H){if("custom"===R.loader)throw Object.defineProperty(Error(`Image with src "${e}" is missing "loader" prop.
Read more: https://nextjs.org/docs/messages/next-image-missing-loader`),"__NEXT_ERROR_CODE",{value:"E252",enumerable:!1,configurable:!0})}else{let e=N;N=t=>{let{config:i,...n}=t;return e(n)}}if(O){"fill"===O&&(v=!0);let e={intrinsic:{maxWidth:"100%",height:"auto"},responsive:{width:"100%",height:"auto"}}[O];e&&(y={...y,...e});let i={responsive:"100vw",fill:"100vw"}[O];i&&!t&&(t=i)}let W="",G=l(h),$=l(g),F=!1;if((U=e)&&"object"==typeof U&&(s(U)||void 0!==U.src)){let t=s(e)?e.default:e;if(!t.src)throw Object.defineProperty(Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ${JSON.stringify(t)}`),"__NEXT_ERROR_CODE",{value:"E460",enumerable:!1,configurable:!0});if(!t.height||!t.width)throw Object.defineProperty(Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ${JSON.stringify(t)}`),"__NEXT_ERROR_CODE",{value:"E48",enumerable:!1,configurable:!0});if(B=t.blurWidth,D=t.blurHeight,_=_||t.blurDataURL,W=t.src,F=/\.avif(?:\?|$)/i.test(W),!v)if(G||$){if(G&&!$){let e=G/t.width;$=Math.round(t.height*e)}else if(!G&&$){let e=$/t.height;G=Math.round(t.width*e)}}else G=t.width,$=t.height}F&&"blur"===S&&!_&&(S="empty");let X=!u&&!c&&("lazy"===f||void 0===f);(!(e="string"==typeof e?e:W)||e.startsWith("data:")||e.startsWith("blob:"))&&(i=!0,X=!1),R.unoptimized&&(i=!0),H&&!R.dangerouslyAllowSVG&&e.split("?",1)[0].endsWith(".svg")&&(i=!0);let J=l(m),K=Object.assign(v?{position:"absolute",height:"100%",width:"100%",left:0,top:0,right:0,bottom:0,objectFit:z,objectPosition:P}:{},T?{}:{color:"transparent"},y),Q=k||"empty"===S?null:"blur"===S?`url("data:image/svg+xml;charset=utf-8,${(0,r.getImageBlurSvg)({widthInt:G,heightInt:$,blurWidth:B,blurHeight:D,blurDataURL:_||"",objectFit:K.objectFit})}")`:`url("${S}")`,Y=o.includes(K.objectFit)?"fill"===K.objectFit?"100% 100%":"cover":K.objectFit,Z=Q?{backgroundSize:Y,backgroundPosition:K.objectPosition||"50% 50%",backgroundRepeat:"no-repeat",backgroundImage:Q}:{},ee=function({config:e,src:t,unoptimized:i,width:r,quality:a,sizes:o,loader:s}){if(i){if(t.startsWith("/")&&!t.startsWith("//")){let e=(0,n.getDeploymentId)();if(t.includes("/_next/static/immutable")&&!(0,n.getAssetToken)())e=void 0;else if(e){let i=t.indexOf("?");if(-1!==i){let n=new URLSearchParams(t.slice(i+1));n.get("dpl")||(n.append("dpl",e),t=t.slice(0,i)+"?"+n.toString())}else t+=`?dpl=${e}`}}return{src:t,srcSet:void 0,sizes:void 0}}let{widths:l,kind:d}=function({deviceSizes:e,allSizes:t},i,n){if(n){let i=/(^|\s)(1?\d?\d)vw/g,r=[];for(let e;e=i.exec(n);)r.push(parseInt(e[2]));if(r.length){let i=.01*Math.min(...r);return{widths:t.filter(t=>t>=e[0]*i),kind:"w"}}return{widths:t,kind:"w"}}return"number"!=typeof i?{widths:e,kind:"w"}:{widths:[...new Set([i,2*i].map(e=>t.find(t=>t>=e)||t[t.length-1]))],kind:"x"}}(e,r,o),u=l.length-1;return{sizes:o||"w"!==d?o:"100vw",srcSet:l.map((i,n)=>`${s({config:e,src:t,quality:a,width:i})} ${"w"===d?i:n+1}${d}`).join(", "),src:s({config:e,src:t,quality:a,width:l[u]})}}({config:R,src:e,unoptimized:i,width:G,quality:J,sizes:t,loader:N}),et=X?"lazy":f;return{props:{...j,loading:et,fetchPriority:E,width:G,height:$,decoding:A,className:p,style:{...K,...Z},sizes:ee.sizes,srcSet:ee.srcSet,src:b||ee.src},meta:{unoptimized:i,preload:c||u,placeholder:S,fill:v}}}},25633,(e,t,i)=>{"use strict";e.i(47167),Object.defineProperty(i,"__esModule",{value:!0});var n={default:function(){return h},defaultHead:function(){return c}};for(var r in n)Object.defineProperty(i,r,{enumerable:!0,get:n[r]});let a=e.r(55682),o=e.r(90809),s=e.r(43476),l=o._(e.r(71645)),d=a._(e.r(98879)),u=e.r(42732);function c(){return[(0,s.jsx)("meta",{charSet:"utf-8"},"charset"),(0,s.jsx)("meta",{name:"viewport",content:"width=device-width"},"viewport")]}function f(e,t){return"string"==typeof t||"number"==typeof t?e:t.type===l.default.Fragment?e.concat(l.default.Children.toArray(t.props.children).reduce((e,t)=>"string"==typeof t||"number"==typeof t?e:e.concat(t),[])):e.concat(t)}let p=["name","httpEquiv","charSet","itemProp"];function m(e){let t,i,n,r;return e.reduce(f,[]).reverse().concat(c().reverse()).filter((t=new Set,i=new Set,n=new Set,r={},e=>{let a=!0,o=!1;if(e.key&&"number"!=typeof e.key&&e.key.indexOf("$")>0){o=!0;let i=e.key.slice(e.key.indexOf("$")+1);t.has(i)?a=!1:t.add(i)}switch(e.type){case"title":case"base":i.has(e.type)?a=!1:i.add(e.type);break;case"meta":for(let t=0,i=p.length;t<i;t++){let i=p[t];if(e.props.hasOwnProperty(i))if("charSet"===i)n.has(i)?a=!1:n.add(i);else{let t=e.props[i],n=r[i]||new Set;("name"!==i||!o)&&n.has(t)?a=!1:(n.add(t),r[i]=n)}}}return a})).reverse().map((e,t)=>{let i=e.key||t;return l.default.cloneElement(e,{key:i})})}let h=function({children:e}){let t=(0,l.useContext)(u.HeadManagerContext);return(0,s.jsx)(d.default,{reduceComponentsToState:m,headManager:t,children:e})};("function"==typeof i.default||"object"==typeof i.default&&null!==i.default)&&void 0===i.default.__esModule&&(Object.defineProperty(i.default,"__esModule",{value:!0}),Object.assign(i.default,i),t.exports=i.default)},88143,(e,t,i)=>{"use strict";function n({widthInt:e,heightInt:t,blurWidth:i,blurHeight:r,blurDataURL:a,objectFit:o}){let s=i?40*i:e,l=r?40*r:t,d=s&&l?`viewBox='0 0 ${s} ${l}'`:"";return`%3Csvg xmlns='http://www.w3.org/2000/svg' ${d}%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='${d?"none":"contain"===o?"xMidYMid":"cover"===o?"xMidYMid slice":"none"}' style='filter: url(%23b);' href='${a}'/%3E%3C/svg%3E`}Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"getImageBlurSvg",{enumerable:!0,get:function(){return n}})},18556,(e,t,i)=>{"use strict";e.i(47167),Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"ImageConfigContext",{enumerable:!0,get:function(){return a}});let n=e.r(55682)._(e.r(71645)),r=e.r(87690),a=n.default.createContext(r.imageConfigDefault)},65856,(e,t,i)=>{"use strict";e.i(47167),Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"RouterContext",{enumerable:!0,get:function(){return n}});let n=e.r(55682)._(e.r(71645)).default.createContext(null)},87690,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0});var n={VALID_LOADERS:function(){return a},imageConfigDefault:function(){return o}};for(var r in n)Object.defineProperty(i,r,{enumerable:!0,get:n[r]});let a=["default","imgix","cloudinary","akamai","custom"],o={deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],path:"/_next/image",loader:"default",loaderFile:"",domains:[],disableStaticImages:!1,minimumCacheTTL:14400,formats:["image/webp"],maximumDiskCacheSize:void 0,maximumRedirects:3,maximumResponseBody:5e7,dangerouslyAllowLocalIP:!1,dangerouslyAllowSVG:!1,contentSecurityPolicy:"script-src 'none'; frame-src 'none'; sandbox;",contentDispositionType:"attachment",localPatterns:void 0,remotePatterns:[],qualities:[75],unoptimized:!1,customCacheHandler:!1}},94909,(e,t,i)=>{"use strict";e.i(47167),Object.defineProperty(i,"__esModule",{value:!0});var n={default:function(){return u},getImageProps:function(){return d}};for(var r in n)Object.defineProperty(i,r,{enumerable:!0,get:n[r]});let a=e.r(55682),o=e.r(8927),s=e.r(85437),l=a._(e.r(1948));function d(e){let{props:t}=(0,o.getImgProps)(e,{defaultLoader:l.default,imgConf:{deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],qualities:[75],path:"/_next/image/",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!1}});for(let[e,i]of Object.entries(t))void 0===i&&delete t[e];return{props:t}}let u=s.Image},57688,(e,t,i)=>{t.exports=e.r(94909)},1948,(e,t,i)=>{"use strict";e.i(47167),Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"default",{enumerable:!0,get:function(){return o}});let n=e.r(70965),r=e.r(43369);function a({config:e,src:t,width:i,quality:o}){let s=(0,r.getDeploymentId)();if(t.startsWith("/")&&!t.startsWith("//"))if(t.includes("/_next/static/immutable")&&!(0,r.getAssetToken)())s=void 0;else{let e=t.indexOf("?");if(-1!==e){let i=new URLSearchParams(t.slice(e+1)),n=i.get("dpl");if(n){s=n,i.delete("dpl");let r=i.toString();t=t.slice(0,e)+(r?"?"+r:"")}}}if(t.startsWith("/")&&t.includes("?")&&e.localPatterns?.length===1&&"**"===e.localPatterns[0].pathname&&""===e.localPatterns[0].search)throw Object.defineProperty(Error(`Image with src "${t}" is using a query string which is not configured in images.localPatterns.
Read more: https://nextjs.org/docs/messages/next-image-unconfigured-localpatterns`),"__NEXT_ERROR_CODE",{value:"E871",enumerable:!1,configurable:!0});let l=(0,n.findClosestQuality)(o,e);return`${e.path}?url=${encodeURIComponent(t)}&w=${i}&q=${l}${t.startsWith("/")&&s?`&dpl=${s}`:""}`}a.__next_img_default=!0;let o=a},98879,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"default",{enumerable:!0,get:function(){return s}});let n=e.r(71645),r="u"<typeof window,a=r?()=>{}:n.useLayoutEffect,o=r?()=>{}:n.useEffect;function s(e){let{headManager:t,reduceComponentsToState:i}=e;function s(){if(t&&t.mountedInstances){let e=n.Children.toArray(Array.from(t.mountedInstances).filter(Boolean));t.updateHead(i(e))}}return r&&(t?.mountedInstances?.add(e.children),s()),a(()=>(t?.mountedInstances?.add(e.children),()=>{t?.mountedInstances?.delete(e.children)})),a(()=>(t&&(t._pendingUpdate=s),()=>{t&&(t._pendingUpdate=s)})),o(()=>(t&&t._pendingUpdate&&(t._pendingUpdate(),t._pendingUpdate=null),()=>{t&&t._pendingUpdate&&(t._pendingUpdate(),t._pendingUpdate=null)})),null}},31497,e=>{"use strict";let t=parseInt(e.i(90072).REVISION.replace(/\D+/g,""));e.s(["version",0,t])},68570,e=>{e.q("/_next/static/media/globe-places.2yu6zx3q0egcq.png")},31092,e=>{e.q("/_next/static/media/globe-region-bhutan.0quees1oqw588.png")},6747,e=>{e.q("/_next/static/media/globe-region-france.1n6w06s_pdmhf.png")},38811,e=>{e.q("/_next/static/media/globe-region-georgia.3s1u0s49o0c2r.png")},1640,e=>{e.q("/_next/static/media/globe-region-japan.1sz02s1orzspb.png")},90294,e=>{e.q("/_next/static/media/globe-region-massachusetts.0tkhqhlb0i9ja.png")},26257,e=>{e.q("/_next/static/media/globe-region-switzerland.11mu7n_miwjez.png")},96578,e=>{e.q("/_next/static/media/bhutan-flag.06nzwo24-bd2f.jpg")},33579,e=>{e.q("/_next/static/media/boston-dynamics-wordmark.2gf3neceveuf4.png")},88563,e=>{e.q("/_next/static/media/eth-rsl-mark.0hkn3soajg9yl.png")},28266,e=>{e.q("/_next/static/media/gelephu-mindfulness-city-wordmark.3c3xp0khx6u78.png")},98846,e=>{e.q("/_next/static/media/georgia-tech-arl-mark.3fkuhkv3xeym_.png")},8433,e=>{e.q("/_next/static/media/georgia-tech-europe-mark.1fnfa8hkc7l-l.png")},38960,e=>{e.q("/_next/static/media/mit-lincoln-laboratory-wordmark.10_gmebbgg7n-.png")},89616,e=>{e.q("/_next/static/media/tohoku-siel-mark.1ivi8wa_mgymm.png")},77891,e=>{e.q("/_next/static/media/space-research-contact-sheet.3-eho9gz74rb-.png")},72805,e=>{"use strict";var t=e.i(43476),i=e.i(932);e.s(["PortfolioVideo",0,function(e){let n,r,a,o,s,l,d,u,c,f,p,m,h=(0,i.c)(29);h[0]!==e?({allowAudio:l,ref:s,onPlay:r,onVolumeChange:a,onLoadedMetadata:n,...o}=e,h[0]=e,h[1]=n,h[2]=r,h[3]=a,h[4]=o,h[5]=s,h[6]=l):(n=h[1],r=h[2],a=h[3],o=h[4],s=h[5],l=h[6]);let g=void 0!==l&&l;h[7]!==g?(d=e=>{if(g)return;let t=e.currentTarget;t.muted||(t.muted=!0),0!==t.volume&&(t.volume=0)},h[7]=g,h[8]=d):d=h[8];let v=d;h[9]!==g||h[10]!==s?(u=e=>{if(e&&!g&&(e.defaultMuted=!0,e.muted=!0,e.volume=0),"function"==typeof s)return s(e);s&&(s.current=e)},h[9]=g,h[10]=s,h[11]=u):u=h[11];let y=!g||o.muted,b=g?"presentation":"silent";return h[12]!==v||h[13]!==r?(c=e=>{v(e),r?.(e)},h[12]=v,h[13]=r,h[14]=c):c=h[14],h[15]!==v||h[16]!==a?(f=e=>{v(e),a?.(e)},h[15]=v,h[16]=a,h[17]=f):f=h[17],h[18]!==v||h[19]!==n?(p=e=>{v(e),n?.(e)},h[18]=v,h[19]=n,h[20]=p):p=h[20],h[21]!==o||h[22]!==u||h[23]!==y||h[24]!==b||h[25]!==c||h[26]!==f||h[27]!==p?(m=(0,t.jsx)("video",{...o,ref:u,muted:y,"data-audio-policy":b,onPlay:c,onVolumeChange:f,onLoadedMetadata:p}),h[21]=o,h[22]=u,h[23]=y,h[24]=b,h[25]=c,h[26]=f,h[27]=p,h[28]=m):m=h[28],m}])}]);