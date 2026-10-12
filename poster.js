(() => {
 const hero=document.querySelector('.poster-hero');if(!hero)return;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');let frame=0;
 hero.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||reduced.matches||document.documentElement.dataset.motion==='off'||innerWidth<1100)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const rect=hero.getBoundingClientRect();hero.style.setProperty('--poster-x',`${(event.clientX/innerWidth-.5)*-10}px`);hero.style.setProperty('--poster-y',`${((event.clientY-rect.top)/rect.height-.5)*-7}px`);});});
 hero.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);hero.style.setProperty('--poster-x','0px');hero.style.setProperty('--poster-y','0px');});
})();
