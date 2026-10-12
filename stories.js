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
  let yaw=0,pitch=-.07,paused=false,focused=false,visible=true,drag=null,moved=false,frame=0,last=0,size=500;
  const motion=()=>root.dataset.motion==='on'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Closed streamlines keep the memories close together; every photograph comes forward in turn.
  const held=new Set();
  function draw(){
    const height=stage.clientHeight,cardWidth=Math.min(112,Math.max(68,size*.175));
    stage.style.setProperty('--flow-card-width',cardWidth+'px');
    cards.forEach((card,i)=>{
      if(held.has(card))return;
      const lane=i%3,phase=i*2.399963+ yaw*(.14+lane*.012);
      const flow=phase+.16*Math.sin(phase*2+lane);
      const reach=.56+lane*.20,rx=(size/2-cardWidth*.75-16)*reach,ry=(height/2-cardWidth*.84-23)*reach;
      const x=size/2+Math.cos(flow)*rx+Math.sin(flow*2+lane)*size*.025;
      const y=height/2+Math.sin(flow)*ry+Math.sin(flow*3+lane)*9+pitch*18;
      const depth=(Math.sin(flow)+1)/2,scale=.64+depth*.4;
      const sample=window.ZRZCurrent?.sample(x/90,y/90,yaw)||{h:0,dx:0};
      const angle=Math.sin(flow+.7)*13+Math.sin(yaw*.6+i)*4+sample.dx*10;
      card.style.left=x.toFixed(2)+'px';card.style.top=(y+sample.h*15).toFixed(2)+'px';
      card.style.transform='translate(-50%,-50%) scale('+scale.toFixed(3)+') perspective(650px) rotateX('+(42+sample.h*12).toFixed(2)+'deg) rotateZ('+angle.toFixed(2)+'deg)';
      card.style.opacity='1';card.style.zIndex=String(Math.round(10+depth*100));
      card.style.filter='brightness('+(.78+depth*.22).toFixed(3)+')';
    });
  }
  function active(){return motion()&&!root.classList.contains('is-arriving')&&!root.classList.contains('arrival-pending')&&!paused&&!focused&&!drag&&visible&&!document.hidden&&!document.querySelector('dialog[open]');}
  function tick(time){frame=0;const dt=Math.min(50,time-(last||time));last=time;if(active()){yaw+=dt*.001;draw();frame=requestAnimationFrame(tick);}}
  function resume(){last=0;if(active()&&!frame)frame=requestAnimationFrame(tick);}
  function sync(){toggle.disabled=!motion();toggle.textContent=!motion()?'动态已关闭':paused?'继续漂流 ↻':'暂停漂流 Ⅱ';toggle.setAttribute('aria-pressed',String(paused));draw();resume();}
  new ResizeObserver(entries=>{size=entries[0].contentRect.width;draw();}).observe(stage);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();},{threshold:.05}).observe(stage);
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion']});
  new MutationObserver(resume).observe(root,{attributes:true,attributeFilter:['class']});
  // Pause for dialogs, keyboard focus and hidden tabs; hovering holds only the selected photo.
  new MutationObserver(resume).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
  document.addEventListener('visibilitychange',resume);
  cards.forEach(card=>{
    card.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){held.add(card);card.style.zIndex='150';}});
    card.addEventListener('pointerleave',()=>{held.delete(card);});
  });
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
  stage.classList.add('is-orbit-ready','is-flow-field');
  sync();
})();
