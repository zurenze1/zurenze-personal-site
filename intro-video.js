(() => {
  const video = document.querySelector('#intro-video');
  const screen = document.querySelector('.intro-video-screen');
  const button = document.querySelector('.intro-video-play');
  const label = button?.querySelector('.intro-play-label');
  const status = document.querySelector('.intro-video-status');
  if (!video || !screen || !button || !status) return;
  button.hidden = false;
  button.addEventListener('click', () => {
    if (video.ended) video.currentTime = 0;
    if (video.error) video.load();
    status.textContent = '正在打开视频…';
    video.play().catch(() => {
      status.textContent = '请点视频下方的播放键，或打开视频单独观看。';
    });
  });
  video.addEventListener('play', () => {
    button.hidden = true;
    screen.classList.add('is-playing');
    status.textContent = '正在播放我的自我介绍，背景轻音乐已暂停。';
  });
  video.addEventListener('pause', () => {
    button.hidden = false;
    screen.classList.remove('is-playing');
    label.textContent = video.ended ? '再看一次' : '继续观看';
    button.setAttribute('aria-label', video.ended ? '重新播放自我介绍视频' : '继续播放自我介绍视频');
    status.textContent = video.ended ? '这一段介绍结束了，继续看看我的经历与书单。' : '视频已暂停，点击继续观看。';
  });
  video.addEventListener('waiting', () => {
    if (!video.paused) status.textContent = '视频正在缓冲，请稍等片刻。';
  });
  video.addEventListener('playing', () => {
    status.textContent = '正在播放我的自我介绍，背景轻音乐已暂停。';
  });
  video.addEventListener('ended', () => {
    label.textContent = '再看一次';
    status.textContent = '这一段介绍结束了，继续看看我的经历与书单。';
  });
  video.addEventListener('error', () => {
    button.hidden = false;
    label.textContent = '重新尝试';
    status.textContent = '视频暂时无法加载，可稍后重试或打开视频单独观看。';
  });
})();
