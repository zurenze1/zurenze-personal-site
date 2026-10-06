(() => {
  const root=document.documentElement;
  const films={
    introduction:{title:'我的自我介绍',src:'assets/video/ip-course-introduction.mp4',poster:'assets/video/ip-course-introduction-poster.jpg',link:'about.html#self-intro',label:'认识我与我的经历'},
    military:{title:'两年军旅总结回忆',src:'assets/photos/military/military-moments.mp4',poster:'assets/photos/military/military-moments-poster.jpg',link:'journey.html#journey-military',label:'走进完整军旅故事'}
  };
  if(document.querySelector('[data-film]') && typeof HTMLDialogElement!=='undefined') {
    const dialog=document.createElement('dialog');dialog.className='story-film-dialog';dialog.setAttribute('aria-labelledby','film-dialog-title');
    dialog.innerHTML='<header><div><small>影像 / 原声完整视频</small><h2 id="film-dialog-title"></h2></div><button type="button" class="film-close" aria-label="关闭视频">关闭 ×</button></header><video controls playsinline preload="none"></video><footer><p class="film-status" role="status"></p><a class="film-story-link"></a></footer>';
    document.body.append(dialog);const video=dialog.querySelector('video');let focus;
    document.querySelectorAll('[data-film]').forEach(a=>a.addEventListener('click',e=>{
      const film=films[a.dataset.film];if(!film)return;e.preventDefault();focus=a;
      dialog.querySelector('h2').textContent=film.title;video.setAttribute('aria-label',film.title);video.poster=film.poster;video.src=film.src;
      const link=dialog.querySelector('a');link.href=film.link;link.textContent=film.label+' ↗';dialog.querySelector('.film-status').textContent='正在加载，稍等片刻…';
      dialog.showModal();document.body.classList.add('film-open');dialog.querySelector('button').focus();
      video.play().catch(()=>{dialog.querySelector('.film-status').textContent='点击播放器的播放键开始观看。';});
    }));
    video.addEventListener('playing',()=>{dialog.querySelector('.film-status').textContent='正在播放 · 背景音乐已暂停';});
    video.addEventListener('waiting',()=>{dialog.querySelector('.film-status').textContent='视频正在缓冲…';});
    video.addEventListener('error',()=>{dialog.querySelector('.film-status').textContent='视频暂时无法加载，请通过右侧入口进入对应故事观看。';});
    dialog.querySelector('.film-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();document.body.classList.remove('film-open');focus?.focus({preventScroll:true});});
  }
  const stage=document.querySelector('.photo-sphere');if(!stage)return;
  const cards=[...stage.querySelectorAll('.sphere-photo')];const toggle=document.querySelector('.sphere-toggle');
  let yaw=0,pitch=-.07,paused=false,hover=false,focused=false,visible=true,drag=null,moved=false,frame=0,last=0,size=500;
  const points=cards.map((_,i)=>{
    if(i===0)return [0,.05,1];
    const y=1-2*(i-.5)/(cards.length-1);const radius=Math.sqrt(1-y*y);const theta=i*2.39996323;
    return [Math.cos(theta)*radius,y,Math.sin(theta)*radius];
  });
  const motion=()=>root.dataset.motion==='on'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw(){
    const radius=Math.min(size,stage.clientHeight)*.37;
    cards.forEach((card,i)=>{
      const [x,y,z]=points[i];const rx=x*Math.cos(yaw)+z*Math.sin(yaw),rz=z*Math.cos(yaw)-x*Math.sin(yaw);
      const ry=y*Math.cos(pitch)-rz*Math.sin(pitch),depth=y*Math.sin(pitch)+rz*Math.cos(pitch);
      const scale=.56+(depth+1)*.27;
      card.style.transform=`translate(-50%,-50%) translate3d(${(rx*radius).toFixed(2)}px,${(ry*radius).toFixed(2)}px,0) scale(${scale.toFixed(3)})`;
      card.style.opacity=(depth>=0?1:Math.max(.06,1+depth*2.8)).toFixed(2);card.style.zIndex=String(Math.round((depth+1)*100));
      card.style.filter=`brightness(${depth>=0?1:.72})`;
    });
  }
  function active(){return motion()&&!paused&&!hover&&!focused&&!drag&&visible&&!document.hidden&&!document.querySelector('dialog[open]');}
  function tick(time){frame=0;const dt=Math.min(50,time-(last||time));last=time;if(active()){yaw+=dt*.00012;draw();frame=requestAnimationFrame(tick);}}
  function resume(){last=0;if(active()&&!frame)frame=requestAnimationFrame(tick);}
  function sync(){toggle.disabled=!motion();toggle.textContent=!motion()?'动态已关闭':paused?'继续旋转 ↻':'暂停旋转 Ⅱ';toggle.setAttribute('aria-pressed',String(paused));draw();resume();}
  new ResizeObserver(entries=>{size=entries[0].contentRect.width;draw();}).observe(stage);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();},{threshold:.05}).observe(stage);
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion']});
  // Pause while people read or interact; background tabs never spend animation frames.
  new MutationObserver(resume).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
  document.addEventListener('visibilitychange',resume);
  stage.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hover=true;});stage.addEventListener('pointerleave',()=>{hover=false;resume();});
  stage.addEventListener('focusin',()=>{focused=true;});stage.addEventListener('focusout',e=>{focused=stage.contains(e.relatedTarget);resume();});
  toggle.addEventListener('click',()=>{paused=!paused;sync();});
  stage.addEventListener('pointerdown',e=>{if(!motion()||e.button!==0)return;drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,id:e.pointerId};moved=false;});
  stage.addEventListener('pointermove',e=>{
    if(!drag)return;
    if(Math.abs(e.clientX-drag.x)>7){moved=true;stage.setPointerCapture(e.pointerId);}
    if(moved){yaw+=(e.clientX-drag.lastX)*.007;pitch=Math.max(-.8,Math.min(.8,pitch+(e.clientY-drag.lastY)*.004));draw();e.preventDefault();}
    drag.lastX=e.clientX;drag.lastY=e.clientY;
  });
  function endDrag(){drag=null;resume();}
  stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);stage.addEventListener('lostpointercapture',endDrag);
  // Keyboard users can browse the complete set in a stable modal; no moving target required.
  const dialog=document.createElement('dialog');dialog.className='sphere-viewer';dialog.setAttribute('aria-label','生活照片与所属故事');
  dialog.innerHTML='<header><span class="sphere-photo-count"></span><button type="button" class="sphere-close" aria-label="关闭照片">关闭 ×</button></header><img alt=""><footer><div><span class="sphere-category"></span><p class="sphere-photo-caption"></p></div><a class="sphere-story-link"></a></footer><nav aria-label="浏览照片"><button type="button" data-step="-1">← 上一张</button><button type="button" data-step="1">下一张 →</button></nav>';
  document.body.append(dialog);let selected=0,photoFocus;
  function show(i){selected=(i+cards.length)%cards.length;const card=cards[selected];const img=dialog.querySelector('img');img.src=card.dataset.photoSrc;img.alt=card.querySelector('img').alt;dialog.querySelector('.sphere-photo-count').textContent=`生活片刻 ${selected+1} / ${cards.length}`;dialog.querySelector('.sphere-category').textContent=card.dataset.category;dialog.querySelector('.sphere-photo-caption').textContent=img.alt;const link=dialog.querySelector('a');link.href=card.dataset.destination;link.textContent='进入'+card.dataset.category+' ↗';}
  cards.forEach((card,i)=>card.addEventListener('click',e=>{if(moved){e.preventDefault();moved=false;return;}photoFocus=card;show(i);dialog.showModal();document.body.classList.add('photo-open');dialog.querySelector('.sphere-close').focus();}));
  dialog.querySelector('.sphere-close').addEventListener('click',()=>dialog.close());
  dialog.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>show(selected+Number(b.dataset.step))));
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(selected+(e.key==='ArrowRight'?1:-1));}});
  dialog.addEventListener('close',()=>{document.body.classList.remove('photo-open');dialog.querySelector('img').removeAttribute('src');photoFocus?.focus({preventScroll:true});resume();});
  stage.classList.add('is-orbit-ready');
  sync();
})();
