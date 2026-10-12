/* A very small texture displacement on the original shirt/hair; the face is locked. */
(() => {
 const figure=document.querySelector('.poster-visual'),img=figure?.querySelector('img');if(!img||document.body.dataset.poster!=='tide')return;
 const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion:reduce)'),canvas=document.createElement('canvas');canvas.className='poster-breeze';canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)return;
 const vertex='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
 const fragment=`precision highp float;uniform sampler2D photo;uniform vec2 size,rendered,offset;uniform float time;
 float windowMask(vec2 p,vec2 center,vec2 radius){float d=length((p-center)/radius);return 1.-smoothstep(.62,1.,d);}
 void main(){vec2 pixel=vec2(gl_FragCoord.x,size.y-gl_FragCoord.y);vec2 uv=(pixel-offset)/rendered;
 vec3 original=texture2D(photo,uv).rgb;
 float shirt=windowMask(uv,vec2(.555,.66),vec2(.165,.28))*smoothstep(.02,.11,original.b-original.r)*smoothstep(.008,.09,original.b-original.g);
 float hair=windowMask(uv,vec2(.48,.125),vec2(.075,.058))*(1.-smoothstep(.16,.195,uv.y));
 float face=step(.40,uv.x)*(1.-step(.57,uv.x))*step(.195,uv.y)*(1.-step(.405,uv.y));
 vec2 movement=vec2(sin(time*1.3+uv.y*30.)*.0018+sin(time*.63+uv.x*16.)*.0007,cos(time*.9+uv.x*24.)*.0006)*shirt;
 movement+=vec2(sin(time*1.1+uv.y*80.)*.00085,cos(time*.8+uv.x*60.)*.00025)*hair;
 gl_FragColor=vec4(texture2D(photo,uv+movement*(1.-face)).rgb,1.);}`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null;}
 const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return;
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
 const uniforms=Object.fromEntries(['size','rendered','offset','time'].map(n=>[n,gl.getUniformLocation(program,n)]));let ready=false,visible=true,frame=0,last=0,elapsed=0,lost=false;
 function allowed(){return ready&&!lost&&visible&&!document.hidden&&!reduced.matches&&root.dataset.motion==='on'&&!root.classList.contains('portal-active');}
 function draw(){if(!ready)return;gl.uniform1f(uniforms.time,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.phase=elapsed.toFixed(3);}
 function resize(){if(!ready)return;const dpr=Math.min(devicePixelRatio||1,1.2),w=figure.clientWidth,h=figure.clientHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl.viewport(0,0,canvas.width,canvas.height);const scale=Math.max(canvas.width/img.naturalWidth,canvas.height/img.naturalHeight),rw=img.naturalWidth*scale,rh=img.naturalHeight*scale;const pos=getComputedStyle(img).objectPosition.split(' ').map(x=>parseFloat(x)/100);gl.uniform2f(uniforms.size,canvas.width,canvas.height);gl.uniform2f(uniforms.rendered,rw,rh);gl.uniform2f(uniforms.offset,(canvas.width-rw)*pos[0],(canvas.height-rh)*pos[1]);draw();}
 function tick(now){frame=0;if(!allowed())return;if(now-last>=40){elapsed+=Math.min(.07,(now-(last||now))/1000);last=now;draw();}frame=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;const show=ready&&!lost&&root.dataset.motion==='on'&&!reduced.matches;figure.classList.toggle('breeze-ready',show);canvas.hidden=!show;if(allowed())frame=requestAnimationFrame(tick);}
 function load(){if(!img.naturalWidth||ready)return;try{const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);figure.append(canvas);ready=true;resize();sync();}catch{canvas.remove();figure.classList.remove('breeze-ready');}}
 img.addEventListener('load',load);new ResizeObserver(resize).observe(figure);new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();}).observe(figure);new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion','class']});document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));window.addEventListener('pageshow',sync);canvas.addEventListener('webglcontextlost',()=>{lost=true;sync();});load();
})();
