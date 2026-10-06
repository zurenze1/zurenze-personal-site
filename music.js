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
  });
  window.addEventListener('pageshow', event => {
    pageLeaving = false;
    if (event.persisted) startBackground();
  });

  const player = document.querySelector('.music-player');
  const song = document.querySelector('#song-audio');
  const buttons = [...document.querySelectorAll('[data-music]')];
  const status = player?.querySelector('.player-status');
  const title = player?.querySelector('.audio-title');
  const close = player?.querySelector('.player-close');
  let songPlaying = false;
  const tracks = { canon: '卡农' };
  function renderTracks() {
    buttons.forEach(button => {
      const id = button.dataset.music;
      const playing = activeTrack === id && songPlaying;
      button.setAttribute('aria-pressed', String(playing));
      button.innerHTML = `<span aria-hidden="true">${playing ? 'Ⅱ' : '▶'}</span> ${playing ? '暂停' : '听'}卡农`;
    });
    player?.classList.toggle('is-active', Boolean(activeTrack));
    renderBackground();
  }
  function stopTracks(resume = false) {
    activeTrack = null;
    song?.pause();
    songPlaying = false;
    if (song) song.hidden = true;
    if (close) close.hidden = true;
    if (title) title.textContent = '卡农，安静听一会儿。';
    if (status) status.textContent = '歌曲已停止。点击「听卡农」再次播放。';
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
    buttons.forEach(button => button.addEventListener('click', () => {
      if (button.dataset.music !== 'canon') return;
      pauseIntroduction();
      background.pause();
      waitingForGesture = false;
      if (activeTrack === 'canon') {
        if (song.paused) song.play().catch(() => { status.textContent = '请点音频播放器的播放键继续。'; });
        else song.pause();
        return;
      }
      stopTracks();
      activeTrack = 'canon';
      close.hidden = false;
      title.textContent = tracks.canon;
      song.hidden = false;
      song.currentTime = 0;
      status.textContent = '正在加载卡农…';
      song.play().catch(() => { status.textContent = '请点音频播放器的播放键继续。'; });
      renderTracks();
    }));
    close.addEventListener('click', () => stopTracks(true));
  }
  document.querySelectorAll('.external-listen').forEach(link => link.addEventListener('click', () => {
    stopTracks();
    pauseIntroduction();
    backgroundWanted = false;
    waitingForGesture = false;
    save('ambient-enabled', false);
    background.pause();
    renderBackground();
  }));
  renderBackground();
  startBackground();
})();
