(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const el=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;if(cls)x.className=cls;return x;};
 const tc=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
 let plan,assets,expanded=false;
 const link=(source)=>{const a=el('a',source.name+' ↗');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';return a;};
 const field=(title,text)=>{const d=el('div',undefined,'field');d.append(el('label',title),el('p',text));return d;};
 const badge=(status)=>el('span',status,'badge'+(status==='已取得'?' ready':''));
 const readableId=id=>`镜头${id.replace('SH','')}`;
 const priorityName=p=>p?`${p} · ${{P0:'先做',P1:'接着补齐',P2:'最后完善'}[p]}`:'无旁白';
 function assetDetail(a){
  const d=el('div',undefined,'asset');const left=el('div');left.append(el('div','素材编号 '+a.id+' · '+a.type,'asset-code'),el('h3',a.name),badge(a.status),el('p','制作准备优先级：'+priorityName(a.priority),'priority'),el('p',a.note||''));
  const links=el('div',undefined,'source-links');a.source_ids.forEach(id=>{if(plan.sources[id])links.append(link(plan.sources[id]));});left.append(links);
  const right=el('div');right.append(el('p','源片范围：'+(a.source_range?a.source_range.label:'未指定。没有精确核看就不制造时码。')));
  if(a.actual_duration_s)right.append(el('p',`已取得片段实长：${a.actual_duration_s.toFixed(3)}秒`));
  if(a.required_screen_label)right.append(el('p','画面提示：'+a.required_screen_label));
  if(a.usage_scope)right.append(el('p','使用状态：'+a.usage_scope));
  if(a.restrictions){const u=el('ul');a.restrictions.forEach(t=>u.append(el('li',t)));right.append(u);}
  d.append(left,right);return d;
 }
 function shotNode(s){
  const d=el('details',undefined,'shot');d.id=s.id;d.open=expanded;
  const sum=el('summary');const t=el('div',`${s.in} — ${s.out}`,'timing');t.append(el('small',`${readableId(s.id)} · ${s.duration_s}秒`));
  const words=el('div',undefined,'words');words.append(el('small',s.chapter+' / '+s.narration_type),el('span',s.text),el('small','素材 '+priorityName(s.material_priority)+' / 声音 '+priorityName(s.narration_priority)+' / 细节 '+priorityName(s.polish_priority),'priority'));sum.append(t,words,el('div',s.emotion,'emotion'));
  const detail=el('div',undefined,'shot-detail');detail.append(field('制作准备优先级',`素材 ${priorityName(s.material_priority)}；声音 ${priorityName(s.narration_priority)}；细节 ${priorityName(s.polish_priority)}。`),field('声音与轻重',s.delivery),field('停顿与音频状态',`停顿预估${s.planned_pause_s}秒，计入此镜头。${s.audio_state}`),field('画面怎么做',s.visual));
  const f=field('素材与来源','');s.asset_ids.forEach(id=>{const a=assets[id];if(!a)return;const item=el('span',a.id+' · '+a.name,'asset-inline');item.append(badge(a.status));f.append(item);});
  const links=el('div',undefined,'source-links');const refs=[...new Set(s.asset_ids.flatMap(id=>assets[id]?.source_ids||[]))];refs.forEach(id=>{if(plan.sources[id])links.append(link(plan.sources[id]));});f.append(links);
  detail.append(f,field('源片取用范围',s.source_range_note),field('字幕／性质提示',s.caption+(s.persistent_label?'；'+s.persistent_label:'')),field('配乐／音效变化',s.bgm_sfx),field('没取得素材时',s.fallback));d.append(sum,detail);return d;
 }
 function renderShots(){
  const q=$('search').value.trim().toLowerCase(),voice=$('voiceFilter').value,status=$('statusFilter').value;
  const shown=plan.shots.filter(s=>{
   if(q && ![s.text,s.chapter,s.emotion,...s.asset_ids.map(id=>assets[id]?.name||'')].join(' ').toLowerCase().includes(q))return false;
   if(voice==='own'&&s.narration_type!=='祖仁泽本人音色旁白')return false;
   if(voice==='insert'&&!s.narration_type.includes('原声'))return false;
   if(voice==='tail'&&s.narration_type!=='纯配乐尾画')return false;
   if(status==='acquired'&&!s.asset_ids.some(id=>assets[id]?.status==='已取得'))return false;
   if(status==='pending'&&!s.asset_ids.some(id=>assets[id]?.status!=='已取得'))return false;
   return true;
  });
  $('shotList').replaceChildren(...shown.map(shotNode));
  if(!shown.length)$('shotList').append(el('p','没有匹配镜头。清空搜索或更换筛选条件。','empty'));
  $('resultCount').textContent=`显示 ${shown.length} / ${plan.shots.length} 个镜头。时间仍为预排；展开可见完整执行细节。`;
  markPosition();
 }
 function markPosition(){const p=Number($('position').value);$('positionLabel').textContent=tc(p);document.querySelectorAll('.shot').forEach(d=>{const s=plan.shots.find(s=>s.id===d.id);d.classList.toggle('active',p>=s.start_s&&p<s.end_s);});}
 function jumpTo(s){$('search').value='';$('voiceFilter').value='all';$('statusFilter').value='all';$('position').value=s.start_s;renderShots();const d=$(s.id);d.open=true;d.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
 async function start(){
  const res=await fetch('./plan.json');if(!res.ok)throw Error('数据未能加载');plan=await res.json();assets=Object.fromEntries(plan.assets.map(a=>[a.id,a]));
  $('total').textContent=plan.meta.total_time;$('shotsCount').textContent=plan.meta.shot_count;$('voCount').textContent=plan.voice_generation.length;$('position').max=plan.meta.total_s-1;
  Object.entries(plan.priorities.levels).forEach(([key,value])=>{const p=el('p');p.append(el('b',key+' '),el('span',value));$('priorityLegend').append(p);});
  plan.priorities.next_steps.forEach(t=>$('nextSteps').append(el('li',t)));
  plan.chapters.forEach((c,i)=>{const b=el('button');b.append(el('b',`${String(i+1).padStart(2,'0')} ${c.title.split('：')[0]}`),el('span',c.title.split('：')[1]||''),el('small',c.in+' — '+c.out));b.style.flexGrow=c.duration_s;b.addEventListener('click',()=>jumpTo(plan.shots.find(s=>s.start_s===c.start_s)));$('chapterRail').append(b);});
  plan.emotion_samples.forEach(s=>{const d=el('div',undefined,'sample');d.append(el('h4',s.emotion),el('blockquote',s.text),el('p',s.delivery),el('p',s.status,'status'));$('samples').append(d);});
  plan.voice_generation.forEach((s,i)=>{const d=el('details',undefined,'generation');const summary=el('summary');summary.append(el('span',`旁白第${i+1}段 · 预排${s.in}—${s.out}`),el('small',s.emotion));d.append(summary,el('p',s.text),el('p',s.delivery,'muted'),el('small',s.state+'。'+s.timing_state));$('generation').append(d);});
  plan.assets.forEach(a=>$('assetList').append(assetDetail(a)));$('scriptHash').textContent='SHA256: '+plan.meta.script_sha256;$('pace').textContent=plan.meta.pace_method+'；仅用于估时，不代表模型已按读速参数执行。';
  ['search','voiceFilter','statusFilter'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',renderShots));$('position').addEventListener('input',markPosition);$('jump').addEventListener('click',()=>jumpTo(plan.shots.find(s=>Number($('position').value)>=s.start_s&&Number($('position').value)<s.end_s)));
  $('expand').addEventListener('click',()=>{expanded=!expanded;$('expand').textContent=expanded?'收起全部':'展开全部';document.querySelectorAll('.shot').forEach(d=>d.open=expanded);});
  renderShots();
 }
 start().catch(err=>{$('shotList').append(el('p','计划数据暂时未加载，请刷新或打开页面底部的公开计划数据。','empty'));$('resultCount').textContent=err.message;});
})();
