(() => {
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const status = button.closest('.contact-methods')?.nextElementSibling;
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = '已复制 ✓';
        if (status) status.textContent = '微信号已复制，可以到微信中搜索。';
      } catch {
        if (status) status.textContent = '请长按或选中上方微信号 jzzt779 复制。';
      }
    });
  });
  const mosaic = document.querySelector('.hero-mosaic');
  if (!mosaic) return;
  let frame;
  mosaic.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || document.documentElement.dataset.motion !== 'on' || frame) return;
    const {clientX,clientY} = event;
    frame=requestAnimationFrame(() => {
      const box=mosaic.getBoundingClientRect();
      mosaic.style.setProperty('--mx', ((clientX-box.left)/box.width-.5).toFixed(3));
      mosaic.style.setProperty('--my', ((clientY-box.top)/box.height-.5).toFixed(3));
      frame=null;
    });
  });
  mosaic.addEventListener('pointerleave', () => {
    if (frame) cancelAnimationFrame(frame);
    frame=null;
    mosaic.style.setProperty('--mx','0');mosaic.style.setProperty('--my','0');
  });
})();
