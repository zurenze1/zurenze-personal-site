(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let saved;
  try { saved = localStorage.getItem('zrz-motion'); } catch {}
  let motion = saved ? saved === 'on' : !reduced.matches;
  const setMotion = enabled => {
    motion = enabled;
    root.dataset.motion = enabled ? 'on' : 'off';
    document.querySelectorAll('.motion-switch').forEach(button => {
      button.textContent = enabled ? '动态：开启' : '动态：关闭';
      button.setAttribute('aria-pressed', String(enabled));
      button.setAttribute('aria-label', enabled ? '关闭页面动态效果' : '开启页面动态效果');
    });
  };
  const tools = document.createElement('div');
  tools.className = 'page-tools';
  tools.innerHTML = '<button class="motion-switch" type="button"></button><button class="back-to-top" type="button">回到页首 ↑</button>';
  document.querySelector('.site-footer')?.append(tools);
  setMotion(motion);
  document.querySelectorAll('.motion-switch').forEach(button => button.addEventListener('click', () => {
    setMotion(!motion);
    try { localStorage.setItem('zrz-motion', motion ? 'on' : 'off'); } catch {}
  }));
  reduced.addEventListener('change', event => { if (event.matches) setMotion(false); });
  tools.querySelector('.back-to-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'instant' });
    document.querySelector('.wordmark')?.focus({ preventScroll: true });
  });
  const suspend = () => { root.dataset.suspended = String(document.hidden); };
  document.addEventListener('visibilitychange', suspend);
  suspend();

  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let progressFrame;
  function updateProgress() {
    if (progressFrame) return;
    progressFrame = requestAnimationFrame(() => {
      const total = root.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${total > 0 ? Math.min(1, Math.max(0, scrollY / total)) : 0})`;
      progressFrame = null;
    });
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.07, rootMargin: '0px 0px 35px 0px' });
    document.querySelectorAll('main > section:not(.home-hero):not(.page-heading), .journey-entry, .photo-story').forEach(section => {
      // Deep links and content already above the fold must be immediately visible.
      if (section.getBoundingClientRect().top < innerHeight) return;
      section.classList.add('reveal-ready');
      observer.observe(section);
    });
  }

  const stage = document.querySelector('.orbit-stage');
  if (stage) {
    const cards = [...stage.querySelectorAll('[data-orbit]')];
    const story = stage.querySelector('.orbit-story');
    const content = {
      law: ['01 / 学习的起点', '先厘清，再判断。', '法学本科，在课堂与球场之间，学习思考，也学习配合。', 'journey.html#journey-law', '走进我的大学时光'],
      military: ['02 / 两年军旅', '责任，落在行动里。', '赴重庆服役，参加山火扑救。那些现场，成为我的底色。', 'journey.html#journey-military', '读这段军旅经历'],
      work: ['03 / 工作中的我', '把原则，带进日常。', '走进企业监察，在具体的问题里积累经验与判断。', 'journey.html#journey-work', '看看我的工作经历'],
      life: ['04 / 工作之外', '好奇，始终在场。', '读书、跑步、听琴。喜欢苏轼，也在探索 IP＋AI。', 'notes.html', '走进我的阅读与生活']
    };
    function choose(card, focus = false) {
      const data = content[card.dataset.orbit];
      cards.forEach(button => {
        const active = button === card;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      });
      story.setAttribute('aria-labelledby', card.id);
      story.querySelector('.orbit-kicker').textContent = data[0];
      story.querySelector('h2').textContent = data[1];
      story.querySelector('.orbit-description').textContent = data[2];
      story.querySelector('a').href = data[3];
      story.querySelector('a').textContent = data[4];
      story.classList.remove('is-changing');
      if (motion) requestAnimationFrame(() => story.classList.add('is-changing'));
      if (focus) card.focus({ preventScroll: true });
    }
    cards.forEach((card, i) => {
      card.addEventListener('click', () => choose(card));
      card.addEventListener('keydown', event => {
        if (!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : (i + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1) + cards.length) % cards.length;
        choose(cards[next], true);
      });
    });
    let pointerFrame;
    stage.addEventListener('pointermove', event => {
      if (!motion || event.pointerType !== 'mouse' || pointerFrame) return;
      const { clientX, clientY } = event;
      pointerFrame = requestAnimationFrame(() => {
        const bounds = stage.getBoundingClientRect();
        stage.style.setProperty('--mx', ((clientX - bounds.left) / bounds.width - .5).toFixed(3));
        stage.style.setProperty('--my', ((clientY - bounds.top) / bounds.height - .5).toFixed(3));
        pointerFrame = null;
      });
    });
    stage.addEventListener('pointerleave', () => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = null;
      stage.style.setProperty('--mx', '0');
      stage.style.setProperty('--my', '0');
    });
  }

  // One display location per source photo; the dialog is an on-demand larger view.
  const photos = [...document.querySelectorAll('main figure img')].filter(img => !img.closest('a, button'));
  if (!photos.length || typeof HTMLDialogElement === 'undefined') return;
  const dialog = document.createElement('dialog');
  dialog.className = 'photo-viewer';
  dialog.setAttribute('aria-label', '照片查看器');
  dialog.innerHTML = '<div class="photo-viewer-header"><span class="photo-viewer-count"></span><button class="photo-viewer-close" type="button" aria-label="关闭照片">×</button></div><img class="photo-viewer-image" alt=""><p class="photo-viewer-caption"></p><div class="photo-viewer-nav"><button type="button" data-photo-step="-1">← 上一张</button><button type="button" data-photo-step="1">下一张 →</button></div>';
  document.body.append(dialog);
  let photoIndex = 0;
  let lastFocus;
  const fullImage = dialog.querySelector('.photo-viewer-image');
  function showPhoto(index) {
    photoIndex = (index + photos.length) % photos.length;
    const photo = photos[photoIndex];
    fullImage.src = photo.currentSrc || photo.src;
    fullImage.alt = photo.alt;
    dialog.querySelector('.photo-viewer-count').textContent = `照片 · ${photoIndex + 1} / ${photos.length}`;
    dialog.querySelector('.photo-viewer-caption').textContent = photo.closest('figure')?.querySelector('figcaption')?.textContent.trim() || photo.alt;
  }
  photos.forEach((photo, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'image-zoom-button';
    button.setAttribute('aria-label', '放大照片：' + photo.alt);
    photo.replaceWith(button);
    button.append(photo);
    button.addEventListener('click', () => {
      lastFocus = button;
      showPhoto(i);
      dialog.showModal();
      document.body.classList.add('photo-open');
      dialog.querySelector('.photo-viewer-close').focus();
    });
  });
  dialog.querySelector('.photo-viewer-nav').hidden = photos.length < 2;
  dialog.querySelector('.photo-viewer-close').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-photo-step]').forEach(button => button.addEventListener('click', () => showPhoto(photoIndex + Number(button.dataset.photoStep))));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('click', event => {
    const b = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('photo-open');
    fullImage.removeAttribute('src');
    lastFocus?.focus({ preventScroll: true });
  });
})();
