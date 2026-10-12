/* A short, skippable journey from portrait to ocean. No external media needed. */
(() => {
  if (!document.body.classList.contains('index')) return;
  const root = document.documentElement;
  const replay = document.querySelector('.arrival-replay');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const allowed = () => root.dataset.motion === 'on' && !reduced.matches;
  const stage = document.createElement('dialog');
  stage.className = 'portal-entry';
  stage.setAttribute('aria-label', '祖仁泽的个人网站，穿梭入场');
  const themes=['sport','sea','sea','military','work','military','travel','travel'];
  const photos = ['球场时光','海边时光','向海而行','两年军旅','工作之间','训练之外','旅途片刻','山野远行'];
  stage.innerHTML = `<canvas class="portal-cosmos" aria-hidden="true"></canvas><div class="portal-vignette" aria-hidden="true"></div><div class="portal-top"><span>祖仁泽 <small>／ 个人世界</small></span><button type="button" class="portal-skip">跳过入场 ↗</button></div><div class="portal-depth" aria-hidden="true"><div class="portal-ring ring-one"></div><div class="portal-ring ring-two"></div><div class="portal-ring ring-three"></div>${photos.map((name,i)=>`<div class="portal-photo" data-scene="${themes[i]}"><img src="assets/portal/portrait-${i+1}.webp" alt=""><span>${name}</span></div>`).join('')}</div><div class="portal-arrival" aria-hidden="true"></div><div class="portal-bottom"><span class="portal-caption">每一程，都算数。</span><span class="portal-counter" aria-hidden="true">READY / 05</span><div class="portal-progress" aria-hidden="true"></div></div>`;
  document.body.append(stage);
  const canvas = stage.querySelector('canvas');
  const gl = canvas.getContext('webgl', {alpha:false, antialias:false, powerPreference:'low-power'});
  let program, uniform, frame = 0, start = 0, timer, returnFocus, attempt = 0;
  const cards = [...stage.querySelectorAll('.portal-photo')];
  let travelling = false, lastFrame = 0;
  if (gl) {
    const vertex = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fragment = `precision highp float;
      uniform vec2 size;uniform float clock;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      float cloud(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.04+4.3;a*=.5;}return s;}
      void main(){
        vec2 uv=(gl_FragCoord.xy-.5*size)/size.y;
        float accelerate=smoothstep(.7,3.4,clock);
        uv-=vec2(sin(clock*.5)*.04,cos(clock*.45)*.025);
        float r=length(uv), angle=atan(uv.y,uv.x);
        float depth=.42/max(r,.035);
        float travel=clock*.28+accelerate*3.1;
        float twist=angle+depth*.32+clock*.26+accelerate*.9;
        vec2 cylinder=vec2(cos(twist),sin(twist))*2.2;
        float n=cloud(cylinder+vec2(depth-travel,depth*.53-travel*.6));
        float detail=cloud(cylinder*2.5+vec2(depth*2.-travel*2.,-travel));
        float fold=sin(twist*3.+depth*1.8-travel*2.+n*6.);
        float density=smoothstep(.23,.82,n+fold*.09);
        vec3 col=mix(vec3(.008,.018,.04),vec3(.08,.22,.31),density);
        float gold=smoothstep(.50,.83,n)*smoothstep(-.4,.9,sin(twist+1.2));
        col+=vec3(.55,.31,.09)*gold*(.35+detail);
        col+=vec3(.15,.29,.4)*pow(max(0.,detail),3.);
        float rings=pow(max(0.,sin(depth*8.-travel*8.+fold*.15)),65.);
        col+=vec3(.2,.43,.54)*rings*.15*smoothstep(.04,.2,r);
        float spokes=pow(max(0.,sin(angle*82.+sin(angle*9.)*6.)),95.);
        float streak=pow(max(0.,sin(depth*1.5-travel*5.+angle*7.)),18.);
        col+=vec3(.4,.67,.78)*spokes*streak*accelerate*1.15;
        col*=smoothstep(.025,.15,r)*(1.-smoothstep(.4,1.3,r)*.65);
        col+=vec3(.18,.28,.36)*exp(-r*22.)*smoothstep(3.,4.2,clock);
        gl_FragColor=vec4(col,1.);
      }`;
    function shader(type, text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null;}
    const vs=shader(gl.VERTEX_SHADER,vertex), fs=shader(gl.FRAGMENT_SHADER,fragment);
    if(vs&&fs){program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))program=null;}
    if(program){gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);uniform={size:gl.getUniformLocation(program,'size'),clock:gl.getUniformLocation(program,'clock')};}
  }
  function resize(){if(!program)return;const dpr=Math.min(devicePixelRatio||1,1.25);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;gl.viewport(0,0,canvas.width,canvas.height);}
  function draw(now){
    if(!stage.open)return;
    if(now-lastFrame<30){frame=requestAnimationFrame(draw);return;}lastFrame=now;
    const elapsed=travelling?(now-start)/1000:0;
    if(program){gl.uniform2f(uniform.size,canvas.width,canvas.height);gl.uniform1f(uniform.clock,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);}
    const mobile=innerWidth<650, rx=Math.min(innerWidth*(mobile?.37:.34),530), ry=Math.min(innerHeight*(mobile?.32:.30),290);
    cards.forEach((card,i)=>{
      const p=Math.min(1,Math.max(0,(elapsed-.65-i*.075)/3.7));
      const angle=i*Math.PI/4-Math.PI/2+p*p*5.5;
      const radius=Math.pow(1-p,1.25), x=Math.cos(angle)*rx*radius, y=Math.sin(angle)*ry*radius;
      card.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) rotate(${Math.sin(angle)*9+p*35}deg) scale(${1-p*.94})`;
      card.style.opacity=String(p>.91?(1-p)/.09:1);
      card.style.zIndex=String(10+Math.round(Math.sin(angle)*3));
    });
    stage.querySelector('.portal-counter').textContent=travelling?`${Math.min(5,Math.floor(elapsed)+1).toString().padStart(2,'0')} / 05`:'READY / 05';
    frame=requestAnimationFrame(draw);
  }
  function finish(){
    attempt++;clearTimeout(timer);cancelAnimationFrame(frame);
    window.ZRZAudio?.endEntry();
    travelling=false;stage.dataset.phase='closed';
    root.classList.remove('portal-active','arrival-pending','is-arriving');
    if(stage.open){stage.close();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
    stage.classList.remove('is-travelling');
  }
  function begin(){
    if(!stage.open||travelling)return;
    travelling=true;stage.dataset.phase='playing';start=performance.now();
    stage.classList.add('is-travelling');timer=setTimeout(finish,5400);
  }
  function play(isReplay=false){
    finish();if(!allowed())return;
    returnFocus=isReplay?replay:document.querySelector('#hero-heading');
    root.classList.add('portal-active');stage.showModal();resize();
    begin();frame=requestAnimationFrame(draw);
    if(window.ZRZAudio?.canAutoStart())window.ZRZAudio.startEntry();
  }
  stage.querySelector('.portal-skip').addEventListener('click',finish);
  stage.addEventListener('cancel',event=>{event.preventDefault();finish();});
  replay?.addEventListener('click',()=>{window.scrollTo({top:0,behavior:'instant'});play(true);});
  function sync(){if(replay)replay.hidden=!allowed();if(!allowed())finish();}
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion']});reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});window.addEventListener('pagehide',finish);window.addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',finish);
  sync();root.classList.remove('arrival-pending');
  if(!location.hash&&scrollY<80&&!new URLSearchParams(location.search).has('preview'))play();
})();
