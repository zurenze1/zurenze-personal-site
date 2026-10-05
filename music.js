(() => {
  const background = document.querySelector('#ambient-audio');
  const dock = document.querySelector('.sound-dock');
  if (!background || !dock) return;
  const toggle = dock.querySelector('.ambient-toggle');
  const label = dock.querySelector('.ambient-label');
  const volume = dock.querySelector('.ambient-volume');
  const read = (key, fallback) => {
    try { return sessionStorage.getItem(key) ?? fallback; } catch { return fallback; }
  };
  const save = (key, value) => {
    try { sessionStorage.setItem(key, String(value)); } catch { /* Playback works without storage. */ }
  };
  let backgroundWanted = read('ambient-enabled', 'true') === 'true';
  let waitingForGesture = false;
  let activeTrack = null;
  const introduction = document.querySelector('#intro-video');
  let introductionPlaying = false;
  let pageLeaving = false;
  let audioContext, gain;
  const savedVolume = Number(read('ambient-volume', '12'));
  volume.value = Number.isFinite(savedVolume) ? Math.max(0, Math.min(30, savedVolume)) : 12;
  // GainNode keeps the background quiet on mobile browsers that ignore audio.volume.
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) {
      audioContext = new Context();
      gain = audioContext.createGain();
      audioContext.createMediaElementSource(background).connect(gain);
      gain.connect(audioContext.destination);
    }
  } catch { audioContext = null; gain = null; }
  function setVolume() {
    const level = Number(volume.value) / 100;
    if (gain) gain.gain.setValueAtTime(level, audioContext.currentTime);
    else background.volume = level;
    save('ambient-volume', volume.value);
    volume.setAttribute('aria-valuetext', `${volume.value}%`);
  }
  setVolume();
  function renderBackground() {
    const playing = !background.paused && (!audioContext || audioContext.state === 'running');
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? '暂停背景轻音乐' : '开启背景轻音乐');
    dock.classList.toggle('is-playing', playing);
    label.textContent = playing ? '轻音乐 · 正在轻声播放' : activeTrack || introductionPlaying ? '轻音乐 · 已暂停' : backgroundWanted ? '轻音乐 · 点击开启' : '轻音乐 · 已关闭';
  }
  async function startBackground() {
    if (!backgroundWanted || activeTrack || introductionPlaying || pageLeaving) return;
    waitingForGesture = false;
    try {
      await Promise.all([audioContext?.resume(), background.play()]);
      if (!backgroundWanted || activeTrack || introductionPlaying || pageLeaving) background.pause();
      renderBackground();
    } catch (error) {
      waitingForGesture = error.name === 'NotAllowedError' || audioContext?.state === 'suspended';
      renderBackground();
      if (!waitingForGesture) label.textContent = '轻音乐 · 点此重试';
    }
  }
  function restorePosition() {
    const position = Number(read('ambient-position', '0'));
    if (Number.isFinite(position) && position > 0 && position < background.duration) background.currentTime = position;
  }
  if (background.readyState >= 1) restorePosition();
  else background.addEventListener('loadedmetadata', restorePosition, { once: true });
  background.addEventListener('play', renderBackground);
  background.addEventListener('pause', renderBackground);
  background.addEventListener('error', () => { waitingForGesture = false; label.textContent = '轻音乐 · 暂时无法加载'; });
  volume.addEventListener('input', setVolume);
  document.addEventListener('click', event => {
    if (waitingForGesture && backgroundWanted && !activeTrack && !event.target.closest('.sound-dock, .music-section, .intro-video-section')) startBackground();
  });
  document.addEventListener('keydown', event => {
    if (waitingForGesture && backgroundWanted && !activeTrack && ['Enter', ' '].includes(event.key) && !event.target.closest('.sound-dock, .music-section, .intro-video-section')) startBackground();
  });
  window.addEventListener('pagehide', () => {
    pageLeaving = true;
    save('ambient-position', background.currentTime);
    pauseIntroduction();
    background.pause();
    song?.pause();
    widget?.pause();
  });
  window.addEventListener('pageshow', event => {
    pageLeaving = false;
    if (event.persisted) startBackground();
  });

  const player = document.querySelector('.music-player');
  const song = document.querySelector('#song-audio');
  const frame = document.querySelector('#flower-audio');
  const flowerContainer = document.querySelector('.flower-widget');
  const buttons = [...document.querySelectorAll('[data-music]')];
  const status = player?.querySelector('.player-status');
  const title = player?.querySelector('.audio-title');
  const close = player?.querySelector('.player-close');
  const original = player?.querySelector('.player-original');
  let widget, widgetReady = false, flowerRequested = false, flowerTimer;
  let songPlaying = false, flowerPlaying = false;
  const tracks = { canon: '卡农', flower: 'Flower Dance · 花之舞' };
  function renderTracks() {
    buttons.forEach(button => {
      const id = button.dataset.music;
      const playing = activeTrack === id && (id === 'canon' ? songPlaying : flowerPlaying);
      button.setAttribute('aria-pressed', String(playing));
      button.innerHTML = `<span aria-hidden="true">${playing ? 'Ⅱ' : '▶'}</span> ${playing ? '暂停' : '听'}${id === 'canon' ? '卡农' : ' Flower Dance'}`;
    });
    player?.classList.toggle('is-active', Boolean(activeTrack));
    renderBackground();
  }
  function stopTracks(resume = false) {
    flowerRequested = false;
    clearTimeout(flowerTimer);
    activeTrack = null;
    song?.pause();
    widget?.pause();
    songPlaying = flowerPlaying = false;
    if (song) song.hidden = true;
    if (flowerContainer) flowerContainer.hidden = true;
    if (close) close.hidden = true;
    if (original) original.hidden = true;
    if (title) title.textContent = '选一首，听一会儿。';
    if (status) status.textContent = '歌曲已停止。选一首，再听一会儿。';
    renderTracks();
    if (resume) startBackground();
  }
  function pauseIntroduction() {
    introductionPlaying = false;
    introduction?.pause();
  }
  introduction?.addEventListener('play', () => {
    introductionPlaying = true;
    waitingForGesture = false;
    stopTracks();
    background.pause();
    renderBackground();
  });
  function introductionStopped() {
    if (!introductionPlaying) return;
    introductionPlaying = false;
    renderBackground();
    startBackground();
  }
  introduction?.addEventListener('pause', introductionStopped);
  introduction?.addEventListener('ended', introductionStopped);
  introduction?.addEventListener('error', introductionStopped);
  toggle.addEventListener('click', () => {
    if (!background.paused && !activeTrack) {
      backgroundWanted = false;
      waitingForGesture = false;
      background.pause();
    } else {
      stopTracks();
      pauseIntroduction();
      backgroundWanted = true;
      startBackground();
    }
    save('ambient-enabled', backgroundWanted);
    renderBackground();
  });
  if (player && song) {
    song.volume = 0.4;
    song.addEventListener('play', () => {
      if (activeTrack !== 'canon') { song.pause(); return; }
      background.pause();
      flowerRequested = false;
      widget?.pause();
      songPlaying = true;
      status.textContent = '正在播放：卡农 · Lee Galloway';
      renderTracks();
    });
    song.addEventListener('pause', () => {
      songPlaying = false;
      if (activeTrack === 'canon') status.textContent = '卡农已暂停。点播放继续听。';
      renderTracks();
    });
    song.addEventListener('ended', () => stopTracks(true));
    song.addEventListener('error', () => { status.textContent = '音频暂时无法加载，请稍后重试。'; });
    function flowerFallback(message) {
      flowerRequested = false;
      flowerPlaying = false;
      status.textContent = message;
      original.hidden = false;
      renderTracks();
    }
    function playFlower() {
      flowerRequested = true;
      if (widgetReady) { widget.setVolume(40); widget.play(); }
      status.textContent = '正在加载 Flower Dance 的音频…';
      clearTimeout(flowerTimer);
      flowerTimer = setTimeout(() => {
        if (activeTrack === 'flower' && !flowerPlaying) flowerFallback('若还未响起，请点下方音频播放器的播放键。网络无法连接时，可打开音源页面。');
      }, 12000);
    }
    const sdk = document.createElement('script');
    sdk.src = 'https://w.soundcloud.com/player/api.js';
    sdk.async = true;
    sdk.onload = () => {
      if (!window.SC?.Widget) return;
      widget = SC.Widget(frame);
      widget.bind(SC.Widget.Events.READY, () => {
        widgetReady = true;
        if (flowerRequested && activeTrack === 'flower') { widget.setVolume(40); widget.play(); }
      });
      widget.bind(SC.Widget.Events.PLAY, () => {
        if (activeTrack !== 'flower') { widget.pause(); return; }
        background.pause();
        song.pause();
        flowerPlaying = true;
        clearTimeout(flowerTimer);
        status.textContent = '正在播放：Flower Dance · DJ OKAWARI';
        original.hidden = false;
        renderTracks();
      });
      widget.bind(SC.Widget.Events.PLAY_PROGRESS, event => {
        if (activeTrack === 'flower' && flowerPlaying) {
          player.dataset.audioPosition = String(Math.floor(event.currentPosition / 1000));
        }
      });
      widget.bind(SC.Widget.Events.PAUSE, () => {
        flowerPlaying = false;
        if (activeTrack === 'flower') status.textContent = 'Flower Dance 已暂停。点播放继续听。';
        renderTracks();
      });
      widget.bind(SC.Widget.Events.FINISH, () => stopTracks(true));
      widget.bind(SC.Widget.Events.ERROR, () => {
        if (activeTrack === 'flower') flowerFallback('Flower Dance 音频暂时无法连接，请稍后重试或打开音源页面。');
      });
    };
    sdk.onerror = () => { if (activeTrack === 'flower') flowerFallback('播放器连接失败，可点下方音频播放器或打开音源页面。'); };
    document.head.append(sdk);
    buttons.forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.music;
      if (!tracks[id]) return;
      pauseIntroduction();
      background.pause();
      waitingForGesture = false;
      if (activeTrack === id) {
        if (id === 'canon') {
          if (song.paused) song.play().catch(() => { status.textContent = '请点音频播放器的播放键继续。'; });
          else song.pause();
        } else if (flowerPlaying) { flowerRequested = false; widget?.pause(); }
        else playFlower();
        return;
      }
      stopTracks();
      activeTrack = id;
      close.hidden = false;
      title.textContent = tracks[id];
      song.hidden = id !== 'canon';
      flowerContainer.hidden = id !== 'flower';
      if (id === 'canon') {
        song.currentTime = 0;
        status.textContent = '正在加载卡农…';
        song.play().catch(() => { status.textContent = '请点音频播放器的播放键继续。'; });
      } else playFlower();
      renderTracks();
    }));
    close.addEventListener('click', () => stopTracks(true));
  }
  renderBackground();
  startBackground();
})();
