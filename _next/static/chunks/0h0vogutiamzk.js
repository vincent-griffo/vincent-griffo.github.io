(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,43216,e=>{"use strict";let t,i;var n=e.i(31067),r=e.i(71645),a=e.i(90072),o=e.i(48546),s=a,l=a;let c=new l.Box3,d=new l.Vector3;class f extends l.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new l.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new l.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let i=new l.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new l.InterleavedBufferAttribute(i,3,0)),this.setAttribute("instanceEnd",new l.InterleavedBufferAttribute(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));let n=new l.InstancedInterleavedBuffer(i,2*t,1);return this.setAttribute("instanceColorStart",new l.InterleavedBufferAttribute(n,t,0)),this.setAttribute("instanceColorEnd",new l.InterleavedBufferAttribute(n,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new l.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new l.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),c.setFromBufferAttribute(t),this.boundingBox.union(c))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new l.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let i=this.boundingSphere.center;this.boundingBox.getCenter(i);let n=0;for(let r=0,a=e.count;r<a;r++)d.fromBufferAttribute(e,r),n=Math.max(n,i.distanceToSquared(d)),d.fromBufferAttribute(t,r),n=Math.max(n,i.distanceToSquared(d));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var u=a,h=e.i(8560),p=e.i(31497);class m extends u.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:u.UniformsUtils.clone(u.UniformsUtils.merge([h.UniformsLib.common,h.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new u.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
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
					#include <${p.version>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let v=p.version>=125?"uv1":"uv2",y=new s.Vector4,g=new s.Vector3,S=new s.Vector3,w=new s.Vector4,b=new s.Vector4,x=new s.Vector4,_=new s.Vector3,E=new s.Matrix4,A=new s.Line3,L=new s.Vector3,M=new s.Box3,U=new s.Sphere,z=new s.Vector4;function j(e,t,n){return z.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),z.multiplyScalar(1/z.w),z.x=i/n.width,z.y=i/n.height,z.applyMatrix4(e.projectionMatrixInverse),z.multiplyScalar(1/z.w),Math.abs(Math.max(z.x,z.y))}class C extends s.Mesh{constructor(e=new f,t=new m({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let e=0,r=0,a=t.count;e<a;e++,r+=2)g.fromBufferAttribute(t,e),S.fromBufferAttribute(i,e),n[r]=0===r?0:n[r-1],n[r+1]=n[r]+g.distanceTo(S);let r=new s.InstancedInterleavedBuffer(n,2,1);return e.setAttribute("instanceDistanceStart",new s.InterleavedBufferAttribute(r,1,0)),e.setAttribute("instanceDistanceEnd",new s.InterleavedBufferAttribute(r,1,1)),this}raycast(e,n){let r,a,o=this.material.worldUnits,l=e.camera;null!==l||o||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let c=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let d=this.matrixWorld,f=this.geometry,u=this.material;if(i=u.linewidth+c,null===f.boundingSphere&&f.computeBoundingSphere(),U.copy(f.boundingSphere).applyMatrix4(d),o)r=.5*i;else{let e=Math.max(l.near,U.distanceToPoint(t.origin));r=j(l,e,u.resolution)}if(U.radius+=r,!1!==t.intersectsSphere(U)){if(null===f.boundingBox&&f.computeBoundingBox(),M.copy(f.boundingBox).applyMatrix4(d),o)a=.5*i;else{let e=Math.max(l.near,M.distanceToPoint(t.origin));a=j(l,e,u.resolution)}M.expandByScalar(a),!1!==t.intersectsBox(M)&&(o?function(e,n){let r=e.matrixWorld,a=e.geometry,o=a.attributes.instanceStart,l=a.attributes.instanceEnd,c=Math.min(a.instanceCount,o.count);for(let a=0;a<c;a++){A.start.fromBufferAttribute(o,a),A.end.fromBufferAttribute(l,a),A.applyMatrix4(r);let c=new s.Vector3,d=new s.Vector3;t.distanceSqToSegment(A.start,A.end,d,c),d.distanceTo(c)<.5*i&&n.push({point:d,pointOnLine:c,distance:t.origin.distanceTo(d),object:e,face:null,faceIndex:a,uv:null,[v]:null})}}(this,n):function(e,n,r){let a=n.projectionMatrix,o=e.material.resolution,l=e.matrixWorld,c=e.geometry,d=c.attributes.instanceStart,f=c.attributes.instanceEnd,u=Math.min(c.instanceCount,d.count),h=-n.near;t.at(1,x),x.w=1,x.applyMatrix4(n.matrixWorldInverse),x.applyMatrix4(a),x.multiplyScalar(1/x.w),x.x*=o.x/2,x.y*=o.y/2,x.z=0,_.copy(x),E.multiplyMatrices(n.matrixWorldInverse,l);for(let n=0;n<u;n++){if(w.fromBufferAttribute(d,n),b.fromBufferAttribute(f,n),w.w=1,b.w=1,w.applyMatrix4(E),b.applyMatrix4(E),w.z>h&&b.z>h)continue;if(w.z>h){let e=w.z-b.z,t=(w.z-h)/e;w.lerp(b,t)}else if(b.z>h){let e=b.z-w.z,t=(b.z-h)/e;b.lerp(w,t)}w.applyMatrix4(a),b.applyMatrix4(a),w.multiplyScalar(1/w.w),b.multiplyScalar(1/b.w),w.x*=o.x/2,w.y*=o.y/2,b.x*=o.x/2,b.y*=o.y/2,A.start.copy(w),A.start.z=0,A.end.copy(b),A.end.z=0;let c=A.closestPointToPointParameter(_,!0);A.at(c,L);let u=s.MathUtils.lerp(w.z,b.z,c),p=u>=-1&&u<=1,m=_.distanceTo(L)<.5*i;if(p&&m){A.start.fromBufferAttribute(d,n),A.end.fromBufferAttribute(f,n),A.start.applyMatrix4(l),A.end.applyMatrix4(l);let i=new s.Vector3,a=new s.Vector3;t.distanceSqToSegment(A.start,A.end,a,i),r.push({point:a,pointOnLine:i,distance:t.origin.distanceTo(a),object:e,face:null,faceIndex:n,uv:null,[v]:null})}}}(this,l,n))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(y),this.material.uniforms.resolution.value.set(y.z,y.w))}}class B extends f{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,i=new Float32Array(2*t);for(let n=0;n<t;n+=3)i[2*n]=e[n],i[2*n+1]=e[n+1],i[2*n+2]=e[n+2],i[2*n+3]=e[n+3],i[2*n+4]=e[n+4],i[2*n+5]=e[n+5];return super.setPositions(i),this}setColors(e,t=3){let i=e.length-t,n=new Float32Array(2*i);if(3===t)for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];else for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5],n[2*r+6]=e[r+6],n[2*r+7]=e[r+7];return super.setColors(n,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class P extends C{constructor(e=new B,t=new m({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let O=r.forwardRef(function({points:e,color:t=0xffffff,vertexColors:i,linewidth:s,lineWidth:l,segments:c,dashed:d,...u},h){var p,v;let y=(0,o.useThree)(e=>e.size),g=r.useMemo(()=>c?new C:new P,[c]),[S]=r.useState(()=>new m),w=(null==i||null==(p=i[0])?void 0:p.length)===4?4:3,b=r.useMemo(()=>{let n=c?new f:new B,r=e.map(e=>{let t=Array.isArray(e);return e instanceof a.Vector3||e instanceof a.Vector4?[e.x,e.y,e.z]:e instanceof a.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(n.setPositions(r.flat()),i){t=0xffffff;let e=i.map(e=>e instanceof a.Color?e.toArray():e);n.setColors(e.flat(),w)}return n},[e,c,i,w]);return r.useLayoutEffect(()=>{g.computeLineDistances()},[e,g]),r.useLayoutEffect(()=>{d?S.defines.USE_DASH="":delete S.defines.USE_DASH,S.needsUpdate=!0},[d,S]),r.useEffect(()=>()=>{b.dispose(),S.dispose()},[b]),r.createElement("primitive",(0,n.default)({object:g,ref:h},u),r.createElement("primitive",{object:b,attach:"geometry"}),r.createElement("primitive",(0,n.default)({object:S,attach:"material",color:t,vertexColors:!!i,resolution:[y.width,y.height],linewidth:null!=(v=null!=s?s:l)?v:1,dashed:d,transparent:4===w},u)))});e.s(["Line",0,O],43216)},28523,e=>{"use strict";let t=(0,e.i(56420).default)("pause",[["rect",{x:"14",y:"3",width:"5",height:"18",rx:"1",key:"kaeet6"}],["rect",{x:"5",y:"3",width:"5",height:"18",rx:"1",key:"1wsw3u"}]]);e.s(["Pause",0,t],28523)},21357,e=>{"use strict";let t=(0,e.i(56420).default)("play",[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]]);e.s(["Play",0,t],21357)},31497,e=>{"use strict";let t=parseInt(e.i(90072).REVISION.replace(/\D+/g,""));e.s(["version",0,t])},6069,e=>{"use strict";var t=e.i(43476),i=e.i(932),n=e.i(71645),r=e.i(75056),a=e.i(94800),o=e.i(48546),s=e.i(30297),l=e.i(43216),c=e.i(90072),d=e.i(23490),f=e.i(85110),u=e.i(658),h=e.i(28523),p=e.i(21357),m=e.i(95925),v=e.i(7314);let y=[.381,.3302,.265573388958103],g=[.56,.34],S=[.63,.055],w=[.7,.4];function b(e,t,i){let n,r=(n=Math.max(0,Math.min(1,i)))*n*n*(10+n*(-15+6*n));return e.map((e,i)=>e+(t[i]-e)*r)}function x(e){return e<4?{target:b(g,S,e/4),phase:"Approach",attached:!1}:e<5?{target:S,phase:"Pickup",attached:!0}:e<9?{target:b(S,w,(e-5)/4),phase:"Lift",attached:!0}:e<11?{target:w,phase:"Hold",attached:!0}:e<15?{target:b(w,S,(e-11)/4),phase:"Lower",attached:!0}:e<16?{target:S,phase:"Release",attached:!1}:{target:b(S,g,(e-16)/4),phase:"Return",attached:!1}}function _(e){e.traverse(e=>{if(e instanceof c.Mesh)for(let t of(e.geometry.dispose(),Array.isArray(e.material)?e.material:[e.material]))t.dispose()})}function E(e){let r,s,l,d,f,u,h,p=(0,i.c)(13),{robot:m,clockRef:v,report:g}=e,w=(0,n.useRef)(null),b=(0,n.useRef)(-1),_=(0,o.useThree)(A);return p[0]!==_?(r=()=>{let e=window.setInterval(()=>_(),33.333333333333336);return()=>window.clearInterval(e)},s=[_],p[0]=_,p[1]=r,p[2]=s):(r=p[1],s=p[2]),(0,n.useEffect)(r,s),p[3]!==v||p[4]!==g||p[5]!==m?(l=(e,t)=>{let i=v.current;i.playing&&(i.current=(i.current+Math.min(t,.1))%20);let n=x(i.current);m.setJointValues(function(e){let[t,i,n]=y,r=e[0]-n,a=e[1]-.125,o=(r*r+a*a-t*t-i*i)/(2*t*i);if(Math.abs(o)>1)throw Error("Arm display target is outside source link reach.");let s=-Math.acos(o),l=Math.atan2(a,r)-Math.atan2(i*Math.sin(s),t+i*Math.cos(s));return{Shoulder:l,Elbow:s,"Wrist Pitch":l+s,"Wrist Roll":0}}(n.target)),m.updateWorldMatrix(!0,!0);let r=m.links["End Effector"].getWorldPosition(new c.Vector3),a=new c.Vector3(n.target[0],n.target[1],0),o=r.distanceTo(a);w.current&&w.current.position.copy(n.attached?r:new c.Vector3(S[0],S[1],0)),Math.abs(i.current-b.current)>.15&&(g(i.current,n.phase,o),b.current=i.current)},p[3]=v,p[4]=g,p[5]=m,p[6]=l):l=p[6],(0,a.useFrame)(l),p[7]===Symbol.for("react.memo_cache_sentinel")?(d=[-Math.PI/2,0,0],p[7]=d):d=p[7],p[8]!==m?(f=(0,t.jsx)("group",{rotation:d,children:(0,t.jsx)("primitive",{object:m})}),p[8]=m,p[9]=f):f=p[9],p[10]===Symbol.for("react.memo_cache_sentinel")?(u=(0,t.jsxs)("mesh",{ref:w,castShadow:!0,children:[(0,t.jsx)("icosahedronGeometry",{args:[.049,1]}),(0,t.jsx)("meshStandardMaterial",{color:"#9a958a",roughness:1})]}),p[10]=u):u=p[10],p[11]!==f?(h=(0,t.jsxs)(t.Fragment,{children:[f,u]}),p[11]=f,p[12]=h):h=p[12],h}function A(e){return e.invalidate}function L(e){let n,r,a,o,c,d,f,u,h,p,m,v,y,g=(0,i.c)(17),{robot:S,clockRef:w,report:b}=e;g[0]===Symbol.for("react.memo_cache_sentinel")?(n=Array.from({length:35},U),g[0]=n):n=g[0];let x=n;return g[1]===Symbol.for("react.memo_cache_sentinel")?(r=(0,t.jsx)("color",{attach:"background",args:["#182a30"]}),a=(0,t.jsx)("hemisphereLight",{args:["#e5eef5","#61594b",2.1]}),o=[1,2,1.5],g[1]=r,g[2]=a,g[3]=o):(r=g[1],a=g[2],o=g[3]),g[4]===Symbol.for("react.memo_cache_sentinel")?(c=(0,t.jsx)("directionalLight",{position:o,intensity:3,color:"#fff1d5",castShadow:!0,"shadow-mapSize":[1024,1024],"shadow-camera-left":-1,"shadow-camera-right":1.5,"shadow-camera-top":1.5,"shadow-camera-bottom":-.5,"shadow-normalBias":.002}),d=(0,t.jsx)("directionalLight",{position:[-1,1,-1],intensity:1.5,color:"#acccdc"}),f=[.42,-.021,0],g[4]=c,g[5]=d,g[6]=f):(c=g[4],d=g[5],f=g[6]),g[7]===Symbol.for("react.memo_cache_sentinel")?(h=(0,t.jsxs)("mesh",{position:f,receiveShadow:!0,children:[(0,t.jsx)("boxGeometry",{args:[1.4,.035,.8]}),(0,t.jsx)("meshStandardMaterial",{color:"#6e716b",roughness:1})]}),p=[[.9,.03,-.28],[.19,.025,.26],[-.17,.034,-.19],[.85,.022,.27]].map(M),u=(0,t.jsx)(l.Line,{points:x,color:"#d0b273",lineWidth:1.1,dashed:!0,dashSize:.012,gapSize:.013}),g[7]=u,g[8]=h,g[9]=p):(u=g[7],h=g[8],p=g[9]),g[10]!==w||g[11]!==b||g[12]!==S?(m=(0,t.jsx)(E,{robot:S,clockRef:w,report:b}),g[10]=w,g[11]=b,g[12]=S,g[13]=m):m=g[13],g[14]===Symbol.for("react.memo_cache_sentinel")?(v=(0,t.jsx)(s.OrbitControls,{makeDefault:!0,target:[.42,.23,0],minDistance:.6,maxDistance:2.8,maxPolarAngle:Math.PI/2.05,enablePan:!1}),g[14]=v):v=g[14],g[15]!==m?(y=(0,t.jsxs)(t.Fragment,{children:[r,a,c,d,h,p,u,m,v]}),g[15]=m,g[16]=y):y=g[16],y}function M(e,i){return(0,t.jsxs)("mesh",{position:e,rotation:[i,.3,.5*i],castShadow:!0,children:[(0,t.jsx)("icosahedronGeometry",{args:[e[1],0]}),(0,t.jsx)("meshStandardMaterial",{color:"#84847d",roughness:1})]},i)}function U(e,t){let i=b(S,w,t/34);return[i[0],i[1],0]}function z(e){return{...e,time:0,phase:"Approach"}}function j(){return!window.matchMedia("(prefers-reduced-motion: reduce)").matches}e.s(["default",0,function(){let e,a,o,s,l,y,g,S,w,b,E,A,M,U,C,B,P,O,D,R=(0,i.c)(36),{robot:T,error:I}=function(){let[e,t]=(0,n.useState)(null),[i,r]=(0,n.useState)(!1);return(0,n.useEffect)(()=>{let e=!1,i=null,n=!1,a=new AbortController;return async function(){try{let r=await fetch("/models/robonav/arm/arm.urdf",{signal:a.signal});if(!r.ok)throw Error("Arm URDF unavailable");let o=await r.text(),s=new c.LoadingManager,l=!1,h=new Promise(e=>{s.onLoad=e,s.onError=()=>{l=!0}}),p=new u.default(s);if(p.workingPath="/models/robonav/arm/",p.parseCollision=!1,p.loadMeshCb=(e,t,i,n)=>{new d.GLTFLoader(t).setMeshoptDecoder(f.MeshoptDecoder).load(e,e=>n(e.scene),void 0,e=>n(new c.Group,e instanceof Error?e:Error("Arm mesh unavailable")))},i=p.parse(o),await h,n=!0,l)throw Error("Arm source mesh unavailable");for(let e of["Shoulder","Elbow","Wrist Pitch","Wrist Roll"]){if(!i.joints[e]||.9>i.joints[e].axis.lengthSq())throw Error("Invalid source arm joint");i.joints[e].ignoreLimits=!0}if(i.traverse(e=>{e instanceof c.Mesh&&(e.castShadow=!0,e.receiveShadow=!0)}),e)return void _(i);t(i)}catch(t){n=!0,i&&_(i),e||(console.error("RoboNav arm:",t),r(!0))}}(),()=>{e=!0,a.abort(),i&&n&&_(i)}},[]),{robot:e,error:i}}(),[V,N]=(0,n.useState)(j);R[0]!==V?(e={current:0,playing:V},R[0]=V,R[1]=e):e=R[1];let H=(0,n.useRef)(e);R[2]===Symbol.for("react.memo_cache_sentinel")?(a={time:0,phase:"Approach",error:0},R[2]=a):a=R[2];let[W,G]=(0,n.useState)(a);R[3]===Symbol.for("react.memo_cache_sentinel")?(o=()=>{let e=window.matchMedia("(prefers-reduced-motion: reduce)"),t=()=>{e.matches&&(H.current.playing=!1,N(!1))};return e.addEventListener("change",t),()=>e.removeEventListener("change",t)},s=[],R[3]=o,R[4]=s):(o=R[3],s=R[4]),(0,n.useEffect)(o,s),R[5]===Symbol.for("react.memo_cache_sentinel")?(l=(e,t,i)=>G({time:e,phase:t,error:i}),R[5]=l):l=R[5];let k=l;R[6]===Symbol.for("react.memo_cache_sentinel")?(y=function(){H.current.playing=!H.current.playing,N(H.current.playing)},R[6]=y):y=R[6];let F=y,q=!!T,J=W.phase,K=W.error;R[7]!==I||R[8]!==T?(g=(0,t.jsx)("div",{className:v.default.armStage,children:T?(0,t.jsx)(r.Canvas,{shadows:!0,frameloop:"demand",dpr:[1,1.7],camera:{position:[1.23,.7,1.1],fov:37,near:.01,far:20},children:(0,t.jsx)(L,{robot:T,clockRef:H,report:k})}):(0,t.jsx)("div",{className:v.default.armLoading,role:"status",children:I?"The arm model could not load. The original analysis figure is shown below.":"Loading the source arm model..."})}),R[7]=I,R[8]=T,R[9]=g):g=R[9];let X=V?"Pause arm motion":"Play arm motion";R[10]!==V?(S=V?(0,t.jsx)(h.Pause,{size:15}):(0,t.jsx)(p.Play,{size:15}),R[10]=V,R[11]=S):S=R[11];let $=V?"Pause":"Play";return R[12]!==X||R[13]!==S||R[14]!==$?(w=(0,t.jsxs)("button",{type:"button",onClick:F,"aria-label":X,children:[S,$]}),R[12]=X,R[13]=S,R[14]=$,R[15]=w):w=R[15],R[16]===Symbol.for("react.memo_cache_sentinel")?(b=()=>{H.current.current=0,G(z)},R[16]=b):b=R[16],R[17]===Symbol.for("react.memo_cache_sentinel")?(E=(0,t.jsx)("button",{type:"button",onClick:b,"aria-label":"Restart arm motion",children:(0,t.jsx)(m.RotateCcw,{size:15})}),A=(0,t.jsx)("span",{className:v.default.visuallyHidden,children:"Pickup sequence position"}),R[17]=E,R[18]=A):(E=R[17],A=R[18]),R[19]===Symbol.for("react.memo_cache_sentinel")?(M=e=>{let t=Number(e.target.value);H.current.current=t,H.current.playing=!1,N(!1),G(e=>({...e,time:t,phase:x(t).phase}))},R[19]=M):M=R[19],R[20]!==W.time?(U=(0,t.jsxs)("label",{children:[A,(0,t.jsx)("input",{"aria-label":"Pickup sequence position",type:"range",min:"0",max:"19.999",step:".01",value:W.time,onChange:M})]}),C=Math.floor(W.time).toString().padStart(2,"0"),R[20]=W.time,R[21]=U,R[22]=C):(U=R[21],C=R[22]),R[23]!==C?(B=(0,t.jsxs)("output",{children:[C," / 20 s"]}),R[23]=C,R[24]=B):B=R[24],R[25]!==w||R[26]!==U||R[27]!==B?(P=(0,t.jsxs)("div",{className:v.default.armControls,children:[w,E,U,B]}),R[25]=w,R[26]=U,R[27]=B,R[28]=P):P=R[28],R[29]===Symbol.for("react.memo_cache_sentinel")?(O=(0,t.jsx)("p",{className:v.default.demoNote,children:"Animated URDF, not a replay of the torque study. Grip is assumed; contact forces are not simulated."}),R[29]=O):O=R[29],R[30]!==W.error||R[31]!==W.phase||R[32]!==P||R[33]!==q||R[34]!==g?(D=(0,t.jsxs)("div",{className:v.default.armViewer,"data-robonav-arm":!0,"data-ready":q,"data-phase":J,"data-fk-error":K,children:[g,P,O]}),R[30]=W.error,R[31]=W.phase,R[32]=P,R[33]=q,R[34]=g,R[35]=D):D=R[35],D}])},14329,function(e){e.n(e.i(6069))}]);