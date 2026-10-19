/* Red tentacle lifts a curved sea curtain; the main page remains real HTML underneath. */
(() => {
  if(!document.body.classList.contains('ocean-home'))return;
  const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const params=new URLSearchParams(location.search);
  const dialog=document.createElement('dialog');dialog.className='ocean-entry';dialog.setAttribute('aria-label','章鱼触手掀起海面的入场动画');
  dialog.innerHTML=`<div class="ocean-entry-world" aria-hidden="true"></div><svg class="ocean-entry-sea" aria-hidden="true"><defs><clipPath id="sea-curtain-clip"><path class="sea-curtain-shape"/></clipPath><filter id="sea-lip-glow"><feGaussianBlur stdDeviation="3"/></filter></defs><g clip-path="url(#sea-curtain-clip)"><image class="sea-curtain-image" href="assets/ocean/sunset-sea-v2.webp"/><rect class="sea-curtain-wash" fill="#00364a" opacity=".035"/><foreignObject class="sea-curtain-text" width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" class="ocean-entry-heading"><p>祖仁泽 / 个人世界</p><h2>向海而行<br/>自由生长</h2></div></foreignObject></g><path class="sea-curtain-shadow" fill="none" stroke="#002e42" stroke-width="16" opacity=".45" filter="url(#sea-lip-glow)"/><path class="sea-curtain-lip" fill="none" stroke="#9bc9cc" stroke-width="4" opacity=".8"/><path class="sea-curtain-foam" fill="none" stroke="#f5ead5" stroke-width="1.5" opacity=".85"/></svg><img class="ocean-entry-arm" src="assets/ocean/tentacle-v2.webp" alt="" aria-hidden="true"><div class="ocean-entry-top"><span>祖仁泽 <small>／ 个人网站</small></span><button class="ocean-entry-skip" type="button">跳过入场 ↗</button></div><p class="ocean-entry-caption" aria-hidden="true">海面之下，还有一个世界。</p>`;
  const ribbon=document.createElement('canvas');ribbon.className='ocean-entry-ribbon';ribbon.setAttribute('aria-hidden','true');dialog.querySelector('.ocean-entry-arm').before(ribbon);
  const water=new Image();
  const rg=ribbon.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'low-power'});
  let rp=null,ru={},ribbonReady=false;
  if(rg){
    const vertex='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fragment=`precision highp float;uniform vec2 size;uniform float gx,gy,yl,yr,phase;uniform sampler2D photo;
      float bez(float t,float a,float b,float c,float d){float q=1.-t;return q*q*q*a+3.*q*q*t*b+3.*q*t*t*c+t*t*t*d;}
      void main(){
        vec2 uv=gl_FragCoord.xy/size;float x=uv.x,y=1.-uv.y;bool left=x<gx;
        float a=0.,b=1.;
        for(int i=0;i<10;i++){float t=(a+b)*.5;float px=left?bez(t,0.,.38,gx-.17,gx):bez(t,gx,gx+.13,.90,1.);if(px<x)a=t;else b=t;}
        float t=(a+b)*.5,edge=left?bez(t,yl,yl,gy,gy):bez(t,gy,gy,yr,yr);
        float height=min(.20+.18*clamp(1.-edge,0.,1.),.32*size.x/size.y);float v=(y-(edge-height))/height;
        if(v<0.||v>1.)discard;
        vec3 color=texture2D(photo,vec2(uv.x,.45*(1.-v))).rgb;
        float alpha=smoothstep(0.,.35,v)*smoothstep(.18,.32,phase);
        gl_FragColor=vec4(color,alpha);
      }`;
    function shader(type,source){const v=rg.createShader(type);rg.shaderSource(v,source);rg.compileShader(v);return rg.getShaderParameter(v,rg.COMPILE_STATUS)?v:null;}
    const vs=shader(rg.VERTEX_SHADER,vertex),fs=shader(rg.FRAGMENT_SHADER,fragment);
    if(vs&&fs){rp=rg.createProgram();rg.attachShader(rp,vs);rg.attachShader(rp,fs);rg.linkProgram(rp);if(!rg.getProgramParameter(rp,rg.LINK_STATUS))rp=null;}
    if(rp){
      rg.useProgram(rp);const buffer=rg.createBuffer();rg.bindBuffer(rg.ARRAY_BUFFER,buffer);rg.bufferData(rg.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),rg.STATIC_DRAW);
      const position=rg.getAttribLocation(rp,'p');rg.enableVertexAttribArray(position);rg.vertexAttribPointer(position,2,rg.FLOAT,false,0,0);
      ru=Object.fromEntries(['size','gx','gy','yl','yr','phase','photo'].map(name=>[name,rg.getUniformLocation(rp,name)]));
    }
  }
  water.onload=()=>{
    if(!rp)return;
    const tex=rg.createTexture();rg.bindTexture(rg.TEXTURE_2D,tex);rg.texParameteri(rg.TEXTURE_2D,rg.TEXTURE_WRAP_S,rg.CLAMP_TO_EDGE);rg.texParameteri(rg.TEXTURE_2D,rg.TEXTURE_WRAP_T,rg.CLAMP_TO_EDGE);rg.texParameteri(rg.TEXTURE_2D,rg.TEXTURE_MIN_FILTER,rg.LINEAR);rg.texParameteri(rg.TEXTURE_2D,rg.TEXTURE_MAG_FILTER,rg.LINEAR);
    rg.pixelStorei(rg.UNPACK_FLIP_Y_WEBGL,true);rg.texImage2D(rg.TEXTURE_2D,0,rg.RGB,rg.RGB,rg.UNSIGNED_BYTE,water);rg.uniform1i(ru.photo,0);ribbonReady=true;
  };
  water.src='assets/ocean/sunset-sea-v2.webp';
  document.body.append(dialog);
  const svg=dialog.querySelector('svg'),shape=dialog.querySelector('.sea-curtain-shape'),image=dialog.querySelector('.sea-curtain-image');
  const shadow=dialog.querySelector('.sea-curtain-shadow'),lip=dialog.querySelector('.sea-curtain-lip'),foam=dialog.querySelector('.sea-curtain-foam');
  const arm=dialog.querySelector('.ocean-entry-arm'),world=dialog.querySelector('.ocean-entry-world'),words=dialog.querySelector('.sea-curtain-text');
  const clamp=v=>Math.min(1,Math.max(0,v));
  const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a));return x*x*(3-2*x);};
  let frame=0,start=0,returnFocus=null,last=0,deadline=0;
  const duration=5500;
  function paint(p){
    const w=innerWidth,h=innerHeight,mobile=w<700;
    const gx=w*(mobile?.69:.72),gy=h*(1.06-.46*smooth(.12,.30,p)-.32*smooth(.30,.70,p)-1.18*smooth(.70,1,p));
    const yl=h*(1.06-.32*smooth(.30,.70,p)-1.12*smooth(.70,1,p)),yr=h*(1.06-.48*smooth(.30,.70,p)-1.04*smooth(.70,1,p));
    const edge=`M 0 ${yl} C ${w*.38} ${yl} ${gx-w*.17} ${gy} ${gx} ${gy} C ${gx+w*.13} ${gy} ${w*.90} ${yr} ${w} ${yr}`;
    shape.setAttribute('d',`M 0 -100 H ${w} V ${yr} C ${w*.90} ${yr} ${gx+w*.13} ${gy} ${gx} ${gy} C ${gx-w*.17} ${gy} ${w*.38} ${yl} 0 ${yl} Z`);
    [shadow,lip,foam].forEach(path=>path.setAttribute('d',edge));
    if(rp&&ribbonReady){
      rg.clearColor(0,0,0,0);rg.clear(rg.COLOR_BUFFER_BIT);
      rg.uniform2f(ru.size,w,h);rg.uniform1f(ru.gx,gx/w);rg.uniform1f(ru.gy,gy/h);rg.uniform1f(ru.yl,yl/h);rg.uniform1f(ru.yr,yr/h);rg.uniform1f(ru.phase,p);rg.drawArrays(rg.TRIANGLES,0,6);
    }
    const bend=smooth(.25,.84,p);
    image.setAttribute('transform',`translate(0 ${-bend*h*.04})`);
    const size=mobile?w*.95:Math.min(860,w*.53),height=size/1.5;
    arm.style.width=size+'px';arm.style.height=height+'px';
    arm.style.left=(gx-size*.276)+'px';arm.style.top=(gy-height*.684-(1-smooth(.06,.27,p))*h*.78)+'px';
    arm.style.transform=`rotate(${-8+smooth(.08,.3,p)*8-smooth(.65,1,p)*6}deg) scale(${1+.025*Math.sin(p*5)})`;
    arm.style.opacity=String(smooth(.035,.12,p));
    world.style.opacity=String(1-smooth(.70,.98,p));
    words.style.opacity=String(1-smooth(.23,.55,p));
    dialog.querySelector('.ocean-entry-caption').style.opacity=String(1-smooth(.75,.98,p));
    dialog.querySelector('.ocean-entry-top').style.opacity=String(1-smooth(.90,1,p));
    dialog.dataset.progress=p.toFixed(3);dialog.dataset.grip=`${Math.round(gx)},${Math.round(gy)}`;
    dialog.dataset.phase=p<.29?'grip':p<.8?'lift':'finish';
  }
  function resize(){
    const w=innerWidth,h=innerHeight,ratio=1672/941,iw=Math.max(w,h*ratio),ih=iw/ratio,focus=w<700?.72:.5;
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    image.setAttribute('x',(w-iw)*focus);image.setAttribute('y',(h-ih)*.5);image.setAttribute('width',iw);image.setAttribute('height',ih);image.setAttribute('preserveAspectRatio','none');
    const rect=dialog.querySelector('.sea-curtain-wash');rect.setAttribute('width',w);rect.setAttribute('height',h);
    words.setAttribute('width',w);words.setAttribute('height',h);
    ribbon.width=w;ribbon.height=h;if(rp)rg.viewport(0,0,w,h);
    if(dialog.open)paint(clamp((performance.now()-start)/duration));
  }
  function finish(){
    cancelAnimationFrame(frame);frame=0;clearTimeout(deadline);root.classList.remove('ocean-entry-active');
    if(dialog.open)dialog.close();dialog.dataset.phase='closed';
    if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  }
  function tick(now){
    frame=0;if(!dialog.open)return;
    const p=clamp((now-start)/duration);
    if(now-last>=25){paint(p);last=now;}
    if(p>=1){finish();return;}frame=requestAnimationFrame(tick);
  }
  function play(){
    if(reduced.matches||root.dataset.motion==='off')return;
    finish();window.scrollTo({top:0,behavior:'instant'});
    returnFocus=document.activeElement?.matches('[data-ocean-entry-replay]')?document.activeElement:document.querySelector('#hero-heading');
    start=performance.now();last=0;dialog.dataset.paused='false';root.classList.add('ocean-entry-active');dialog.showModal();resize();paint(0);
    deadline=setTimeout(finish,duration+800);frame=requestAnimationFrame(tick);
  }
  if(params.has('preview')){
    const controls=document.createElement('div');controls.className='ocean-entry-preview';controls.setAttribute('aria-label','入场效果预览');
    controls.innerHTML='<button type="button" data-entry-pose="0">海面</button><button type="button" data-entry-pose=".30">抓住海面</button><button type="button" data-entry-pose=".57">掀起海面</button><button type="button" data-entry-play>播放完整入场</button>';
    dialog.append(controls);
    function pose(p){
      if(reduced.matches||root.dataset.motion==='off')return;
      cancelAnimationFrame(frame);frame=0;clearTimeout(deadline);
      if(!dialog.open){returnFocus=document.querySelector('.ocean-preview-open');root.classList.add('ocean-entry-active');dialog.showModal();}
      start=performance.now()-p*duration;resize();paint(p);dialog.dataset.paused='true';
    }
    controls.querySelectorAll('[data-entry-pose]').forEach(button=>button.addEventListener('click',()=>pose(Number(button.dataset.entryPose))));
    controls.querySelector('[data-entry-play]').addEventListener('click',play);
    const opener=document.createElement('button');opener.type='button';opener.className='ocean-preview-open';opener.textContent='预览掀海入场 ↗';opener.addEventListener('click',()=>pose(.30));document.body.append(opener);
  }
  dialog.querySelector('.ocean-entry-skip').addEventListener('click',finish);dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
  document.querySelector('[data-ocean-entry-replay]')?.addEventListener('click',play);
  window.addEventListener('resize',resize);window.addEventListener('pagehide',finish);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
  function syncMotion(){const disabled=reduced.matches||root.dataset.motion==='off';if(disabled)finish();document.querySelectorAll('[data-ocean-entry-replay],.ocean-preview-open').forEach(button=>{button.disabled=disabled;button.title=disabled?'开启页面动态后可查看入场':'';});}
  new MutationObserver(syncMotion).observe(root,{attributes:true,attributeFilter:['data-motion']});
  reduced.addEventListener('change',syncMotion);syncMotion();
  if(!location.hash&&!params.has('preview')&&params.get('intro')!=='0'&&!reduced.matches){
    // Content is never held waiting for animation resources; the timeout always releases the dialog.
    requestAnimationFrame(play);
  }
})();
