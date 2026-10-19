(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,43216,e=>{"use strict";let t,i;var o=e.i(31067),n=e.i(71645),r=e.i(90072),a=e.i(48546),s=r,l=r;let d=new l.Box3,c=new l.Vector3;class f extends l.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new l.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new l.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let i=new l.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new l.InterleavedBufferAttribute(i,3,0)),this.setAttribute("instanceEnd",new l.InterleavedBufferAttribute(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));let o=new l.InstancedInterleavedBuffer(i,2*t,1);return this.setAttribute("instanceColorStart",new l.InterleavedBufferAttribute(o,t,0)),this.setAttribute("instanceColorEnd",new l.InterleavedBufferAttribute(o,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new l.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new l.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),d.setFromBufferAttribute(t),this.boundingBox.union(d))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new l.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let i=this.boundingSphere.center;this.boundingBox.getCenter(i);let o=0;for(let n=0,r=e.count;n<r;n++)c.fromBufferAttribute(e,n),o=Math.max(o,i.distanceToSquared(c)),c.fromBufferAttribute(t,n),o=Math.max(o,i.distanceToSquared(c));this.boundingSphere.radius=Math.sqrt(o),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var u=r,m=e.i(8560),p=e.i(31497);class h extends u.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:u.UniformsUtils.clone(u.UniformsUtils.merge([m.UniformsLib.common,m.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new u.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
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
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let v=p.version>=125?"uv1":"uv2",g=new s.Vector4,b=new s.Vector3,y=new s.Vector3,w=new s.Vector4,S=new s.Vector4,x=new s.Vector4,_=new s.Vector3,E=new s.Matrix4,z=new s.Line3,A=new s.Vector3,L=new s.Box3,U=new s.Sphere,B=new s.Vector4;function M(e,t,o){return B.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),B.multiplyScalar(1/B.w),B.x=i/o.width,B.y=i/o.height,B.applyMatrix4(e.projectionMatrixInverse),B.multiplyScalar(1/B.w),Math.abs(Math.max(B.x,B.y))}class O extends s.Mesh{constructor(e=new f,t=new h({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,o=new Float32Array(2*t.count);for(let e=0,n=0,r=t.count;e<r;e++,n+=2)b.fromBufferAttribute(t,e),y.fromBufferAttribute(i,e),o[n]=0===n?0:o[n-1],o[n+1]=o[n]+b.distanceTo(y);let n=new s.InstancedInterleavedBuffer(o,2,1);return e.setAttribute("instanceDistanceStart",new s.InterleavedBufferAttribute(n,1,0)),e.setAttribute("instanceDistanceEnd",new s.InterleavedBufferAttribute(n,1,1)),this}raycast(e,o){let n,r,a=this.material.worldUnits,l=e.camera;null!==l||a||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let d=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let c=this.matrixWorld,f=this.geometry,u=this.material;if(i=u.linewidth+d,null===f.boundingSphere&&f.computeBoundingSphere(),U.copy(f.boundingSphere).applyMatrix4(c),a)n=.5*i;else{let e=Math.max(l.near,U.distanceToPoint(t.origin));n=M(l,e,u.resolution)}if(U.radius+=n,!1!==t.intersectsSphere(U)){if(null===f.boundingBox&&f.computeBoundingBox(),L.copy(f.boundingBox).applyMatrix4(c),a)r=.5*i;else{let e=Math.max(l.near,L.distanceToPoint(t.origin));r=M(l,e,u.resolution)}L.expandByScalar(r),!1!==t.intersectsBox(L)&&(a?function(e,o){let n=e.matrixWorld,r=e.geometry,a=r.attributes.instanceStart,l=r.attributes.instanceEnd,d=Math.min(r.instanceCount,a.count);for(let r=0;r<d;r++){z.start.fromBufferAttribute(a,r),z.end.fromBufferAttribute(l,r),z.applyMatrix4(n);let d=new s.Vector3,c=new s.Vector3;t.distanceSqToSegment(z.start,z.end,c,d),c.distanceTo(d)<.5*i&&o.push({point:c,pointOnLine:d,distance:t.origin.distanceTo(c),object:e,face:null,faceIndex:r,uv:null,[v]:null})}}(this,o):function(e,o,n){let r=o.projectionMatrix,a=e.material.resolution,l=e.matrixWorld,d=e.geometry,c=d.attributes.instanceStart,f=d.attributes.instanceEnd,u=Math.min(d.instanceCount,c.count),m=-o.near;t.at(1,x),x.w=1,x.applyMatrix4(o.matrixWorldInverse),x.applyMatrix4(r),x.multiplyScalar(1/x.w),x.x*=a.x/2,x.y*=a.y/2,x.z=0,_.copy(x),E.multiplyMatrices(o.matrixWorldInverse,l);for(let o=0;o<u;o++){if(w.fromBufferAttribute(c,o),S.fromBufferAttribute(f,o),w.w=1,S.w=1,w.applyMatrix4(E),S.applyMatrix4(E),w.z>m&&S.z>m)continue;if(w.z>m){let e=w.z-S.z,t=(w.z-m)/e;w.lerp(S,t)}else if(S.z>m){let e=S.z-w.z,t=(S.z-m)/e;S.lerp(w,t)}w.applyMatrix4(r),S.applyMatrix4(r),w.multiplyScalar(1/w.w),S.multiplyScalar(1/S.w),w.x*=a.x/2,w.y*=a.y/2,S.x*=a.x/2,S.y*=a.y/2,z.start.copy(w),z.start.z=0,z.end.copy(S),z.end.z=0;let d=z.closestPointToPointParameter(_,!0);z.at(d,A);let u=s.MathUtils.lerp(w.z,S.z,d),p=u>=-1&&u<=1,h=_.distanceTo(A)<.5*i;if(p&&h){z.start.fromBufferAttribute(c,o),z.end.fromBufferAttribute(f,o),z.start.applyMatrix4(l),z.end.applyMatrix4(l);let i=new s.Vector3,r=new s.Vector3;t.distanceSqToSegment(z.start,z.end,r,i),n.push({point:r,pointOnLine:i,distance:t.origin.distanceTo(r),object:e,face:null,faceIndex:o,uv:null,[v]:null})}}}(this,l,o))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(g),this.material.uniforms.resolution.value.set(g.z,g.w))}}class C extends f{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,i=new Float32Array(2*t);for(let o=0;o<t;o+=3)i[2*o]=e[o],i[2*o+1]=e[o+1],i[2*o+2]=e[o+2],i[2*o+3]=e[o+3],i[2*o+4]=e[o+4],i[2*o+5]=e[o+5];return super.setPositions(i),this}setColors(e,t=3){let i=e.length-t,o=new Float32Array(2*i);if(3===t)for(let n=0;n<i;n+=t)o[2*n]=e[n],o[2*n+1]=e[n+1],o[2*n+2]=e[n+2],o[2*n+3]=e[n+3],o[2*n+4]=e[n+4],o[2*n+5]=e[n+5];else for(let n=0;n<i;n+=t)o[2*n]=e[n],o[2*n+1]=e[n+1],o[2*n+2]=e[n+2],o[2*n+3]=e[n+3],o[2*n+4]=e[n+4],o[2*n+5]=e[n+5],o[2*n+6]=e[n+6],o[2*n+7]=e[n+7];return super.setColors(o,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class j extends O{constructor(e=new C,t=new h({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let D=n.forwardRef(function({points:e,color:t=0xffffff,vertexColors:i,linewidth:s,lineWidth:l,segments:d,dashed:c,...u},m){var p,v;let g=(0,a.useThree)(e=>e.size),b=n.useMemo(()=>d?new O:new j,[d]),[y]=n.useState(()=>new h),w=(null==i||null==(p=i[0])?void 0:p.length)===4?4:3,S=n.useMemo(()=>{let o=d?new f:new C,n=e.map(e=>{let t=Array.isArray(e);return e instanceof r.Vector3||e instanceof r.Vector4?[e.x,e.y,e.z]:e instanceof r.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(o.setPositions(n.flat()),i){t=0xffffff;let e=i.map(e=>e instanceof r.Color?e.toArray():e);o.setColors(e.flat(),w)}return o},[e,d,i,w]);return n.useLayoutEffect(()=>{b.computeLineDistances()},[e,b]),n.useLayoutEffect(()=>{c?y.defines.USE_DASH="":delete y.defines.USE_DASH,y.needsUpdate=!0},[c,y]),n.useEffect(()=>()=>{S.dispose(),y.dispose()},[S]),n.createElement("primitive",(0,o.default)({object:b,ref:m},u),n.createElement("primitive",{object:S,attach:"geometry"}),n.createElement("primitive",(0,o.default)({object:y,attach:"material",color:t,vertexColors:!!i,resolution:[g.width,g.height],linewidth:null!=(v=null!=s?s:l)?v:1,dashed:c,transparent:4===w},u)))});e.s(["Line",0,D],43216)},28523,e=>{"use strict";let t=(0,e.i(56420).default)("pause",[["rect",{x:"14",y:"3",width:"5",height:"18",rx:"1",key:"kaeet6"}],["rect",{x:"5",y:"3",width:"5",height:"18",rx:"1",key:"1wsw3u"}]]);e.s(["Pause",0,t],28523)},21357,e=>{"use strict";let t=(0,e.i(56420).default)("play",[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]]);e.s(["Play",0,t],21357)},31497,e=>{"use strict";let t=parseInt(e.i(90072).REVISION.replace(/\D+/g,""));e.s(["version",0,t])},21442,e=>{e.v(e=>Promise.resolve().then(()=>e(32009)))},31712,e=>{e.v(t=>Promise.all(["static/chunks/2ndmh_n2xjs4e.js"].map(t=>e.l(t))).then(()=>t(658)))},52155,e=>{e.q("/_next/static/media/globe-places.lossless.1sv0lys-6yc7-.webp")},24454,e=>{e.q("/_next/static/media/globe-region-france.lossless.1c5f6dq17z3hu.webp")},12832,e=>{e.q("/_next/static/media/globe-region-georgia.lossless.28lzk_y70nr2_.webp")},23567,e=>{e.q("/_next/static/media/globe-region-japan.lossless.1ys03_6hv77p6.webp")},26324,e=>{e.q("/_next/static/media/globe-region-massachusetts.lossless.0xjd-3650r-kx.webp")},25252,e=>{e.q("/_next/static/media/globe-region-switzerland.lossless.13abxt9bpwr6e.webp")},33579,e=>{e.q("/_next/static/media/boston-dynamics-wordmark.2gf3neceveuf4.png")},88563,e=>{e.q("/_next/static/media/eth-rsl-mark.0hkn3soajg9yl.png")},98846,e=>{e.q("/_next/static/media/georgia-tech-arl-mark.3fkuhkv3xeym_.png")},8433,e=>{e.q("/_next/static/media/georgia-tech-europe-mark.1fnfa8hkc7l-l.png")},38960,e=>{e.q("/_next/static/media/mit-lincoln-laboratory-wordmark.10_gmebbgg7n-.png")},89616,e=>{e.q("/_next/static/media/tohoku-siel-mark.1ivi8wa_mgymm.png")},77891,e=>{e.q("/_next/static/media/space-research-contact-sheet.3-eho9gz74rb-.png")},72805,84601,e=>{"use strict";var t=e.i(43476),i=e.i(932),o=e.i(71645);let n=e.i(16390).default;function r(e,t=!1){if(!e||t)return;let i=e.search(/[?#]/),o=i<0?e:e.slice(0,i),a=i<0?"":e.slice(i),s=n[o];return s?{...s,src:s.src+a}:void 0}function a(e){return(0,o.isValidElement)(e)&&"source"===e.type}e.s(["optimizedVideo",0,r],84601),e.s(["PortfolioVideo",0,function(e){let n,s,l,d,c,f,u,m,p,h,v,g,b,y,w,S,x,_,E,z,A,L=(0,i.c)(53);L[0]!==e?({allowAudio:p,ref:u,src:m,children:n,poster:c,preload:h,onPlay:l,onVolumeChange:d,onLoadedMetadata:s,...f}=e,L[0]=e,L[1]=n,L[2]=s,L[3]=l,L[4]=d,L[5]=c,L[6]=f,L[7]=u,L[8]=m,L[9]=p,L[10]=h):(n=L[1],s=L[2],l=L[3],d=L[4],c=L[5],f=L[6],u=L[7],m=L[8],p=L[9],h=L[10]);let U=void 0!==p&&p,B=void 0===h?"metadata":h,M=(0,o.useRef)(null),O="string"==typeof m?m:void 0;L[11]!==U||L[12]!==O?(v=r(O,U),L[11]=U,L[12]=O,L[13]=v):v=L[13];let C=v;if(L[14]!==U||L[15]!==n){let e;L[17]!==U?(e=e=>{if(!(0,o.isValidElement)(e)||"source"!==e.type)return e;let t=r(e.props.src,U);return t?(0,o.cloneElement)(e,{src:t.src,type:"video/mp4"}):e},L[17]=U,L[18]=e):e=L[18],g=o.Children.map(n,e),L[14]=U,L[15]=n,L[16]=g}else g=L[16];let j=g;if(L[19]!==U||L[20]!==n){let e=o.Children.toArray(n).find(a);b=(0,o.isValidElement)(e)?r(e.props.src,U)?.poster:void 0,L[19]=U,L[20]=n,L[21]=b}else b=L[21];let D=b;L[22]!==U||L[23]!==u?(y=e=>{if(M.current=e,e&&!U&&(e.defaultMuted=!0,e.muted=!0,e.volume=0),"function"==typeof u)return u(e);u&&(u.current=e)},L[22]=U,L[23]=u,L[24]=y):y=L[24];let P=y;L[25]!==B?(w=()=>{let e=M.current;if(!e||"none"===B)return;let t=()=>{e.preload="metadata"};if("u"<typeof IntersectionObserver)return void t();let i=new IntersectionObserver(e=>{let[o]=e;o.isIntersecting&&(t(),i.disconnect())},{rootMargin:"600px 0px"});return i.observe(e),()=>i.disconnect()},L[25]=B,L[26]=w):w=L[26],L[27]!==n||L[28]!==B||L[29]!==m?(S=[B,m,n],L[27]=n,L[28]=B,L[29]=m,L[30]=S):S=L[30],(0,o.useEffect)(w,S),L[31]!==U?(x=e=>{if(U)return;let t=e.currentTarget;t.muted||(t.muted=!0),0!==t.volume&&(t.volume=0)},L[31]=U,L[32]=x):x=L[32];let I=x,T=C?.src??m,V=c??C?.poster??D,R=!U||f.muted,k=U?"presentation":"silent";return L[33]!==I||L[34]!==l?(_=e=>{I(e),l?.(e)},L[33]=I,L[34]=l,L[35]=_):_=L[35],L[36]!==I||L[37]!==d?(E=e=>{I(e),d?.(e)},L[36]=I,L[37]=d,L[38]=E):E=L[38],L[39]!==I||L[40]!==s?(z=e=>{I(e),s?.(e)},L[39]=I,L[40]=s,L[41]=z):z=L[41],L[42]!==f||L[43]!==P||L[44]!==j||L[45]!==T||L[46]!==V||L[47]!==R||L[48]!==k||L[49]!==_||L[50]!==E||L[51]!==z?(A=(0,t.jsx)("video",{...f,src:T,poster:V,preload:"none",ref:P,muted:R,"data-audio-policy":k,onPlay:_,onVolumeChange:E,onLoadedMetadata:z,children:j}),L[42]=f,L[43]=P,L[44]=j,L[45]=T,L[46]=V,L[47]=R,L[48]=k,L[49]=_,L[50]=E,L[51]=z,L[52]=A):A=L[52],A}],72805)},16390,(e,t,i)=>{t.exports={"/projects/multimodal-mini/carpet-locomotion.mov":{src:"/media/optimized-video/multimodal-mini-carpet-locomotion-0c0242818f.mp4",poster:"/media/optimized-video/multimodal-mini-carpet-locomotion-0c0242818f-first.webp",silent:!0,sourceSha256:"0c0242818f12b1729a45b273eb1f903883611347e5f55ed24b49b2aede31472a"},"/projects/multimodal-mini/gaits/outdoor-alternating.gif":{src:"/media/optimized-video/multimodal-mini-gaits-outdoor-alternating-8f049f3518-loop.mp4",poster:"/media/optimized-video/multimodal-mini-gaits-outdoor-alternating-8f049f3518-first.webp",silent:!0,sourceSha256:"8f049f35188ae2edca42a67978be34158fd1c03c95c86c878b586e93333cc5ce"},"/projects/multimodal-mini/gaits/outdoor-fast-walk.gif":{src:"/media/optimized-video/multimodal-mini-gaits-outdoor-fast-walk-9cdeb201ef-loop.mp4",poster:"/media/optimized-video/multimodal-mini-gaits-outdoor-fast-walk-9cdeb201ef-first.webp",silent:!0,sourceSha256:"9cdeb201ef79b1a3150e7c514669fd2472667f499ac1d50aff711539d696506d"},"/projects/multimodal-mini/gaits/outdoor-long-step.gif":{src:"/media/optimized-video/multimodal-mini-gaits-outdoor-long-step-5ece467c5d-loop.mp4",poster:"/media/optimized-video/multimodal-mini-gaits-outdoor-long-step-5ece467c5d-first.webp",silent:!0,sourceSha256:"5ece467c5d2cef2110c50f53d1e28348d5331733e3bf78eef9ad0ef87d77ef53"},"/projects/multimodal-mini/gaits/outdoor-return.gif":{src:"/media/optimized-video/multimodal-mini-gaits-outdoor-return-ae181ed15f-loop.mp4",poster:"/media/optimized-video/multimodal-mini-gaits-outdoor-return-ae181ed15f-first.webp",silent:!0,sourceSha256:"ae181ed15f16f91bf19599c6ef32d6ba2a46f42fb6838e892df62b793b18bf40"},"/projects/multimodal-mini/gaits/outdoor-reverse.gif":{src:"/media/optimized-video/multimodal-mini-gaits-outdoor-reverse-41724351ff-loop.mp4",poster:"/media/optimized-video/multimodal-mini-gaits-outdoor-reverse-41724351ff-first.webp",silent:!0,sourceSha256:"41724351ffb13273c146b047dd34292f090c27244dfc7bc970065ca4796218f9"},"/projects/multimodal-mini/gaits/outdoor-rolling.gif":{src:"/media/optimized-video/multimodal-mini-gaits-outdoor-rolling-aa9ea949da-loop.mp4",poster:"/media/optimized-video/multimodal-mini-gaits-outdoor-rolling-aa9ea949da-first.webp",silent:!0,sourceSha256:"aa9ea949daf6eb488d62a2e789fdfcf2cea69ebd41d627c64782966b3be27b04"},"/projects/multimodal-mini/gaits/outdoor-short-step.gif":{src:"/media/optimized-video/multimodal-mini-gaits-outdoor-short-step-f91069c31e-loop.mp4",poster:"/media/optimized-video/multimodal-mini-gaits-outdoor-short-step-f91069c31e-first.webp",silent:!0,sourceSha256:"f91069c31e70696e936136d5a24d8c5936f7cc11e44f77062058606c3cd9d6ec"},"/projects/multimodal-mini/gaits/outdoor-turn.gif":{src:"/media/optimized-video/multimodal-mini-gaits-outdoor-turn-b5333c1c5a-loop.mp4",poster:"/media/optimized-video/multimodal-mini-gaits-outdoor-turn-b5333c1c5a-first.webp",silent:!0,sourceSha256:"b5333c1c5afddb03796ed7fe0021b21126a76c182ef291f4fe2044b2f9a1289a"},"/projects/multimodal-mini/gaits/outdoor-walk-to-roll.gif":{src:"/media/optimized-video/multimodal-mini-gaits-outdoor-walk-to-roll-f194d30994-loop.mp4",poster:"/media/optimized-video/multimodal-mini-gaits-outdoor-walk-to-roll-f194d30994-first.webp",silent:!0,sourceSha256:"f194d30994d820996a87ccc692a619630a8907f2e8da95e5f8f40c447ef6a2a1"},"/projects/multimodal-mini/impedance-controller.mov":{src:"/media/optimized-video/multimodal-mini-impedance-controller-c584fccd52.mp4",poster:"/media/optimized-video/multimodal-mini-impedance-controller-c584fccd52-first.webp",silent:!0,sourceSha256:"c584fccd5262d73a02593ef1aea9eabc0d269aea3496369a6789f819ab998038"},"/projects/multimodal-mini/lab-floor-locomotion.mov":{src:"/media/optimized-video/multimodal-mini-lab-floor-locomotion-af3e61dd99.mp4",poster:"/media/optimized-video/multimodal-mini-lab-floor-locomotion-af3e61dd99-first.webp",silent:!0,sourceSha256:"af3e61dd9984d999592774b6d85238fbf2ac4e1dea1b50c3494ace37f66fa99f"},"/projects/multimodal-mini/research-demo-web.mp4":{src:"/projects/multimodal-mini/research-demo-web.mp4",poster:"/media/optimized-video/multimodal-mini-research-demo-web-b78a062b26-first.webp",silent:!0,sourceSha256:"b78a062b2601590a5a26d1e11f50325a0fd94c212ffd91524c35aa13aaeab19d"},"/projects/multimodal-mini/single-leg-articulation.mov":{src:"/media/optimized-video/multimodal-mini-single-leg-articulation-dfdab6ac1f.mp4",poster:"/media/optimized-video/multimodal-mini-single-leg-articulation-dfdab6ac1f-first.webp",silent:!0,sourceSha256:"dfdab6ac1f2c767570d5de450f551977c1f5ee4ed748659dfab14b3a7f194916"}}}]);