/* Physical books on a living surface; light orbits behind authentic photos. */
(() => {
 const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion:reduce)');
 document.addEventListener('visibilitychange',()=>root.classList.toggle('effects-hidden',document.hidden));
 const library=document.querySelector('#my-books');
 if(library){
  const water=document.createElement('canvas');water.className='living-water reading-water';water.dataset.waterScene='3';water.dataset.tone='midnight';water.setAttribute('aria-hidden','true');library.prepend(water);
  library.querySelectorAll('.signature-book').forEach((book,i)=>{
   const cover=book.querySelector('.signature-cover'),float=document.createElement('div');float.className='book-float';float.style.setProperty('--book-angle',[-12,8,-7,13,-9][i]+'deg');float.style.setProperty('--book-delay',(-i*1.37)+'s');
   cover.before(float);float.append(cover);const ripple=document.createElement('span');ripple.className='book-ripple';ripple.setAttribute('aria-hidden','true');float.prepend(ripple);
  });library.classList.add('floating-library');
  new IntersectionObserver(([e])=>library.classList.toggle('is-reading-visible',e.isIntersecting),{threshold:.05}).observe(library);
 }
 const stage=document.querySelector('.photo-sphere');if(!stage)return;
 const canvas=document.createElement('canvas');canvas.className='orbit-particles';canvas.setAttribute('aria-hidden','true');stage.before(canvas);const ctx=canvas.getContext('2d');if(!ctx)return;
 const toggle=document.querySelector('.sphere-toggle');let visible=false,frame=0,last=0,time=0,width=0,height=0;
 function allowed(){return visible&&!document.hidden&&root.dataset.motion==='on'&&!reduced.matches&&toggle?.getAttribute('aria-pressed')!=='true'&&!stage.matches(':hover,:focus-within')&&!document.querySelector('dialog[open]');}
 function draw(){ctx.clearRect(0,0,width,height);const cx=width/2,cy=height/2,r=Math.min(width,height)*.45;ctx.globalCompositeOperation='lighter';
  const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,r);glow.addColorStop(0,'#3baadf16');glow.addColorStop(.5,'#4585c611');glow.addColorStop(1,'#09121c00');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  for(let j=0;j<3;j++){ctx.save();ctx.translate(cx,cy);ctx.rotate([-.4,.7,1.5][j]+Math.sin(time*.16)*.08);ctx.scale(1,[.34,.6,.82][j]);ctx.beginPath();ctx.arc(0,0,r*(1+j*.07),0,Math.PI*2);ctx.strokeStyle=['#91dbef45','#deb98938','#8caeee30'][j];ctx.lineWidth=1.5;ctx.stroke();
   for(let i=0;i<30;i++){const angle=i/30*Math.PI*2+time*(.23+j*.13);const rad=r*(1+j*.07);const alpha=.2+.65*(Math.sin(i*2.3)+1)/2;ctx.beginPath();ctx.arc(0,0,rad,angle-.17,angle);ctx.strokeStyle=j===1?`rgba(232,181,119,${alpha})`:`rgba(113,207,247,${alpha})`;ctx.lineWidth=i%7===0?3:1.2;ctx.shadowBlur=17;ctx.shadowColor='#6ecaff';ctx.stroke();}const head=time*(.5+j*.18)+j*2;ctx.beginPath();ctx.arc(Math.cos(head)*r*(1+j*.07),Math.sin(head)*r*(1+j*.07),3.2,0,Math.PI*2);ctx.fillStyle=j===1?'#ffe0a9':'#b7efff';ctx.shadowBlur=25;ctx.fill();ctx.restore();}
  ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';
 }
 function tick(now){frame=0;if(!allowed())return;time+=Math.min(.05,(now-(last||now))/1000);last=now;draw();frame=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;if(allowed())frame=requestAnimationFrame(tick);else draw();}
 new ResizeObserver(()=>{width=stage.clientWidth;height=stage.clientHeight;const dpr=Math.min(devicePixelRatio||1,1.25);canvas.width=width*dpr;canvas.height=height*dpr;canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);draw();sync();}).observe(stage);
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();}).observe(stage);
 new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-motion']});new MutationObserver(sync).observe(toggle,{attributes:true,attributeFilter:['aria-pressed']});new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 ['pointerenter','pointerleave','focusin','focusout'].forEach(event=>stage.addEventListener(event,()=>requestAnimationFrame(sync)));document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
})();
