(() => {
  const root = document.documentElement;
  // Real page content enters directly on both home and about, on every visit.
  const replay = document.querySelector('.arrival-replay');
  const hero = document.querySelector('.entry-scene');
  if (!replay || !hero) return;
  let timer;
  let skip;
  let waitingForPhoto = true;
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const allowed = () => root.dataset.motion === 'on' && !prefersReduced.matches;

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
    waitingForPhoto = false;
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
    timer = setTimeout(finish, 3200);
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
  if (!location.hash && allowed()) {
    // Let a cached or quickly loaded photo appear before the text sequence.
    const photo = hero.querySelector('.entry-portrait img');
    const ready = photo?.decode?.().catch(() => {});
    Promise.race([ready, new Promise(resolve => setTimeout(resolve, 900))]).then(() => {
      if (!waitingForPhoto) return;
      if (scrollY < 80 && !document.hidden) play(); else finish();
    });
  } else finish();
})();
