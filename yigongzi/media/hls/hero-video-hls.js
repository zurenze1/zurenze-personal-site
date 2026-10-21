/* Self-hosted HLS adapter for the existing heroVideo element. */
(() => {
  'use strict';
  const video = document.getElementById('heroVideo');
  if (!video || video.dataset.hlsInitialized) return;
  const script = document.currentScript;
  const source = video.dataset.hlsSrc || (script && script.src
    ? new URL('stream.m3u8', script.src).href : 'media/hls/stream.m3u8');
  const status = document.getElementById('heroVideoStatus');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userRequestedPause = false;
  document.getElementById('heroVideoPlay')?.addEventListener('click', () => {
    // Existing controls run first and immediately update video.paused.
    userRequestedPause = video.paused;
  });
  const ready = () => {
    const rect = video.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight && video.autoplay && !userRequestedPause && !reduced.matches &&
        !document.body.classList.contains('paused')) {
      video.play().catch(() => { /* Existing play/status UI handles user playback. */ });
    }
  };
  const failed = detail => {
    if (status) {
      status.textContent = '视频暂时无法播放，请稍后重试';
      status.hidden = false;
    }
    video.dispatchEvent(new CustomEvent('hlsplaybackerror', {detail}));
  };
  video.dataset.hlsInitialized = 'true';
  // The HTML must already have removed its original MP4 src before parsing.
  video.removeAttribute('src');
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.addEventListener('loadedmetadata', ready, {once: true});
    video.src = source;
    video.load();
    video.dataset.hlsEngine = 'native';
    return;
  }
  if (!window.Hls || !window.Hls.isSupported()) {
    failed({type: 'unsupported', source});
    return;
  }
  // No remote worker or CDN dependency; the source is already fragmented MP4.
  const hls = new window.Hls({enableWorker: false, backBufferLength: 30});
  video.hlsInstance = hls;
  video.dataset.hlsEngine = 'hls.js';
  hls.on(window.Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(source));
  hls.on(window.Hls.Events.MANIFEST_PARSED, ready);
  hls.on(window.Hls.Events.ERROR, (_event, data) => {
    if (data.fatal) failed({type: data.type, details: data.details});
  });
  hls.attachMedia(video);
  // Keep this same element: loop, muted, play/pause and currentTime seek stay native.
})();
