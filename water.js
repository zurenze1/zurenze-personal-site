/* A live ocean surface, drawn locally. No stock video, tracking or network calls. */
(() => {
  const canvas = document.querySelector('.living-water');
  if (!canvas) return;
  const root = document.documentElement;
  const gl = canvas.getContext('webgl', {alpha:false, antialias:false, powerPreference:'low-power'});
  if (!gl) { canvas.hidden = true; return; }
  const vertex = 'attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}';
  const fragment = `precision mediump float;
    uniform vec2 resolution;
    uniform float time;
    float wave(vec2 p){
      return sin(p.x*.95+p.y*1.2+time*.65)*.18
        +sin(p.x*1.8-p.y*.75-time*.82)*.12
        +sin(p.x*3.9+p.y*2.2+time*1.03)*.035
        +sin(p.x*7.8-p.y*4.3-time*1.5)*.016;
    }
    void main(){
      vec2 uv=gl_FragCoord.xy/resolution;
      float aspect=resolution.x/resolution.y;
      vec3 rd=normalize(vec3((uv.x-.5)*aspect,(uv.y-.65)*.9,-1.));
      vec3 sky=mix(vec3(.22,.34,.43),vec3(.025,.07,.14),smoothstep(.55,1.,uv.y));
      float mountain=.64+.042*sin(uv.x*9.)+.026*sin(uv.x*23.+1.)+.012*sin(uv.x*48.);
      sky=mix(sky,vec3(.035,.11,.19),1.-smoothstep(mountain-.006,mountain+.006,uv.y));
      vec3 col=sky;
      if(rd.y<-.018){
        vec3 p=vec3(0.,2.5,4.)+rd*(-2.5/rd.y);
        float e=.035;
        float h=wave(p.xz);
        vec3 n=normalize(vec3((h-wave(p.xz+vec2(e,0.)))/e,1.,(h-wave(p.xz+vec2(0.,e)))/e));
        vec3 reflected=reflect(rd,n);
        float fresnel=pow(1.-max(dot(-rd,n),0.),2.);
        col=mix(vec3(.018,.085,.145),vec3(.26,.42,.51),fresnel);
        float light=pow(max(dot(reflected,normalize(vec3(.28,.21,-1.))),0.),65.);
        float shimmer=pow(max(dot(reflected,normalize(vec3(.28,.18,-1.))),0.),13.);
        col+=vec3(.85,.64,.42)*light*.9+vec3(.34,.25,.16)*shimmer*.38;
        col+=vec3(.06,.13,.17)*smoothstep(.1,.32,h);
        col=mix(col,vec3(.15,.25,.33),smoothstep(15.,130.,-p.z));
      }
      col*=1.-.20*length((uv-.5)*vec2(.7,1.));
      gl_FragColor=vec4(col,1.);
    }`;
  function shader(type, source) {
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) {gl.deleteShader(s);return null;}
    return s;
  }
  const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
  if (!vs || !fs) {canvas.hidden=true;return;}
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {canvas.hidden=true;return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const clock=gl.getUniformLocation(program,'time'),resolution=gl.getUniformLocation(program,'resolution');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=true,frame=0,last=0,elapsed=0,lost=false;
  const active=()=>!lost&&visible&&!document.hidden&&!reduced.matches&&root.dataset.motion==='on';
  function draw(){gl.uniform1f(clock,elapsed);gl.uniform2f(resolution,canvas.width,canvas.height);gl.drawArrays(gl.TRIANGLES,0,6);}
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,1.25);
    canvas.width=Math.round(canvas.clientWidth*dpr);canvas.height=Math.round(canvas.clientHeight*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);draw();
  }
  function tick(now){
    frame=0;if(!active())return;
    if(now-last>=32){elapsed+=Math.min(.06,(now-(last||now))/1000);last=now;draw();}
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    if(!active()){cancelAnimationFrame(frame);frame=0;last=0;}
    else if(!frame){last=0;frame=requestAnimationFrame(tick);}
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(canvas);
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion']});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;canvas.hidden=true;sync();});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',sync);
  resize();sync();
})();
