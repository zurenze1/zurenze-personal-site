/* Accordion interaction for the six personal chapters. No runtime dependency. */
(() => {
  const gallery = document.querySelector('#my-route .theme-gallery');
  if (!gallery) return;
  const panels = [...gallery.querySelectorAll('.theme-panel')];
  const buttons = panels.map(panel => panel.querySelector('.theme-trigger'));
  let active = 0;
  const select = index => {
    active = index;
    panels.forEach((panel, i) => {
      const selected = i === active;
      panel.classList.toggle('is-active', selected);
      panel.style.setProperty('--panel-tilt', i < active ? '5deg' : '-5deg');
      buttons[i].setAttribute('aria-expanded', String(selected));
      panel.querySelector('.theme-detail').inert = !selected;
    });
  };
  gallery.dataset.enhanced = 'true';
  panels.forEach((panel, i) => {
    panel.addEventListener('pointerenter', event => {
      if (window.innerWidth <= 700 || event.pointerType !== 'mouse' || (gallery.contains(document.activeElement) && document.activeElement.matches(':focus-visible'))) return;
      select(i);
    });
    buttons[i].addEventListener('click', () => select(i));
    buttons[i].addEventListener('focus', () => {
      if (buttons[i].matches(':focus-visible')) select(i);
    });
    buttons[i].addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (i + 1) % panels.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (i + panels.length - 1) % panels.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = panels.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(next);
      buttons[next].focus({ preventScroll: true });
    });
  });
  select(0);
})();
