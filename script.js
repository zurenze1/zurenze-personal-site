const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');
let previousFocus;
function setMenu(open) {
  if (open) previousFocus = document.activeElement;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  navigation.classList.toggle('open', open);
  navigation.inert = !open;
  document.body.classList.toggle('menu-open', open);
  document.querySelector('main').inert = open;
  document.querySelector('footer').inert = open;
  document.querySelector('.wordmark').inert = open;
  if (open) navigation.querySelector('a').focus();
  else previousFocus?.focus();
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', event => {
  if (toggle.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') setMenu(false);
  if (event.key === 'Tab') {
    const items = [toggle, ...navigation.querySelectorAll('a')];
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
document.querySelectorAll('[data-year]').forEach(item => item.textContent = new Date().getFullYear());

// Each book keeps its own URL and remains readable when JavaScript is unavailable.
const bookLinks = [...document.querySelectorAll('[data-book-target]')];
const bookDetails = [...document.querySelectorAll('.book-detail')];
const bookTools = document.querySelector('.book-tools');
let selectedBookIndex = 0;
function selectBook(id, focusHeading = false) {
  const selected = bookDetails.find(book => book.id === id);
  if (!selected) return;
  selectedBookIndex = bookDetails.indexOf(selected);
  bookDetails.forEach(book => { book.hidden = book !== selected; });
  bookLinks.forEach(link => {
    const active = link.dataset.bookTarget === id;
    link.classList.toggle('selected', active);
    if (active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  if (bookTools) bookTools.querySelector('.book-position').textContent = `书摘 ${String(selectedBookIndex + 1).padStart(2, '0')} / ${String(bookDetails.length).padStart(2, '0')}`;
  if (focusHeading) selected.querySelector('h3').focus({ preventScroll: true });
}
function navigateBook(id) {
  selectBook(id, true);
  if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
  document.querySelector('.book-reading').scrollIntoView({ block: 'start', behavior: 'instant' });
}
if (bookDetails.length) {
  const initialBook = bookDetails.find(book => '#' + book.id === location.hash);
  selectBook(initialBook?.id || bookDetails[0].id);
  bookLinks.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    navigateBook(link.dataset.bookTarget);
  }));
  if (bookTools) {
    bookTools.hidden = false;
    bookTools.querySelectorAll('[data-book-step]').forEach(button => button.addEventListener('click', () => {
      const next = (selectedBookIndex + Number(button.dataset.bookStep) + bookDetails.length) % bookDetails.length;
      navigateBook(bookDetails[next].id);
    }));
  }
  window.addEventListener('popstate', () => selectBook(location.hash.slice(1), true));
  window.addEventListener('hashchange', () => selectBook(location.hash.slice(1), true));
}

// Restore the initial anchor after the book and experience panels settle their layout.
if (location.hash) {
  const restoreInitialAnchor = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    const anchor = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const destination = anchor?.classList.contains('book-detail') ? document.querySelector('.book-reading') : anchor;
    destination?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restoreInitialAnchor, { once: true });
  else restoreInitialAnchor();
}
