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

const musicTracks = {
  canon: { title: '卡农', performer: '钢琴教学室', bvid: 'BV1K4411N7Nb' },
  flower: { title: 'Flower Dance · 花之舞', performer: 'up初相识', bvid: 'BV1Q4411h7Xk' }
};
const player = document.querySelector('.music-player');
if (player) {
  const stage = player.querySelector('.player-stage');
  const idleContent = stage.firstElementChild.cloneNode(true);
  const status = player.querySelector('.player-status');
  const original = player.querySelector('.player-original');
  const close = player.querySelector('.player-close');
  const listenButtons = [...document.querySelectorAll('[data-music]')];
  let activeTrack;
  listenButtons.forEach(button => button.addEventListener('click', () => {
    const track = musicTracks[button.dataset.music];
    if (!track) return;
    if (activeTrack === button.dataset.music) {
      stage.querySelector('iframe')?.focus();
      return;
    }
    activeTrack = button.dataset.music;
    const frame = document.createElement('iframe');
    frame.src = `https://player.bilibili.com/player.html?bvid=${track.bvid}&p=1&autoplay=1&muted=0&danmaku=0`;
    frame.title = `${track.title} · ${track.performer}钢琴演奏`;
    frame.allow = 'autoplay; fullscreen; picture-in-picture';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    stage.replaceChildren(frame);
    status.textContent = `${track.title} · ${track.performer}｜已打开演奏，若未响起，请点播放器里的播放键。`;
    original.href = `https://www.bilibili.com/video/${track.bvid}/`;
    original.hidden = false;
    close.hidden = false;
    player.classList.add('is-active');
    listenButtons.forEach(item => {
      const active = item === button;
      item.setAttribute('aria-pressed', String(active));
      item.innerHTML = active ? '<span aria-hidden="true">♫</span> 已选这首' : '<span aria-hidden="true">▶</span> 点击试听';
    });
    if (window.matchMedia('(max-width: 800px)').matches) {
      player.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }));
  close.addEventListener('click', () => {
    const prior = listenButtons.find(button => button.dataset.music === activeTrack);
    stage.replaceChildren(idleContent.cloneNode(true));
    activeTrack = undefined;
    player.classList.remove('is-active');
    original.hidden = true;
    close.hidden = true;
    status.textContent = '音乐已停止。选一首，再听一会儿。';
    listenButtons.forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = '<span aria-hidden="true">▶</span> 点击试听';
    });
    prior?.focus();
  });
}
