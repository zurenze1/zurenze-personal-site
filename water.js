/* Seven water surfaces share a renderer, not a wave pattern. */
(() => {
  const root=document.documentElement;
  const defaultScene={index:0,about:1,journey:2,'travel-page':3,notes:4,hometown:5,contact:6};
  document.querySelectorAll('.living-water').forEach(createWater);
  function createWater(canvas){
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
    if(!gl){canvas.hidden=true;return;}
    const vertex='attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}';
    const fragment=`precision mediump float;
    uniform vec2 resolution;uniform float time,soft,scene,previous,blend;uniform vec3 paper;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float heightAt(vec2 p,float kind){
      if(kind<.5){float swell=sin(p.x*.72+p.y*.95-time*1.35);return swell*.57+sin(p.x*1.7-p.y*1.9+time*1.85)*.19+sin(p.x*4.7+p.y*3.1-time*2.4)*.055+pow(max(0.,swell),6.)*.16;}
      if(kind<1.5){float r=length(p-vec2(.8,-.3));return sin(r*3.8-time*1.6)*.14/(1.+r*.22)+sin(length(p+vec2(2.2,1.))*5.-time)*.035;}
      if(kind<2.5){p.x+=p.y*.55;return sin(p.x*3.1+sin(p.y*1.1-time*.9))* .10+sin(p.x*7.5+p.y*1.3-time*2.2)*.035+noise(p*2.-vec2(0.,time))* .06;}
      if(kind<3.5)return sin(p.x*2.1+sin(p.y*1.6+time*.45))*.09+cos(p.y*2.6-sin(p.x+time*.55))*.075;
      if(kind<4.5){float h=0.;for(int i=0;i<4;i++){float f=float(i);vec2 center=vec2(sin(f*7.2),cos(f*4.3))*3.;float age=mod(time*.48+f*1.37,5.);float r=length(p-center);h+=sin((r-age*1.5)*11.)*exp(-abs(r-age*1.5)*2.4)*.055*(1.-age/5.);}return h;}
      if(kind<5.5)return sin(p.y*4.8+time*1.1+sin(p.x*.55))*.095+sin(p.y*10.-p.x*.8+time*1.6)*.018;
      return sin(p.x*.6+p.y*.8+time*.3)*.14+sin(p.x*1.4-p.y*.7-time*.35)*.06+sin(p.x*5.+p.y*3.+time*.4)*.004;
    }
    vec3 renderSurface(vec2 uv,float kind){
      float aspect=resolution.x/resolution.y;
      bool overhead=(kind>.5&&kind<1.5)||(kind>2.5&&kind<4.5)||kind>5.5;
      vec3 rd=normalize(vec3((uv.x-.5)*aspect,(uv.y-.65)*.9,-1.));
      vec3 sky=mix(vec3(.22,.34,.43),vec3(.025,.07,.14),smoothstep(.55,1.,uv.y));
      if(kind<.5){float mountain=.64+.042*sin(uv.x*9.)+.026*sin(uv.x*23.+1.);sky=mix(sky,vec3(.035,.11,.19),1.-smoothstep(mountain-.006,mountain+.006,uv.y));}
      if(kind>1.5&&kind<2.5)sky=mix(vec3(.035,.14,.14),sky,.45);
      vec3 col=sky;
      if(rd.y<-.018||overhead){
        vec2 p=overhead?(uv-.5)*vec2(aspect,1.)*9.:(vec3(0.,2.5,4.)+rd*(-2.5/min(rd.y,-.018))).xz;
        if(kind<.5&&!overhead){
          float distance=-2.5/min(rd.y,-.018);
          for(int j=0;j<5;j++){vec2 samplePoint=(vec3(0.,2.5,4.)+rd*distance).xz;float surface=heightAt(samplePoint,kind);distance=mix(distance,(surface-2.5)/min(rd.y,-.018),.55);}
          p=(vec3(0.,2.5,4.)+rd*distance).xz;
        }
        float e=.035,h=heightAt(p,kind);
        vec3 n=normalize(vec3((h-heightAt(p+vec2(e,0.),kind))/e,1.,(h-heightAt(p+vec2(0.,e),kind))/e));
        vec3 view=overhead?normalize(vec3((uv.x-.5)*.2,-1.,-.15)):rd;
        vec3 reflection=reflect(view,n);
        float fresnel=pow(1.-max(dot(-view,n),0.),2.);
        col=mix(vec3(.018,.085,.145),vec3(.26,.42,.51),fresnel);
        vec3 lightDir=overhead?normalize(vec3(.3,1.,.4)):normalize(vec3(.28,.21,-1.));
        float shine=pow(max(dot(reflection,lightDir),0.),overhead?16.:65.);
        col+=vec3(.78,.64,.45)*shine*.75;
        col+=vec3(.07,.13,.16)*smoothstep(-.12,.22,h);
        if(kind<.5){float crest=smoothstep(.43,.76,h);float broken=smoothstep(.12,.8,noise(p*2.7+vec2(time*.4,-time*.6)));float foam=crest*broken;col=mix(col,vec3(.7,.84,.88),foam*.83);col+=vec3(.055,.15,.2)*pow(max(0.,1.-n.y),2.);}
        if(kind>.5&&kind<1.5)col+=vec3(.025,.06,.06)*(n.y*.5+h);
        if(kind>1.5&&kind<2.5)col=mix(col,col*vec3(.7,1.15,.82),.65);
        if(kind>2.5&&kind<3.5){float caustic=pow(max(0.,1.-abs(sin(p.x*2.+sin(p.y*2.+time*.3))+sin(p.y*2.3-time*.3))),8.);col=vec3(.018,.18,.23)+vec3(.14,.34,.26)*caustic+col*.6;}
        if(kind>3.5&&kind<4.5)col=vec3(.035,.10,.13)+vec3(.3,.4,.43)*smoothstep(.992,1.,n.y)+vec3(.4,.52,.5)*abs(h)*4.;
        if(kind>4.5&&kind<5.5){float lines=pow(max(0.,sin(p.x*2.7+h*4.)),18.);col+=vec3(.62,.38,.12)*lines*(.3+.7*noise(p*.8));}
        if(kind>5.5)col=mix(col,vec3(.18,.25,.29)+vec3(.24,.31,.33)*pow(n.y,24.),.7);
        if(!overhead)col=mix(col,vec3(.15,.25,.33),smoothstep(15.,130.,-p.y));
      }
      col*=1.-.18*length((uv-.5)*vec2(.7,1.));
      float lum=dot(col,vec3(.2126,.7152,.0722));
      return mix(col,paper*(.945+.06*smoothstep(.035,.40,lum)),soft);
    }
    void main(){vec2 uv=gl_FragCoord.xy/resolution;vec3 color=renderSurface(uv,scene);if(blend<.999)color=mix(renderSurface(uv,previous),color,blend);gl_FragColor=vec4(color,1.);}`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s;}
    const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs){canvas.hidden=true;return;}
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.hidden=true;return;}gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const uniforms=Object.fromEntries(['resolution','time','soft','paper','scene','previous','blend'].map(name=>[name,gl.getUniformLocation(program,name)]));
    const tones={paper:[.96,.94,.90],sage:[.92,.95,.89],blue:[.91,.95,.97]},paper=tones[canvas.dataset.tone];
    gl.uniform1f(uniforms.soft,paper?1:0);gl.uniform3fv(uniforms.paper,paper||[1,1,1]);
    const page=Object.keys(defaultScene).find(name=>document.body.classList.contains(name));
    let scene=canvas.hasAttribute('data-water-scene')?Number(canvas.dataset.waterScene):(canvas.closest('.page-atmosphere')?defaultScene[page]||0:1),previous=scene,blend=1;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');let visible=true,frame=0,last=0,elapsed=0,lost=false;
    const active=()=>!lost&&visible&&!document.hidden&&!reduced.matches&&root.dataset.motion==='on'&&!root.classList.contains('portal-active');
    function draw(){gl.uniform1f(uniforms.time,elapsed);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform1f(uniforms.scene,scene);gl.uniform1f(uniforms.previous,previous);gl.uniform1f(uniforms.blend,blend);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.scene=String(scene);}
    function resize(){const dpr=Math.min(devicePixelRatio||1,1.15);canvas.width=Math.round(canvas.clientWidth*dpr);canvas.height=Math.round(canvas.clientHeight*dpr);gl.viewport(0,0,canvas.width,canvas.height);draw();}
    function tick(now){frame=0;if(!active())return;if(now-last>=32){const dt=Math.min(.07,(now-(last||now))/1000);elapsed+=dt;blend=Math.min(1,blend+dt*.9);last=now;draw();}frame=requestAnimationFrame(tick);}
    function sync(){if(!active()){cancelAnimationFrame(frame);frame=0;last=0;blend=1;draw();}else if(!frame){last=0;frame=requestAnimationFrame(tick);}}
    if(canvas.closest('.page-atmosphere')){
      const zones=[...document.querySelectorAll('[data-water-scene]')];let scrollFrame=0;
      function chooseScene(){scrollFrame=0;let next=defaultScene[page]||0;const line=innerHeight*.42;for(const zone of zones){const rect=zone.getBoundingClientRect();if(rect.top<=line&&rect.bottom>line){next=Number(zone.dataset.waterScene);break;}}if(next!==scene){previous=scene;scene=next;blend=active()?0:1;draw();}}
      window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(chooseScene);},{passive:true});chooseScene();
    }
    new ResizeObserver(resize).observe(canvas);new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync();},{threshold:0}).observe(canvas);
    new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion','class']});reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;canvas.hidden=true;cancelAnimationFrame(frame);frame=0;});
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',sync);resize();sync();
  }
})();
