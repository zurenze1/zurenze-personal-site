(() => {
  const root = document.documentElement;
  // A short, non-blocking greeting. Content never depends on the animation ending.
  const replay = document.querySelector('.arrival-replay');
  if (!replay) return;
  let curtain, timer, observer;
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const allowed = () => root.dataset.motion === 'on' && !prefersReduced.matches;
  function finish() {
    clearTimeout(timer);
    const returnFocus = curtain?.contains(document.activeElement);
    curtain?.remove();
    curtain = null;
    root.classList.remove('is-arriving');
    if (returnFocus) replay.focus({preventScroll:true});
  }
  function play() {
    finish();
    if (!allowed()) return;
    curtain = document.createElement('div');
    curtain.className = 'arrival-curtain';
    curtain.innerHTML = '<div class="arrival-title" aria-hidden="true"><span>贵阳出发 · 一路行来</span><strong>祖仁泽</strong><p>很高兴，在这里遇见你。</p><i></i></div><button class="arrival-skip" type="button">跳过入场 ↗</button>';
    curtain.querySelector('button').addEventListener('click', finish);
    document.body.append(curtain);
    root.classList.add('is-arriving');
    timer = setTimeout(finish, 1750);
  }
  function sync() {
    replay.hidden = !allowed();
    if (!allowed()) finish();
  }
  observer = new MutationObserver(sync);
  observer.observe(root, {attributes:true, attributeFilter:['data-motion']});
  prefersReduced.addEventListener('change', sync);
  replay.addEventListener('click', () => {
    window.scrollTo({top:0,behavior:'instant'});
    play();
  });
  document.addEventListener('keydown', event => { if(event.key==='Escape') finish(); });
  window.addEventListener('pagehide', finish);
  sync();
  let seen = false;
  try { seen = sessionStorage.getItem('zrz-arrival-v21') === 'seen'; } catch {}
  if (!seen && !location.hash && allowed()) {
    try { sessionStorage.setItem('zrz-arrival-v21','seen'); } catch {}
    play();
  }
})();
