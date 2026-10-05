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
