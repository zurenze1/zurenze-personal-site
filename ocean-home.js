/* Scroll-driven sea to underwater scene. Original photo is a separate, unmodified image. */
(() => {
  const section = document.querySelector('.ocean-journey');
  if (!section) return;
  const root = document.documentElement;
  const canvas = section.querySelector('.ocean-render');
  const surface = section.querySelector('.ocean-surface-copy');
  const deep = section.querySelector('.ocean-deep-copy');
  const diveButton = section.querySelector('[data-ocean-dive]');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  let texturesReady=false,textureCount=0;
  const textureSizes=[[1672,941],[1672,941]];
  let program, uniforms, frame = 0, last = 0, clock = 0, progress = 0, visible = true, lost = false;
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = (a, b, value) => { const x = clamp((value - a) / (b - a)); return x * x * (3 - 2 * x); };
  const motion = () => !reduced.matches && root.dataset.motion !== 'off';
  const allowed = () => program && texturesReady && !lost && visible && !document.hidden && motion() && !root.classList.contains('ocean-entry-active');
  if (gl) {
    const vertex = 'attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}';
    const fragment = `precision highp float;
      uniform vec2 resolution,seaSize,deepSize;uniform float time,dive;
      uniform sampler2D seaPhoto,deepPhoto;
      vec2 cover(vec2 uv,vec2 imageSize,float focus){
        float screenRatio=resolution.x/resolution.y,imageRatio=imageSize.x/imageSize.y;
        vec2 scale=vec2(min(1.,screenRatio/imageRatio),min(1.,imageRatio/screenRatio));
        return (uv-.5)*scale+vec2(focus,.5);
      }
      vec3 above(vec2 uv){
        float ratio=resolution.x/resolution.y;
        float focus=mix(.72,.5,smoothstep(.55,1.4,ratio));
        vec2 v=uv;float water=1.-smoothstep(.43,.48,uv.y);
        v.x+=sin(uv.y*28.+uv.x*9.+time*.63)*.0016*water;
        v.y+=sin(uv.x*19.-uv.y*7.+time*.72)*.0026*water;
        v=(v-vec2(.5,.45))/(1.+dive*.07)+vec2(.5,.45);
        v.y-=dive*.035;
        vec3 c=texture2D(seaPhoto,cover(v,seaSize,focus)).rgb;
        float glint=pow(max(0.,sin(uv.x*56.+uv.y*12.+time)),24.);
        c+=vec3(.018,.024,.021)*glint*water;
        return c;
      }
      vec3 below(vec2 uv){
        vec2 v=(uv-.5)/(1.025+dive*.025)+.5;
        float surface=smoothstep(.45,1.,uv.y);
        v.x+=sin(uv.y*12.+time*.3)*.0014*surface;
        v.y+=sin(uv.x*18.+time*.25)*.0018*surface;
        vec3 c=texture2D(deepPhoto,cover(v,deepSize,.5)).rgb;
        float shaft=sin(uv.x*8.+uv.y*2.+time*.16)*.5+.5;
        c+=vec3(.006,.022,.020)*shaft*uv.y;
        return c;
      }
      void main(){
        vec2 uv=gl_FragCoord.xy/resolution;
        float line=mix(-.12,1.14,smoothstep(.18,.61,dive));
        float wobble=sin(uv.x*9.+time*.7)*.008+sin(uv.x*22.-time*.5)*.003;
        float sub=1.-smoothstep(line-.025,line+.025,uv.y+wobble);
        vec3 c=mix(above(uv),below(uv),sub);
        float edge=exp(-abs(uv.y+wobble-line)*150.)*step(.02,dive)*step(dive,.62);
        c+=vec3(.07,.12,.11)*edge;
        gl_FragColor=vec4(c,1.);
      }`;
    const shader = (type, source) => {
      const result = gl.createShader(type);
      gl.shaderSource(result, source); gl.compileShader(result);
      if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) { gl.deleteShader(result); return null; }
      return result;
    };
    const vs = shader(gl.VERTEX_SHADER, vertex), fs = shader(gl.FRAGMENT_SHADER, fragment);
    if (vs && fs) {
      program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) program = null;
    }
    if (program) {
      gl.useProgram(program);
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      uniforms = Object.fromEntries(['resolution','time','dive','seaSize','deepSize','seaPhoto','deepPhoto'].map(name => [name, gl.getUniformLocation(program,name)]));
      ['assets/ocean/sunset-sea-v2.webp','assets/ocean/underwater-world-v2.webp'].forEach((url,index)=>{
        const image=new Image();
        image.onload=()=>{
          if(lost)return;
          const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0+index);gl.bindTexture(gl.TEXTURE_2D,texture);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
          textureSizes[index]=[image.naturalWidth,image.naturalHeight];
          gl.uniform1i(index===0?uniforms.seaPhoto:uniforms.deepPhoto,index);
          textureCount++;
          if(textureCount===2){texturesReady=true;canvas.classList.add('is-texture-ready');sync();resize();}
        };
        image.onerror=()=>{program=null;canvas.hidden=true;section.removeAttribute('data-ocean-ready');section.dataset.renderer='css-fallback';sync();};
        image.src=url;
      });
    }
  }
  function draw() {
    if (!program || !texturesReady || lost) return;
    gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);
    gl.uniform2fv(uniforms.seaSize,textureSizes[0]);gl.uniform2fv(uniforms.deepSize,textureSizes[1]);
    gl.uniform1f(uniforms.time,clock); gl.uniform1f(uniforms.dive,progress);
    gl.drawArrays(gl.TRIANGLES,0,6);
    canvas.dataset.renderTime=clock.toFixed(2);
  }
  function layout() {
    const enabled = motion() && Boolean(program) && !lost;
    const rect = section.getBoundingClientRect();
    const range = Math.max(1,section.offsetHeight-innerHeight);
    progress = enabled ? clamp(-rect.top/range) : 0;
    const fade = 1-smooth(.08,.34,progress), reveal = smooth(.43,.69,progress);
    const mobile = innerWidth<=700;
    section.style.setProperty('--dive',progress.toFixed(4));
    section.style.setProperty('--surface-opacity',fade.toFixed(4));
    section.style.setProperty('--deep-opacity',reveal.toFixed(4));
    section.style.setProperty('--copy-y',`${-progress*100}px`);
    section.style.setProperty('--portrait-x',`${progress*(mobile?-innerWidth*.17:-innerWidth*.055)}px`);
    section.style.setProperty('--portrait-y',`${progress*(mobile?innerHeight*.035:-15)+(mobile&&innerHeight>740?reveal*40:0)}px`);
    section.style.setProperty('--portrait-rotate',`${3-progress*6}deg`);
    section.style.setProperty('--portrait-scale',String(mobile?1-reveal*.12:1+progress*.14));
    section.dataset.deep=String(progress>.42);
    section.dataset.progress=progress.toFixed(3);
    diveButton.firstChild.textContent=enabled ? (progress>.65?'继续向下，看我走过的路 ':'向下滚动，潜入我的世界 ') : '向下探索，看看我走过的路 ';
    surface.inert = fade<.15;
    deep.inert = reveal<.2;
    draw();
  }
  function resize() {
    const ratio = Math.min(devicePixelRatio||1,innerWidth<700?1:1.15);
    if (program&&!lost) {
      canvas.width=Math.round(canvas.clientWidth*ratio); canvas.height=Math.round(canvas.clientHeight*ratio);
      gl.viewport(0,0,canvas.width,canvas.height);
    }
    layout();
  }
  function tick(now) {
    frame=0;if(!allowed())return;
    if(now-last>=33){clock+=Math.min(.08,(now-(last||now))/1000);last=now;draw();}
    frame=requestAnimationFrame(tick);
  }
  function sync() {
    section.dataset.static=String(!motion() || !program || lost);
    cancelAnimationFrame(frame);frame=0;last=0;
    layout();
    if(allowed())frame=requestAnimationFrame(tick);
  }
  if(program) { section.dataset.oceanReady='true'; canvas.dataset.renderer='webgl'; }
  else { canvas.hidden=true; section.dataset.renderer='css-fallback'; }
  let scrollFrame=0;
  window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;layout();});},{passive:true});
  new ResizeObserver(resize).observe(section.querySelector('.ocean-sticky'));
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{threshold:0}).observe(section);
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion','class']});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  document.querySelector('[data-ocean-dive]')?.addEventListener('click',()=>{
    const top=section.getBoundingClientRect().top+scrollY;
    const target=motion()&&program&&progress<.65?top+(section.offsetHeight-innerHeight)*.74:document.querySelector('#films').getBoundingClientRect().top+scrollY;
    window.scrollTo({top:target,behavior:motion()?'smooth':'instant'});
  });
  document.querySelector('[data-ocean-replay]')?.addEventListener('click',()=>{
    window.scrollTo({top:0,behavior:motion()?'smooth':'instant'});
    section.querySelector('#hero-heading').focus({preventScroll:true});
  });
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',sync);
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();lost=true;canvas.hidden=true;section.removeAttribute('data-ocean-ready');
    section.dataset.static='true';section.dataset.renderer='css-fallback';cancelAnimationFrame(frame);frame=0;layout();
  });
  sync();resize();
})();
