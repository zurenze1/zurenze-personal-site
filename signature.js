// Scoped homepage interactions; the links and content also work without JavaScript.
(() => {
  const links = [...document.querySelectorAll('[data-case-target]')];
  const cases = [...document.querySelectorAll('.signature-case')];
  if (links.length && cases.length) {
    const nav = links[0].parentElement;
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', '选择一段经历');
    links.forEach(link => {
      link.id = 'tab-' + link.dataset.caseTarget;
      link.setAttribute('role', 'tab');
      link.setAttribute('aria-controls', link.dataset.caseTarget);
    });
    cases.forEach(panel => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'tab-' + panel.id);
      panel.tabIndex = 0;
    });
    function choose(id, focus = false, updateUrl = false) {
      const index = cases.findIndex(panel => panel.id === id);
      if (index < 0) return;
      cases.forEach((panel, i) => { panel.hidden = i !== index; });
      links.forEach((link, i) => {
        link.setAttribute('aria-selected', String(i === index));
        link.tabIndex = i === index ? 0 : -1;
      });
      if (focus) links[index].focus({ preventScroll: true });
      if (updateUrl && location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    }
    links.forEach((link, index) => {
      link.addEventListener('click', event => { event.preventDefault(); choose(link.dataset.caseTarget, false, true); });
      link.addEventListener('keydown', event => {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length;
        choose(links[next].dataset.caseTarget, true, true);
      });
    });
    const initial = cases.some(panel => '#' + panel.id === location.hash) ? location.hash.slice(1) : 'case-military';
    choose(initial);
    window.addEventListener('popstate', () => choose(location.hash.slice(1) || 'case-military'));
    window.addEventListener('hashchange', () => choose(location.hash.slice(1)));
  }
  const controls = document.querySelector('.shelf-controls');
  const books = [...document.querySelectorAll('.signature-book')];
  if (controls && books.length) {
    controls.hidden = false;
    const filters = [...controls.querySelectorAll('[data-shelf-filter]')];
    filters.forEach(button => button.addEventListener('click', () => {
      filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      books.forEach(book => { book.hidden = button.dataset.shelfFilter !== 'all' && book.dataset.shelfTopic !== button.dataset.shelfFilter; });
    }));
  }
})();
