/* One continuous current drives the surface, buoyancy and surrounding islands. */
(() => {
 const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const current=window.ZRZCurrent={time:0,sample(x,y,t){const a=x*.85+y*.55-t*.65,b=x*1.55-y*.9-t*.42;return{h:Math.sin(a)*.13+Math.sin(b)*.055,dx:Math.cos(a)*.1105+Math.cos(b)*.08525,dy:Math.cos(a)*.0715-Math.cos(b)*.0495};}};
 const items=[],library=document.querySelector('#my-books');let frame=0,last=0;
 function water(parent,cls){const canvas=document.createElement('canvas');canvas.className='living-water '+cls;canvas.dataset.waterScene=cls==='memory-water'?'8':'7';canvas.dataset.tone='midnight';canvas.setAttribute('aria-hidden','true');parent.prepend(canvas);return canvas;}
 if(library){
  water(library,'reading-water');library.classList.add('floating-library');
  library.querySelectorAll('.signature-book').forEach((book,i)=>{
   const cover=book.querySelector('.signature-cover'),float=document.createElement('div');float.className='book-float';float.style.setProperty('--book-angle',[-9,6,-5,9,-7][i]+'deg');cover.before(float);float.append(cover);
   const reflection=cover.cloneNode(true);reflection.className+=' book-reflection';reflection.setAttribute('aria-hidden','true');float.prepend(reflection);
   const ripple=document.createElement('span');ripple.className='book-ripple';ripple.setAttribute('aria-hidden','true');float.prepend(ripple);
   items.push({el:float,host:book,type:'book',section:library,i,visible:false,x:i,y:0});
  });
 }
 const field=document.querySelector('.photo-sphere');if(field){water(field,'memory-water');document.querySelector('.orbit-section')?.classList.add('water-memories');}
 document.querySelectorAll('.home-films .film-card,.story-destinations>a,.home-listening,.culture-editorial,.home-life,.douyin-showcase,.home-contact').forEach((el,i)=>{el.classList.add('float-island');items.push({el,host:el,type:'island',section:el.parentElement,i,visible:false,x:i,y:i*.4});});
 function layout(){for(const item of items){const r=item.el.getBoundingClientRect(),s=item.section.getBoundingClientRect();if(item.type==='book'){item.x=((r.left-s.left+r.width/2)/s.height-s.width/s.height/2)*9;item.y=(.5-(r.top-s.top+r.height*.55)/s.height)*9;}}}
 function apply(item){if(!item.visible)return;const el=item.el;if(item.host.matches(':hover,:focus-within'))return;const p=current.sample(item.x,item.y,current.time);
  if(item.type==='book'){el.style.setProperty('--heave',(p.h*22).toFixed(2)+'px');el.style.setProperty('--water-pitch',(p.dy*14).toFixed(2)+'deg');el.style.setProperty('--water-roll',(p.dx*12).toFixed(2)+'deg');el.style.setProperty('--drift',(Math.sin(current.time*.32+item.x)*4).toFixed(2)+'px');}
  else{el.style.setProperty('--island-y',(p.h*14).toFixed(2)+'px');el.style.setProperty('--island-roll',(p.dx*.6).toFixed(3)+'deg');}
 }
 function allowed(){return !document.hidden&&root.dataset.motion==='on'&&!reduced.matches&&!root.classList.contains('portal-active')&&!document.querySelector('dialog[open]');}
 function tick(now){frame=0;if(!allowed())return;if(now-last>=32){current.time+=Math.min(.06,(now-(last||now))/1000);last=now;items.forEach(apply);}frame=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;if(allowed())frame=requestAnimationFrame(tick);}
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){for(const item of items)if(item.el===entry.target)item.visible=entry.isIntersecting;}sync();},{rootMargin:'50px'});items.forEach(i=>observer.observe(i.el));
 new ResizeObserver(layout).observe(document.body);new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion','class']});new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));window.addEventListener('pageshow',sync);layout();sync();
})();
