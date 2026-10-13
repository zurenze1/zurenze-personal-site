(() => {
 const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion:reduce)'),toggle=document.querySelector('.food-motion-toggle');if(!toggle)return;
 const feature=document.querySelector('.town-food-feature .town-photo>img');
 if(feature){const frame=document.createElement('div');frame.className='food-feature-motion food-motion';feature.before(frame);frame.append(feature);frame.insertAdjacentHTML('beforeend','<span class="food-steam" aria-hidden="true"><i></i><i></i><i></i></span>');}
 const items=[...document.querySelectorAll('.food-motion')],visible=new Set();let paused=false;
 function sync(){const enabled=root.dataset.motion==='on'&&!reduced.matches;toggle.disabled=!enabled;toggle.textContent=!enabled?'动态已关闭':paused?'继续美食动效 ↻':'暂停美食动效 Ⅱ';toggle.setAttribute('aria-pressed',String(paused));items.forEach(el=>el.classList.toggle('is-food-moving',enabled&&!paused&&!document.hidden&&visible.has(el)&&!document.querySelector('dialog[open]')));}
 const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target)});sync();},{threshold:.05});items.forEach(el=>observer.observe(el));toggle.addEventListener('click',()=>{paused=!paused;sync()});
 new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion']});document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);window.addEventListener('pageshow',sync);
 const dialog=document.createElement('dialog');dialog.className='food-viewer';dialog.setAttribute('aria-labelledby','food-viewer-title');dialog.innerHTML='<header><h3 id="food-viewer-title"></h3><button type="button" aria-label="关闭美食图片">关闭 ×</button></header><img alt=""><p></p>';document.body.append(dialog);let focus;
 document.querySelectorAll('.food-visual').forEach(button=>button.addEventListener('click',()=>{focus=button;dialog.querySelector('h3').textContent=button.dataset.foodTitle;dialog.querySelector('img').src=button.querySelector('img').src;dialog.querySelector('img').alt=button.querySelector('img').alt;dialog.querySelector('p').textContent=button.dataset.foodCredit;dialog.showModal();sync();}));
 const source=document.createElement('a');source.className='food-source';source.target='_blank';source.rel='noopener noreferrer';source.textContent='查看原始摄影来源 ↗';dialog.append(source);
 document.querySelectorAll('.food-visual').forEach(button=>button.addEventListener('click',()=>{source.hidden=!button.dataset.foodSource;if(button.dataset.foodSource)source.href=button.dataset.foodSource;else source.removeAttribute('href');}));
 dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{focus?.focus({preventScroll:true});sync()});sync();
})();
