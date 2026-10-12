(() => {
  const root = document.documentElement;
  // The homepage itself enters in layers; no full-screen gate or video download.
  const replay = document.querySelector('.arrival-replay');
  const hero = document.querySelector('.home-hero');
  if (!replay || !hero) return;
  let timer;
  let skip;
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const allowed = () => root.dataset.motion === 'on' && !prefersReduced.matches;
  const storageKey = 'zrz-arrival-cinematic-v23';

  document.querySelectorAll('.arrival-line').forEach(line => {
    const words = [...line.textContent];
    line.textContent = '';
    words.forEach((letter, index) => {
      const character = document.createElement('i');
      character.textContent = letter;
      character.style.setProperty('--letter', index);
      line.append(character);
    });
  });

  function finish() {
    clearTimeout(timer);
    const returnFocus = skip === document.activeElement;
    skip?.remove();
    skip = null;
    root.classList.remove('is-arriving', 'arrival-pending');
    if (returnFocus) replay.focus({preventScroll:true});
  }
  function play() {
    finish();
    if (!allowed()) return;
    // Force a new animation timeline on replay, without moving or cloning content.
    void hero.offsetWidth;
    root.classList.add('is-arriving');
    skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'cinematic-skip';
    skip.textContent = '跳过入场 ↗';
    skip.addEventListener('click', finish);
    hero.append(skip);
    timer = setTimeout(finish, 2200);
  }
  function sync() {
    replay.hidden = !allowed();
    if (!allowed()) finish();
  }
  const observer = new MutationObserver(sync);
  observer.observe(root, {attributes:true, attributeFilter:['data-motion']});
  prefersReduced.addEventListener('change', sync);
  replay.addEventListener('click', () => {
    window.scrollTo({top:0,behavior:'instant'});
    play();
  });
  document.addEventListener('keydown', event => { if(event.key==='Escape') finish(); });
  // Interaction always wins over a decorative entrance.
  hero.addEventListener('pointerdown', event => {
    if (event.target.closest('a, button')) finish();
  }, {capture:true});
  hero.addEventListener('focusin', event => {
    if (event.target !== skip) finish();
  });
  window.addEventListener('wheel', finish, {passive:true});
  window.addEventListener('touchmove', finish, {passive:true});
  document.addEventListener('visibilitychange', () => { if(document.hidden) finish(); });
  window.addEventListener('pagehide', finish);
  sync();
  let seen = false;
  try { seen = sessionStorage.getItem(storageKey) === 'seen'; } catch {}
  if (!seen && !location.hash && allowed()) {
    try { sessionStorage.setItem(storageKey,'seen'); } catch {}
    play();
  } else finish();
})();
