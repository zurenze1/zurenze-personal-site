(() => {
 const hero=document.querySelector('.poster-hero');if(!hero)return;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');let frame=0;
 hero.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||reduced.matches||document.documentElement.dataset.motion==='off'||innerWidth<1100)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const rect=hero.getBoundingClientRect();hero.style.setProperty('--poster-x',`${(event.clientX/innerWidth-.5)*-10}px`);hero.style.setProperty('--poster-y',`${((event.clientY-rect.top)/rect.height-.5)*-7}px`);});});
 hero.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);hero.style.setProperty('--poster-x','0px');hero.style.setProperty('--poster-y','0px');});
})();

/* Proposals are URL-selected only; viewing one never changes the public default. */
(() => {
 const params=new URLSearchParams(location.search),variant=params.get('poster');
 const variants={ember:{title:'向山海，<br><span>向自己。</span>',line:'有锋芒，也有来处。',name:'01 / 赤焰山海',image:'assets/photos/travel/travel-red.jpg'},jade:{title:'心有山海。<br><span>步履不停。</span>',line:'行过的路，成为自己的底色。',name:'02 / 玄青电影',image:'assets/photos/travel/travel-red.jpg'},tide:{title:'向海而行，<br><span>自由生长。</span>',line:'带着好奇，走向更远的地方。',name:'03 / 蓝调远行',image:'assets/photos/seaside/coastal-rocks.jpg'}};
 if(!variants[variant])return;
 const data=variants[variant],hero=document.querySelector('.poster-hero');
 document.body.dataset.poster=variant;
 hero.querySelector('h1').innerHTML=data.title;
 hero.querySelector('.poster-kicker span').textContent=data.line;
 hero.querySelector('.poster-visual img').src=data.image;
 hero.querySelector('.poster-visual img').alt=variant==='tide'?'祖仁泽在海边的本人原照':'祖仁泽外出旅行时的本人原照';
 const title=document.createElement('div');title.className='poster-display-type';title.setAttribute('aria-hidden','true');title.innerHTML=variant==='jade'?'仁<br>泽':variant==='tide'?'STAY<br>CURIOUS.':'山海之间';hero.prepend(title);
 const stamp=document.createElement('div');stamp.className='poster-stamp';stamp.innerHTML=variant==='jade'?'真实 / 在场<br>ZU RENZE':variant==='tide'?'LIFE, IN MOTION.<br>一路有光':'贵阳出发<br>山海为伴';hero.append(stamp);
 if(params.has('preview')){
  const bar=document.createElement('nav');bar.className='poster-preview-bar';bar.setAttribute('aria-label','海报方案切换');bar.innerHTML=`<a href="poster-preview.html">← 三版对比</a><span>${data.name}</span><div>${Object.entries(variants).map(([id,item])=>`<a href="?poster=${id}&preview=1" ${id===variant?'aria-current="page"':''}>${item.name.slice(0,2)}</a>`).join('')}</div>`;document.body.prepend(bar);
 }
})();
