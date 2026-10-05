const filters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('[data-project]');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  projects.forEach(project => { project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter; });
}));
filters.forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));
const stories = [
  '工作之外，我偏爱向内走。读儒释道、古诗词，也写一点东西。案头常翻《遥远的救世主》《平凡的世界》《六祖坛经》。一个人的时候，会循环听卡农和 Flower Dance；闲时去古寺小住，听钟声，让自己慢下来。',
  '大学时打棒球，如今继续跑步，也在学游泳：已经会蛙泳，正在练自由泳。往后还想试试骑马和滑雪。精神在读书里求索，身体也要在路上，两样都不能丢。',
  '综合自己的兴趣与长期规划，我选择探索 IP＋AI，希望在这个方向长期扎根。抓住学习的机会，把想法付诸实践，等到回头看时，能为那段奋力拼搏的自己鼓掌。'
];
const dialog = document.querySelector('#project-dialog');
projects.forEach(project => project.addEventListener('click', () => {
  document.querySelector('#dialog-title').textContent = project.querySelector('h3').textContent;
  dialog.querySelector('p:not(.eyebrow)').textContent = stories[Number(project.dataset.project)];
  dialog.showModal();
}));
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if(event.target === dialog) { const rect = dialog.getBoundingClientRect(); if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
document.querySelector('#year').textContent = new Date().getFullYear();
