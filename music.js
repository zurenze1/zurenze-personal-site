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
  let selection = read('ambient-track-v26', 'qingkong');
  let platformFrame = null;
  let picker = null;
  let backgroundWanted = read('ambient-enabled', 'true') === 'true';
  let waitingForGesture = false;
  let activeTrack = null;
  let introduction = null;
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
    if (selection === 'qingkong') {
      toggle.setAttribute('aria-pressed', String(Boolean(platformFrame)));
      toggle.setAttribute('aria-label', platformFrame ? '关闭青空官方播放器' : '打开青空官方播放器');
      dock.classList.remove('is-playing');
      label.textContent = platformFrame ? '青空 · 官方播放器' : '青空 · 点此听';
      volume.closest('label').hidden = true;
      return;
    }
    volume.closest('label').hidden = false;
    const playing = !background.paused && (!audioContext || audioContext.state === 'running');
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? '暂停背景轻音乐' : '开启背景轻音乐');
    dock.classList.toggle('is-playing', playing);
    label.textContent = playing ? '卡农 · 循环播放' : activeTrack || introductionPlaying ? '卡农 · 已暂停' : backgroundWanted ? '卡农 · 点击开启' : '卡农 · 已关闭';
  }
  async function startBackground() {
    if (selection !== 'canon' || !backgroundWanted || activeTrack || introductionPlaying || pageLeaving) return;
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
    closePlatform();
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
  document.addEventListener('play', event => {
    if (event.target.tagName !== 'VIDEO') return;
    closePlatform();
    introduction = event.target;
    introductionPlaying = true;
    waitingForGesture = false;
    document.querySelectorAll('video').forEach(video => { if(video !== introduction) video.pause(); });
    stopTracks();
    background.pause();
    renderBackground();
  }, true);
  function introductionStopped(event) {
    if (event.target !== introduction || !introductionPlaying) return;
    introductionPlaying = false;
    renderBackground();
    startBackground();
  }
  ['pause','ended','error'].forEach(type => document.addEventListener(type, introductionStopped, true));
  toggle.addEventListener('click', () => {
    if (selection === 'qingkong') { if(platformFrame) closePlatform(); else openQingkong(); return; }
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
      closePlatform();
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
    closePlatform();
    stopTracks();
    pauseIntroduction();
    backgroundWanted = false;
    waitingForGesture = false;
    save('ambient-enabled', false);
    background.pause();
    renderBackground();
  }));
  // Keep the original platform's visible player and attribution; do not copy its recording.
  picker = document.createElement('section');
  picker.id = 'sound-picker';
  picker.className = 'sound-picker';
  picker.hidden = true;
  picker.setAttribute('aria-label', '选择音乐');
  picker.innerHTML = `<div class="sound-picker-heading"><strong>我的听歌时间</strong><button type="button" class="sound-picker-close" aria-label="关闭选歌并停止青空">×</button></div><div class="sound-choices"><button type="button" data-background="qingkong"><b>青空</b><small>Piano 毛 · 官方播放</small></button><button type="button" data-background="canon"><b>卡农</b><small>站内音频 · 循环播放</small></button></div><div class="qingkong-player"></div><p class="sound-source-note">青空在抖音官方播放器收听；点播放器播放，结束后可重播。卡农可以伴随网页循环播放。</p><a class="qingkong-original" href="https://www.douyin.com/video/7399206310245420325" target="_blank" rel="noopener noreferrer">去原作品收听 ↗</a>`;
  dock.append(picker);
  const frameHolder = picker.querySelector('.qingkong-player');
  new ResizeObserver(() => frameHolder.style.setProperty('--player-scale', String(frameHolder.clientWidth / 360))).observe(frameHolder);
  const more = dock.querySelector('.sound-more');
  const chooser = document.createElement('button');
  chooser.type = 'button'; chooser.className = 'sound-more'; chooser.textContent = '换曲 ↗';
  chooser.setAttribute('aria-controls', picker.id); chooser.setAttribute('aria-expanded', 'false');
  more?.replaceWith(chooser);
  function showPicker(){picker.hidden=false;chooser.setAttribute('aria-expanded','true');}
  function closePlatform(){
    platformFrame?.remove(); platformFrame=null;
    renderBackground();
  }
  function hidePicker(){closePlatform();picker.hidden=true;chooser.setAttribute('aria-expanded','false');}
  function selectTrack(id){
    selection=id;save('ambient-track-v26',id);
    picker.querySelectorAll('[data-background]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.background===id)));
    renderBackground();
  }
  function openQingkong(){
    closePlatform();stopTracks();pauseIntroduction();background.pause();waitingForGesture=false;
    selectTrack('qingkong');showPicker();
    platformFrame=document.createElement('iframe');
    platformFrame.title='青空 · Piano 毛 · 抖音官方播放器';
    platformFrame.src='https://open.douyin.com/player/video?vid=7399206310245420325&autoplay=1';
    platformFrame.allow='autoplay; fullscreen';platformFrame.referrerPolicy='unsafe-url';platformFrame.allowFullscreen=true;
    picker.querySelector('.qingkong-player').append(platformFrame);
    renderBackground();
  }
  chooser.addEventListener('click',()=>{if(picker.hidden)showPicker();else hidePicker();});
  picker.querySelector('.sound-picker-close').addEventListener('click',()=>{hidePicker();chooser.focus();});
  picker.addEventListener('keydown',event=>{if(event.key==='Escape'){hidePicker();chooser.focus();}});
  picker.querySelectorAll('[data-background]').forEach(button=>button.addEventListener('click',()=>{
    if(button.dataset.background==='qingkong'){openQingkong();return;}
    closePlatform();stopTracks();pauseIntroduction();selectTrack('canon');backgroundWanted=true;save('ambient-enabled',true);startBackground();
  }));
  picker.querySelector('.qingkong-original').addEventListener('click',()=>{closePlatform();background.pause();backgroundWanted=false;save('ambient-enabled',false);});
  document.querySelectorAll('[data-qingkong]').forEach(button=>button.addEventListener('click',openQingkong));
  selectTrack(selection==='canon'?'canon':'qingkong');
  renderBackground();
  startBackground();
})();
