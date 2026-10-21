/* Independent living backgrounds. Foreground photos and page geometry never move with the water. */
(() => {
  if (!document.body.classList.contains('ocean-home')) return;
  const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const fragment=`precision highp float;
    uniform vec2 size,imageSize;uniform vec4 grip;uniform sampler2D flowPhoto;uniform float liveFlow;uniform float time,under;uniform sampler2D photo;
    vec2 cover(vec2 uv){
      float ratio=size.x/size.y,ir=imageSize.x/imageSize.y;
      vec2 s=vec2(min(1.,ratio/ir),min(1.,ir/ratio));
      float focus=mix(.72,.5,smoothstep(.6,1.4,ratio));
      return (uv-.5)*s+vec2(focus,.5);
    }
    float wave(vec2 p){
      return sin(p.x*16.+p.y*9.-time*.95)*.46
        +sin(p.x*29.-p.y*16.+time*1.25)*.27
        +sin(p.x*57.+p.y*21.-time*1.7)*.13
        +sin(p.x*89.-p.y*32.+time*2.)*.06;
    }
    vec3 sea(vec2 uv){
      vec2 tex=cover(uv);float water=1.-smoothstep(.44,.48,tex.y);
      float near=pow(clamp((.48-tex.y)/.48,0.,1.),1.15);
      float n=wave(vec2(tex.x,tex.y*1.6));
      vec2 v=tex;
      v.x+=sin(tex.y*32.+tex.x*12.-time*.82)*(.003+near*.009)*water;
      v.y+=n*(.003+near*.021)*water;
      vec2 delta=(uv-grip.xy)*vec2(1.,size.y/size.x);
      float contact=grip.z*exp(-dot(delta,delta)/.018);
      vec2 pull=grip.xy-uv;
      float twist=contact*grip.w*1.5,cs=cos(twist),sn=sin(twist);
      vec2 rotated=mat2(cs,-sn,sn,cs)*pull-pull;
      v+=(rotated*vec2(.4,.6)+pull*contact*.22)*water;
      v.y+=sin(time*3.2+uv.x*25.)*.012*contact*water;
      vec3 c=texture2D(photo,v).rgb;
      if(liveFlow>.5){
        vec2 f=vec2(uv.x,clamp(v.y/.44,.01,.99));
        vec3 real=texture2D(flowPhoto,f).rgb;
        float blend=1.-smoothstep(.405,.455,tex.y);
        c=mix(c,real,blend*.65);
      }
      float crest=pow(max(0.,n*.65+.28),5.);
      float reflection=exp(-pow((tex.x-.75)/(.05+near*.22),2.));
      float glint=crest*reflection*(.5+near)*water;
      c+=vec3(.34,.25,.13)*glint;
      c*=1.+n*water*near*.09;
      return c;
    }
    vec3 deep(vec2 uv){
      vec2 tex=cover(uv);float roof=smoothstep(.62,1.,tex.y);
      float n=wave(tex*vec2(1.,1.3));
      vec2 v=tex+vec2(sin(tex.y*34.-time*.75)*.009,n*.013)*roof;
      vec3 c=texture2D(photo,v).rgb;
      // Open blue water, a bright cyan roof, and slightly warm transmitted sunlight.
      c=mix(c,c*vec3(.87,1.03,1.09),.55);
      float warm=smoothstep(.08,.4,c.r-c.b),lum=dot(c,vec3(.2126,.7152,.0722));
      c=mix(c,vec3(lum*.86,lum,lum*1.04),warm*.57);
      c+=vec3(.006,.018,.024)*(1.-roof);
      float depth=1.-uv.y;
      float rayX=(uv.x-.76+depth*.29)/(depth+.27);
      float sway=sin(time*.38+depth*1.4)*.035;
      float rays=0.;
      for(int i=0;i<6;i++){
        float fi=float(i),center=(fi-2.5)*.19+sin(time*.27+fi*1.8)*.028;
        float width=.035+.018*sin(time*.39+fi);
        float beam=exp(-pow((rayX-center-sway)/width,2.));
        float pulse=.6+.4*sin(time*.62+fi*2.3+depth*2.);
        rays+=beam*pulse;
      }
      float fade=smoothstep(0.,.07,depth)*exp(-depth*1.75);
      c+=vec3(.12,.19,.19)*rays*fade*.65;
      float caustic=pow(max(0.,sin(tex.x*63.+tex.y*27.+time*1.3)
        *sin(tex.x*39.-tex.y*36.-time*.94)),6.);
      c+=vec3(.045,.12,.13)*caustic*roof;
      float sparkle=pow(max(0.,n*.65+.29),7.);
      c+=vec3(.13,.16,.14)*sparkle*roof;
      return c;
    }
    void main(){vec2 uv=gl_FragCoord.xy/size;gl_FragColor=vec4(under>.5?deep(uv):sea(uv),1.);}`;
  function create(canvas,mode){
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
    let program=null,ready=false,active=true,visible=false,frame=0,last=0,clock=0,lost=false;
    let uniforms={},imageSize=[1672,941],gripState=[0,0,0,0],flowTexture=null;
    const flow=mode==='surface'?document.createElement('video'):null;
    if(flow){flow.muted=true;flow.loop=true;flow.playsInline=true;flow.preload='auto';flow.src='assets/ocean/sea-flow-reference-preview.mp4';flow.className='ocean-flow-source';flow.hidden=true;document.body.append(flow);}
    const moving=()=>!reduced.matches&&root.dataset.motion!=='off';
    const running=()=>ready&&active&&visible&&!lost&&!document.hidden&&moving();
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s;}
    if(gl){
      const vs=shader(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'),fs=shader(gl.FRAGMENT_SHADER,fragment);
      if(vs&&fs){program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))program=null;}
      if(program){
        gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
        const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
        uniforms=Object.fromEntries(['size','imageSize','time','under','photo','grip','flowPhoto','liveFlow'].map(k=>[k,gl.getUniformLocation(program,k)]));
        const image=new Image();image.onload=()=>{
          if(lost)return;const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
          imageSize=[image.naturalWidth,image.naturalHeight];gl.uniform1i(uniforms.photo,0);ready=true;canvas.dataset.ready='true';resize();sync();
        };image.onerror=()=>{canvas.hidden=true;canvas.dataset.renderer='image-fallback';};
        image.src=mode==='surface'?'assets/ocean/sunset-sea-v2.webp':'assets/ocean/underwater-world-v2.webp';
      }
    }
    function draw(){
      if(flow&&ready&&flow.readyState>=2&&!lost){
        if(!flowTexture)flowTexture=gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,flowTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,flow);gl.uniform1i(uniforms.flowPhoto,1);gl.uniform1f(uniforms.liveFlow,1);gl.activeTexture(gl.TEXTURE0);
      }
      if(!program||!ready||lost||!canvas.width||!canvas.height)return;
      gl.useProgram(program);gl.uniform2f(uniforms.size,canvas.width,canvas.height);gl.uniform2fv(uniforms.imageSize,imageSize);gl.uniform1f(uniforms.time,clock);gl.uniform4fv(uniforms.grip,gripState);gl.uniform1f(uniforms.under,mode==='underwater'?1:0);gl.drawArrays(gl.TRIANGLES,0,6);
      canvas.dataset.renderTime=clock.toFixed(3);canvas.dataset.motion=moving()?'playing':'paused';
    }
    function tick(now){frame=0;if(!running())return;if(now-last>=33){clock+=Math.min(.08,(now-(last||now))/1000);last=now;draw();}frame=requestAnimationFrame(tick);}
    function sync(){cancelAnimationFrame(frame);frame=0;last=0;if(flow){if(running())flow.play().catch(()=>{});else flow.pause();}draw();if(running())frame=requestAnimationFrame(tick);}
    function resize(){
      const ratio=Math.min(devicePixelRatio||1,innerWidth<700?1:1.2),w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));
      if(program&&!lost){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);draw();}
    }
    if(!program){canvas.hidden=true;canvas.dataset.renderer='image-fallback';}else canvas.dataset.renderer='webgl';
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;resize();sync();},{threshold:0});observer.observe(canvas);
    new ResizeObserver(resize).observe(canvas);
    new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion']});
    reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',sync);
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;canvas.hidden=true;sync();});
    return {setGrip({x,y,strength,curl}){gripState=[x,y,strength,curl];},setActive(value){active=value;resize();sync();},resize};
  }
  window.OceanWater={create};
  const background=document.querySelector('.ocean-background');
  if(background)create(background,'underwater');
})();
