/* Red tentacle lifts a curved sea curtain; the main page remains real HTML underneath. */
(() => {
  if(!document.body.classList.contains('ocean-home'))return;
  const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const params=new URLSearchParams(location.search);
  // v4 was rejected. Retain it only for explicit historical comparison while
  // the replacement is being made as a real continuous video.
  if(params.get('entry')!=='v4'){
    document.querySelectorAll('[data-ocean-entry-replay]').forEach(button=>{button.hidden=true;button.style.display='none';});
    return;
  }
  const dialog=document.createElement('dialog');dialog.className='ocean-entry';dialog.setAttribute('aria-label','章鱼触手掀起海面的入场动画');
  dialog.innerHTML=`<svg class="ocean-entry-sea" aria-hidden="true"><defs><clipPath id="sea-curtain-clip"><path class="sea-curtain-shape"/></clipPath><filter id="sea-lip-glow"><feGaussianBlur stdDeviation="3"/></filter></defs><g clip-path="url(#sea-curtain-clip)"><image class="sea-curtain-image" href="assets/ocean/sunset-sea-v2.webp"/><foreignObject class="sea-live-object" x="0" y="0" width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" class="sea-live-wrap"><canvas class="sea-live-canvas"></canvas></div></foreignObject><rect class="sea-curtain-wash" fill="#00364a" opacity=".035"/><foreignObject class="sea-curtain-text" width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" class="ocean-entry-heading"><p>祖仁泽 / 个人世界</p><h2>向海而行<br/>自由生长</h2></div></foreignObject></g><g class="sea-drips" fill="none" stroke-linecap="round"></g><path class="sea-curtain-shadow" fill="none" stroke="#002e42" stroke-width="16" opacity=".45" filter="url(#sea-lip-glow)"/><path class="sea-curtain-lip" fill="none" stroke="#9bc9cc" stroke-width="4" opacity=".8"/><path class="sea-curtain-foam" fill="none" stroke="#f5ead5" stroke-width="1.5" opacity=".85"/></svg><img class="ocean-entry-arm" src="assets/ocean/tentacle-v2.webp" alt="" aria-hidden="true"><div class="ocean-entry-top"><span>祖仁泽 <small>／ 个人网站</small></span><div class="ocean-entry-tools"><button class="ocean-entry-sound" type="button" aria-pressed="true">声音开启 ♫</button><button class="ocean-entry-skip" type="button">跳过入场 ↗</button></div></div><p class="ocean-entry-caption" aria-hidden="true">海面之下，还有一个世界。</p>`;
  const ribbon=document.createElement('canvas');ribbon.className='ocean-entry-ribbon';ribbon.setAttribute('aria-hidden','true');dialog.querySelector('.ocean-entry-arm').before(ribbon);
  const liveCanvas=dialog.querySelector(".sea-live-canvas");
  const seaRenderer=window.OceanWater?.create(liveCanvas,"surface");
  const armCanvas=document.createElement('canvas');armCanvas.className='ocean-entry-tentacle';armCanvas.setAttribute('aria-hidden','true');
  const frontWater=document.createElement('canvas');frontWater.className='ocean-entry-grip-water';frontWater.setAttribute('aria-hidden','true');
  dialog.querySelector('.ocean-entry-arm').after(armCanvas,frontWater);
  const tentacleRenderer=window.createOceanTentacle?.(armCanvas,dialog.querySelector('.ocean-entry-arm'));
  const waterRenderer=window.createOceanGripWater?.(ribbon,frontWater);
  document.body.append(dialog);
  const svg=dialog.querySelector('svg'),shape=dialog.querySelector('.sea-curtain-shape'),image=dialog.querySelector('.sea-curtain-image');
  const shadow=dialog.querySelector('.sea-curtain-shadow'),lip=dialog.querySelector('.sea-curtain-lip'),foam=dialog.querySelector('.sea-curtain-foam');
  const arm=dialog.querySelector('.ocean-entry-arm'),words=dialog.querySelector('.sea-curtain-text');
  const clamp=v=>Math.min(1,Math.max(0,v));
  const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a));return x*x*(3-2*x);};
  let frame=0,start=0,returnFocus=null,last=0,deadline=0;
  const hold=2800,duration=7400;
  const music=new Audio('assets/ocean/audio/reference-music-preview.mp3');music.preload='auto';music.volume=.78;
  music.id='ocean-entry-music';music.hidden=true;document.body.append(music);
  const waterSound=new Audio('assets/ocean/audio/water-lift.mp3');waterSound.preload='auto';waterSound.volume=.48;
  waterSound.id='ocean-entry-water-sound';waterSound.hidden=true;document.body.append(waterSound);
  const soundButton=dialog.querySelector('.ocean-entry-sound');
  let waitingForSound=false,muted=false,soundToken=0,waterTimer=0;
  function stopSound(){soundToken++;clearTimeout(waterTimer);music.pause();waterSound.pause();music.currentTime=0;waterSound.currentTime=0;}
  function scheduleWater(){
    clearTimeout(waterTimer);
    const delay=Math.max(0,hold+650-(performance.now()-start));
    waterTimer=setTimeout(()=>{
      if(!dialog.open||muted)return;
      const offset=Math.max(0,(performance.now()-start-hold-650)/1000);
      if(offset>=4.4)return;waterSound.currentTime=offset;
      waterSound.play().then(()=>{dialog.dataset.waterPlayed='true';}).catch(()=>{});
    },delay);
  }
  function updateSound(){soundButton.textContent=waitingForSound?'点击有声进入 ♫':muted?'声音关闭 ♫':'声音开启 ♫';soundButton.setAttribute('aria-pressed',String(!muted));}
  function playSound(){
    document.querySelector('#ambient-audio')?.pause();
    const token=++soundToken;waitingForSound=false;dialog.dataset.waterPlayed='false';updateSound();music.currentTime=0;
    if(muted){dialog.dataset.sound='muted';return;}
    music.play().then(()=>{
      if(token!==soundToken||!dialog.open){music.pause();return;}dialog.dataset.sound='playing';updateSound();
      scheduleWater();
    }).catch(()=>{
      if(token!==soundToken||!dialog.open)return;waitingForSound=true;dialog.dataset.sound='blocked';
      dialog.querySelector('.ocean-entry-caption').textContent='点一下右上角，听着音乐进入。';updateSound();
    });
  }
  soundButton.addEventListener('click',()=>{
    if(waitingForSound){muted=false;play();return;}
    muted=!muted;
    if(muted){music.pause();waterSound.pause();clearTimeout(waterTimer);dialog.dataset.sound='muted';}
    else{music.currentTime=Math.min(music.duration||7.6,(performance.now()-start)/1000);music.play().then(()=>{dialog.dataset.sound='playing';scheduleWater();}).catch(()=>{});}
    updateSound();
  });
  function paint(p){
    const t=performance.now()/1000;
    const w=innerWidth,h=innerHeight,mobile=w<700;
    const press=smooth(.09,.27,p),lift=smooth(.35,.79,p),exit=smooth(.79,1,p);
    const gx=w*(mobile?.67:.71)+Math.sin(p*5.2)*w*.018*lift;
    const gy=h*(.86+.035*Math.sin(press*Math.PI)-.14*smooth(.25,.46,p)-.48*smooth(.46,.79,p)-1.35*exit);
    const yl=h*(1.06-.23*lift-1.04*exit),yr=h*(1.06-.44*lift-1.12*exit);
    const edge=`M 0 ${yl} C ${w*.38} ${yl} ${gx-w*.17} ${gy} ${gx} ${gy} C ${gx+w*.13} ${gy} ${w*.90} ${yr} ${w} ${yr}`;
    const bez=(q,a,b,c,d)=>{const z=1-q;return z*z*z*a+3*z*z*q*b+3*z*q*q*c+q*q*q*d;};
    const boundary=[];
    for(let i=0;i<=64;i++){
      const x=w*i/64,left=x<gx;let a=0,b=1;
      for(let j=0;j<12;j++){const q=(a+b)/2,px=left?bez(q,0,w*.38,gx-w*.17,gx):bez(q,gx,gx+w*.13,w*.90,w);if(px<x)a=q;else b=q;}
      const q=(a+b)/2,maskGy=gy+h*.16*(1-smooth(.12,.30,p)),top=left?bez(q,yl,yl,maskGy,maskGy):bez(q,maskGy,maskGy,yr,yr),near=Math.exp(-Math.pow((x-gx)/(w*.17),2));
      const depth=Math.min(.038+near*.09,.19*w/h)*h;
      boundary.push([x,top+depth]);
    }
    shape.setAttribute('d',`M 0 -100 H ${w} L ${boundary.slice().reverse().map(v=>v.join(' ')).join(' L ')} Z`);
    [shadow,lip,foam].forEach(path=>{path.setAttribute('d',edge);path.style.opacity='0';});
    const size=mobile?w*1.12:Math.min(900,w*.57),height=size/1.5;
    tentacleRenderer?.paint({w,h,gx,gy,size,phase:p,time:t});
    waterRenderer?.paint({w,h,gx,gy,yl,yr,size,phase:p,time:t});
    seaRenderer?.setGrip({x:gx/w,y:1-gy/h,strength:smooth(.12,.38,p)*(1-exit),curl:smooth(.16,.46,p)});
    const bend=smooth(.25,.84,p);
    image.setAttribute('transform',`translate(0 ${-bend*h*.04})`);
    arm.style.width=size+'px';arm.style.height=height+'px';
    arm.style.left=(gx-size*.276)+'px';arm.style.top=(gy-height*.684-(1-smooth(.06,.27,p))*h*.78)+'px';
    arm.style.transform=`rotate(${-8+smooth(.08,.3,p)*8-smooth(.65,1,p)*6}deg) scale(${1+.025*Math.sin(p*5)})`;
    arm.style.opacity=String(smooth(.035,.12,p));
    
    words.style.opacity=String(1-smooth(.23,.55,p));
    dialog.querySelector('.ocean-entry-caption').style.opacity=String(1-smooth(.75,.98,p));
    dialog.querySelector('.ocean-entry-top').style.opacity=String(1-smooth(.90,1,p));
    dialog.dataset.progress=p.toFixed(3);dialog.dataset.grip=`${Math.round(gx)},${Math.round(gy)}`;
    dialog.dataset.phase=p<.16?'reach':p<.46?'curl':p<.8?'lift':'finish';
  }
  function resize(){
    const w=innerWidth,h=innerHeight,ratio=1672/941,iw=Math.max(w,h*ratio),ih=iw/ratio,focus=w<700?.72:.5;
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    image.setAttribute('x',(w-iw)*focus);image.setAttribute('y',(h-ih)*.5);image.setAttribute('width',iw);image.setAttribute('height',ih);image.setAttribute('preserveAspectRatio','none');
    const rect=dialog.querySelector('.sea-curtain-wash');rect.setAttribute('width',w);rect.setAttribute('height',h);
    words.setAttribute('width',w);words.setAttribute('height',h);
    const live=dialog.querySelector('.sea-live-object');live.setAttribute('width',w);live.setAttribute('height',h);seaRenderer?.resize();
    if(dialog.open)paint(dialog.dataset.paused==='true'?Number(dialog.dataset.progress):clamp((performance.now()-start-hold)/(duration-hold)));
  }
  function finish(){
    cancelAnimationFrame(frame);frame=0;clearTimeout(deadline);root.classList.remove('ocean-entry-active');
    if(dialog.open)dialog.close();dialog.dataset.phase='closed';dialog.dataset.sound='stopped';seaRenderer?.setActive(false);stopSound();
    if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  }
  function tick(now){
    frame=0;if(!dialog.open)return;
    if(dialog.dataset.paused==='true'){paint(Number(dialog.dataset.progress));frame=requestAnimationFrame(tick);return;}
    if(waitingForSound){start=now;paint(0);frame=requestAnimationFrame(tick);return;}
    const elapsed=now-start,p=clamp((elapsed-hold)/(duration-hold));dialog.dataset.elapsed=(elapsed/1000).toFixed(2);
    if(now-last>=25){paint(p);last=now;}
    if(elapsed>=duration){finish();return;}frame=requestAnimationFrame(tick);
  }
  function play(){
    if(reduced.matches||root.dataset.motion==='off')return;
    finish();window.scrollTo({top:0,behavior:'instant'});
    returnFocus=document.activeElement?.matches('[data-ocean-entry-replay]')?document.activeElement:document.querySelector('#hero-heading');
    start=performance.now();last=0;waitingForSound=false;dialog.dataset.paused='false';dialog.querySelector('.ocean-entry-caption').textContent='海面之下，还有一个世界。';root.classList.add('ocean-entry-active');dialog.showModal();seaRenderer?.setActive(true);resize();paint(0);playSound();
    deadline=setTimeout(()=>{if(!waitingForSound)finish();},duration+1000);frame=requestAnimationFrame(tick);
  }
  if(params.has('preview')){
    const controls=document.createElement('div');controls.className='ocean-entry-preview';controls.setAttribute('aria-label','入场效果预览');
    controls.innerHTML='<button type="button" data-entry-pose="0">定格海面</button><button type="button" data-entry-pose=".14">查看探入</button><button type="button" data-entry-pose=".38">查看卷握</button><button type="button" data-entry-pose=".66">查看提拉</button><button type="button" data-entry-play>有声播放 ↗</button>';
    dialog.append(controls);
    function pose(p){
      if(reduced.matches||root.dataset.motion==='off')return;
      cancelAnimationFrame(frame);frame=0;clearTimeout(deadline);stopSound();waitingForSound=false;
      if(!dialog.open){returnFocus=document.querySelector('.ocean-preview-open');root.classList.add('ocean-entry-active');dialog.showModal();}
      start=performance.now()-hold-p*(duration-hold);seaRenderer?.setActive(true);resize();paint(p);dialog.dataset.paused='true';frame=requestAnimationFrame(tick);
    }
    controls.querySelectorAll('[data-entry-pose]').forEach(button=>button.addEventListener('click',()=>pose(Number(button.dataset.entryPose))));
    controls.querySelector('[data-entry-play]').addEventListener('click',play);
    const opener=document.createElement('button');opener.type='button';opener.className='ocean-preview-open';opener.textContent='播放有声掀海入场 ↗';opener.addEventListener('click',play);document.body.append(opener);
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
