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
  let selection = read('ambient-track-v27', 'refreshing');
  let platformFrame = null;
  let picker = null;
  let backgroundWanted = read('ambient-enabled-v27', 'true') === 'true';
  let waitingForGesture = false;
  let activeTrack = null;
  let introduction = null;
  let introductionPlaying = false;
  let pageLeaving = false;
  let audioContext, gain, envelope;
  let fadeFrame=0, fadeOrigin=0, portalAudioActive=false, entryStopTimer=0;
  let autoStopped=read("ambient-entry-stopped-v30","false")==="true";
  let musicMix=Number(read('ambient-mix-v28','1'));
  if(!Number.isFinite(musicMix))musicMix=1;
  let entrySeeking = false;
  let fxNodes = [];
  let entryRequest=0, entryPending=false;
  const catalogue = {refreshing:{name:'晴朗钢琴',src:'assets/audio/piano-refreshing-peritune.mp3',start:70},canon:{name:'卡农',src:'assets/audio/canon-lee-galloway.mp3',start:0}};
  const savedVolume = Number(read('ambient-volume-v27', '45'));
  volume.max = '100';
  volume.value = Number.isFinite(savedVolume) ? Math.max(0, Math.min(100, savedVolume)) : 45;
  // GainNode keeps the background quiet on mobile browsers that ignore audio.volume.
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) {
      audioContext = new Context();
      gain = audioContext.createGain();
      envelope=audioContext.createGain();
      audioContext.createMediaElementSource(background).connect(envelope);envelope.connect(gain);
      gain.connect(audioContext.destination);
    }
  } catch { audioContext = null; gain = null; envelope = null; }
  function setVolume() {
    const level = Number(volume.value) / 100;
    if (gain) gain.gain.setValueAtTime(level, audioContext.currentTime);
    else background.volume = Math.min(1,level*musicMix);
    save('ambient-volume-v27', volume.value);
    volume.setAttribute('aria-valuetext', `${volume.value}%`);
  }
  function applyMix(){
    if(envelope)envelope.gain.setValueAtTime(musicMix,audioContext.currentTime);
    else background.volume=Math.min(1,Number(volume.value)/100*musicMix);
    background.dataset.mix=musicMix.toFixed(3);save('ambient-mix-v28',musicMix);
  }
  function clearEntryLimit(){clearTimeout(entryStopTimer);save('ambient-entry-until-v30',0);autoStopped=false;save('ambient-entry-stopped-v30',false);cancelAnimationFrame(fadeFrame);musicMix=1;applyMix();background.dataset.soundStage='manual';}
  function stopEntryMusic(){
    clearTimeout(entryStopTimer);cancelAnimationFrame(fadeFrame);entryRequest++;entryPending=false;
    backgroundWanted=false;waitingForGesture=false;autoStopped=true;save('ambient-entry-stopped-v30',true);save('ambient-entry-until-v30',0);save('ambient-enabled-v27',false);
    stopTunnelFx();background.pause();musicMix=1;applyMix();background.dataset.soundStage='finished';renderBackground();
  }
  function armEntryLimit(deadline){clearTimeout(entryStopTimer);entryStopTimer=setTimeout(stopEntryMusic,Math.max(0,deadline-Date.now()));}
  function entranceEnvelope(){
    cancelAnimationFrame(fadeFrame);fadeOrigin=performance.now();autoStopped=false;save('ambient-entry-stopped-v30',false);
    const deadline=Date.now()+12000;save('ambient-entry-until-v30',deadline);armEntryLimit(deadline);
    function step(now){
      const t=(now-fadeOrigin)/1000,p=Math.max(0,Math.min(1,(t-3)/7));
      musicMix=(t<10?1.25*Math.pow(.55/1.25,p*p*(3-2*p)):.55*Math.max(0,1-(t-10)/2))*Math.min(1,.12+t/1.15);applyMix();
      background.dataset.soundStage=t<3?'climax':t<10?'fading':'ending';
      if(t<12)fadeFrame=requestAnimationFrame(step);
    }
    step(fadeOrigin);
  }
  setVolume();applyMix();
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
    const name = catalogue[selection]?.name || '钢琴';
    label.textContent = name + (playing ? ' · 播放中' : activeTrack || introductionPlaying ? ' · 已暂停' : backgroundWanted ? ' · 点击开启' : ' · 已关闭');
  }
  async function startBackground() {
    if (!catalogue[selection] || !backgroundWanted || activeTrack || introductionPlaying || pageLeaving) return false;
    waitingForGesture = false;
    try {
      await Promise.all([audioContext?.resume(), background.play()]);
      if (!backgroundWanted || activeTrack || introductionPlaying || pageLeaving) background.pause();
      renderBackground();
      return !background.paused && (!audioContext || audioContext.state === 'running');
    } catch (error) {
      waitingForGesture = error.name === 'NotAllowedError' || audioContext?.state === 'suspended';
      renderBackground();
      if (!waitingForGesture) label.textContent = '钢琴 · 点此重试';
      return false;
    }
  }
  function restorePosition() {
    const position = entrySeeking ? 70 : Number(read('ambient-position-' + selection, String(catalogue[selection]?.start || 0)));
    if (Number.isFinite(position) && position > 0 && position < background.duration) background.currentTime = position;
  }
  if (background.readyState >= 1) restorePosition();
  background.addEventListener('loadedmetadata', restorePosition);
  background.addEventListener('play', renderBackground);
  background.addEventListener('pause', renderBackground);
  background.addEventListener('error', () => { waitingForGesture = false; label.textContent = '轻音乐 · 暂时无法加载'; });
  volume.addEventListener('input',()=>{cancelAnimationFrame(fadeFrame);musicMix=1;applyMix();setVolume();});
  document.addEventListener('click', event => {
    if (waitingForGesture && backgroundWanted && !activeTrack && !event.target.closest('.sound-dock, .music-section, .intro-video-section, .portal-entry')) startBackground();
  });
  document.addEventListener('keydown', event => {
    if (waitingForGesture && backgroundWanted && !activeTrack && ['Enter', ' '].includes(event.key) && !event.target.closest('.sound-dock, .music-section, .intro-video-section, .portal-entry')) startBackground();
  });
  window.addEventListener('pagehide', () => {
    pageLeaving = true;clearTimeout(entryStopTimer);
    closePlatform();
    save('ambient-position-' + selection, background.currentTime);
    pauseIntroduction();
    background.pause();
    song?.pause();
  });
  window.addEventListener('pageshow', event => {
    pageLeaving = false;
    if(event.persisted){
      backgroundWanted=read('ambient-enabled-v27','true')==='true';autoStopped=read('ambient-entry-stopped-v30','false')==='true';
      const deadline=Number(read('ambient-entry-until-v30','0'));
      if(deadline>0&&deadline<=Date.now()){stopEntryMusic();return;}
      if(deadline>0)armEntryLimit(deadline);startBackground();renderBackground();
    }
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
    stopTunnelFx();cancelAnimationFrame(fadeFrame);musicMix=.55;applyMix();
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
    clearEntryLimit();
    if (selection === 'qingkong') { if(platformFrame) closePlatform(); else openQingkong(); return; }
    if (!background.paused && !activeTrack) {
      stopTunnelFx();
      backgroundWanted = false;
      waitingForGesture = false;
      background.pause();
    } else {
      stopTracks();
      pauseIntroduction();
      backgroundWanted = true;
      startBackground();
    }
    save('ambient-enabled-v27', backgroundWanted);
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
    save('ambient-enabled-v27', false);
    background.pause();
    renderBackground();
  }));
  // Keep the original platform's visible player and attribution; do not copy its recording.
  picker = document.createElement('section');
  picker.id = 'sound-picker';
  picker.className = 'sound-picker';
  picker.hidden = true;
  picker.setAttribute('aria-label', '选择音乐');
  picker.innerHTML = `<div class="sound-picker-heading"><strong>我的听歌时间</strong><button type="button" class="sound-picker-close" aria-label="关闭选歌并停止青空">×</button></div><div class="sound-choices"><button type="button" data-background="refreshing"><b>晴朗钢琴</b><small>PeriTune · 默认入场音乐</small></button><button type="button" data-background="qingkong"><b>青空</b><small>Piano 毛 · 官方播放</small></button><button type="button" data-background="canon"><b>卡农</b><small>站内音频 · 循环播放</small></button></div><div class="qingkong-player"></div><p class="sound-source-note">入场选曲：<a href="https://peritune.com/blog/2016/07/13/piano_refreshing/" target="_blank" rel="noopener noreferrer">Piano_Refreshing · PeriTune ↗</a><br>入场播放 12 秒；手动开启可循环，无广告。<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · 已调整响度。<br>《青空》另用官方播放器收听。</p><a class="qingkong-original" href="https://www.douyin.com/video/7399206310245420325" target="_blank" rel="noopener noreferrer">去原作品收听 ↗</a>`;
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
    selection=id;save('ambient-track-v27',id);
    const track=catalogue[id];
    if(track && background.getAttribute('src')!==track.src){background.src=track.src;background.load();}
    dock.dataset.track=id;
    picker.querySelectorAll('[data-background]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.background===id)));
    renderBackground();
  }
  function openQingkong(){
    clearEntryLimit();
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
    clearEntryLimit();
    if(button.dataset.background==='qingkong'){openQingkong();return;}
    closePlatform();stopTracks();pauseIntroduction();selectTrack(button.dataset.background);backgroundWanted=true;save('ambient-enabled-v27',true);startBackground();
  }));
  picker.querySelector('.qingkong-original').addEventListener('click',()=>{closePlatform();background.pause();backgroundWanted=false;save('ambient-enabled-v27',false);});
  document.querySelectorAll('[data-qingkong]').forEach(button=>button.addEventListener('click',openQingkong));
  function stopTunnelFx(){
    fxNodes.forEach(node=>{try{node.stop();}catch{}try{node.disconnect();}catch{}});fxNodes=[];
  }
  function startTunnelFx(elapsed=0){
    stopTunnelFx();if(!audioContext||audioContext.state!=='running')return;
    if(elapsed>1.2)return;
    const ctx=audioContext,t=ctx.currentTime,level=Number(volume.value)/100;
    const bus=ctx.createGain();bus.gain.value=level*.72;
    const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-7;limiter.knee.value=12;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.2;bus.connect(limiter);limiter.connect(ctx.destination);fxNodes.push(limiter);
    const noise=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*5.4),ctx.sampleRate);
    for(let c=0;c<2;c++){const data=noise.getChannelData(c);let last=0;for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.08)/1.02;data[i]=last*2.8;}}
    const source=ctx.createBufferSource();source.buffer=noise;
    const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.Q.value=.65;filter.frequency.setValueAtTime(150,t);filter.frequency.exponentialRampToValueAtTime(2200,t+4.1);filter.frequency.exponentialRampToValueAtTime(180,t+5.2);
    const swell=ctx.createGain();swell.gain.setValueAtTime(0,t);swell.gain.linearRampToValueAtTime(.07,t+1.15);swell.gain.exponentialRampToValueAtTime(.65,t+4.1);swell.gain.exponentialRampToValueAtTime(.001,t+5.3);
    const pan=ctx.createStereoPanner?.();source.connect(filter);filter.connect(swell);if(pan){swell.connect(pan);pan.connect(bus);pan.pan.setValueAtTime(-.6,t);pan.pan.linearRampToValueAtTime(.6,t+2.3);pan.pan.linearRampToValueAtTime(0,t+4.4);}else swell.connect(bus);source.start(t);source.stop(t+5.4);
    fxNodes.push(source,bus,filter,swell);if(pan)fxNodes.push(pan);
    // A long rising swell replaces percussive impacts: presence without a startle.
    const low=ctx.createOscillator(),lowGain=ctx.createGain();low.type='sine';low.frequency.setValueAtTime(66,t);low.frequency.linearRampToValueAtTime(94,t+3.6);low.frequency.exponentialRampToValueAtTime(48,t+5.25);
    lowGain.gain.setValueAtTime(0,t);lowGain.gain.linearRampToValueAtTime(.07,t+1.3);lowGain.gain.linearRampToValueAtTime(.25,t+3.8);lowGain.gain.exponentialRampToValueAtTime(.001,t+5.3);low.connect(lowGain);lowGain.connect(bus);low.start(t);low.stop(t+5.4);fxNodes.push(low,lowGain);
    setTimeout(()=>{if(fxNodes.includes(bus))stopTunnelFx();},5600);
  }
  window.ZRZAudio={
    canAutoStart:()=>backgroundWanted||autoStopped,
    startEntry:async()=>{
      const request=++entryRequest;entryPending=true;portalAudioActive=true;entranceEnvelope();const audioStart=performance.now();
      closePlatform();stopTracks();pauseIntroduction();entrySeeking=true;selectTrack('refreshing');backgroundWanted=true;save('ambient-enabled-v27',true);
      try{background.currentTime=70;}catch{}
      if(audioContext)audioContext.resume().then(()=>{if(request===entryRequest&&portalAudioActive)startTunnelFx((performance.now()-audioStart)/1000);}).catch(()=>{});
      const ok=await startBackground();if(request!==entryRequest)return false;entryPending=false;if(ok)entrySeeking=false;return ok;
    },
    endEntry:()=>{portalAudioActive=false;stopTunnelFx();},
    cancelEntry:()=>{entryRequest++;if(entryPending){backgroundWanted=false;waitingForGesture=false;background.pause();entryPending=false;}},
    stopEntryFx:stopTunnelFx,
    silence:()=>{entryRequest++;entryPending=false;stopTunnelFx();backgroundWanted=false;waitingForGesture=false;save('ambient-enabled-v27',false);background.pause();renderBackground();}
  };
  selectTrack(['canon','qingkong','refreshing'].includes(selection)?selection:'refreshing');
  const entryDeadline=Number(read('ambient-entry-until-v30','0'));
  if(entryDeadline>0){if(entryDeadline<=Date.now())stopEntryMusic();else armEntryLimit(entryDeadline);}
  renderBackground();
  if(!new URLSearchParams(location.search).has('preview') && (!document.body.classList.contains('index') || location.hash || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion==='off')) {
    if(document.body.classList.contains('index')&&backgroundWanted&&entryDeadline===0)entranceEnvelope();
    startBackground();
  }
})();
