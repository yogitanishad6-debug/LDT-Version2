/* CareerSim — Mint & Sky (Youth Playful)
   Client-side single-file app. Replace previous app.js
*/

const FAMILIES = [
  {id:'health', name:'Healthcare', mentor:'Dr. Aria'},
  {id:'tech', name:'Engineering & Tech', mentor:'Rian'},
  {id:'design', name:'Design & Creativity', mentor:'Zoya'},
  {id:'biz', name:'Business & Management', mentor:'Maya'},
  {id:'edu', name:'Education & Social', mentor:'Arjun'}
];

const MISSIONS = {
  health:[
    {id:'h1', title:'Triage a simple case', type:'scenario', steps:[
      {q:'A child has fever & stomachache. What do you do first?', opts:['Give rest', 'Ask more symptoms', 'Ignore'], correct:1, effects:{empathy:1,analysis:1}},
      {q:'How would you explain a simple care tip to a parent?', opts:null, effects:{communication:2}}
    ]},
    {id:'h2', title:'Create a community health tip', type:'task', steps:[
      {q:'Write a clear 1-2 line health tip for your neighbourhood:', opts:null, effects:{communication:2,empathy:1}}
    ]}
  ],
  tech:[
    {id:'t1', title:'Find the bug', type:'mini', steps:[
      {q:'A list loop fails at end. Which will you check?', opts:['Index bounds','Color value','Text case'], correct:0, effects:{analysis:2}}
    ]},
    {id:'t2', title:'Plan a small algorithm', type:'task', steps:[
      {q:'Describe (1 line) steps to sort 3 numbers:', opts:null, effects:{analysis:1,creativity:1}}
    ]}
  ],
  design:[
    {id:'d1', title:'Design a classroom tool', type:'task', steps:[
      {q:'Choose need: Storage / Writing / Play', opts:['Storage','Writing','Play'], correct:0, effects:{creativity:2}},
      {q:'Write the core idea in one line:', opts:null, effects:{creativity:1}}
    ]},
    {id:'d2', title:'Respond to feedback', type:'scenario', steps:[
      {q:'User: "The tool is heavy". What do you do?', opts:['Ignore','Make it lighter','Change color'], correct:1, effects:{communication:1,creativity:1}}
    ]}
  ]
};

const DEFAULT_SKILLS = {creativity:0,communication:0,analysis:0,empathy:0};
let state = { user:null, family:null, skills:{...DEFAULT_SKILLS}, badges:[], completed:[], reflections:[], userAvatar:null };

const $ = id => document.getElementById(id);
const save = ()=> localStorage.setItem('careerSim_mint', JSON.stringify(state));
const load = ()=> { const s = localStorage.getItem('careerSim_mint'); if(s) state = JSON.parse(s); };

function init(){
  load();
  renderAvatars();
  renderFamilies();
  $('startBtn').onclick = start;
  $('quickDemo').onclick = quickDemo;
  $('closeModal').onclick = ()=> toggleModal(false);
  $('export').onclick = exportJSON;
  $('reset').onclick = resetAll;
  $('saveReflection').onclick = saveReflection;
  if(state.user) enterGame();
}

function renderAvatars(){
  const cont = $('avatars'); cont.innerHTML='';
  for(let i=1;i<=6;i++){
    const a = document.createElement('div'); a.className='avatar'; a.textContent='A'+i;
    a.onclick = ()=> { document.querySelectorAll('.avatar').forEach(x=>x.classList.remove('selected')); a.classList.add('selected'); state.userAvatar='A'+i; save(); };
    if(state.userAvatar==='A'+i) a.classList.add('selected');
    cont.appendChild(a);
  }
}

function renderFamilies(){
  const cont = $('families'); cont.innerHTML='';
  FAMILIES.forEach(f=>{
    const el = document.createElement('div'); el.className='choice'; el.textContent = f.name;
    el.onclick = ()=> {
      document.querySelectorAll('.choice').forEach(x=>x.classList.remove('active'));
      el.classList.add('active'); state.family=f.id; $('mentorText').textContent = `${f.mentor}: ready with missions.`; save(); renderCity(); renderMissions();
    };
    if(state.family===f.id) el.classList.add('active');
    cont.appendChild(el);
  });
}

function start(){
  const name = $('name').value.trim(), birth = parseInt($('birth').value,10);
  if(!name || !birth || birth>2016){ alert('Enter valid name & birth year (<=2016)'); return; }
  if(!state.family){ alert('Pick a career family'); return; }
  state.user = {name, birth}; save(); enterGame();
}

function quickDemo(){
  state = { user:{name:'Demo', birth:2010}, family:'tech', skills:{...DEFAULT_SKILLS}, badges:[], completed:[], reflections:[], userAvatar:'A1' };
  save(); enterGame();
}

function enterGame(){
  $('onboard').classList.add('hidden'); $('game').classList.remove('hidden');
  $('userTag').textContent = `${state.user.name} • ${state.family}`;
  renderProfile(); renderCity(); renderMissions(); updateFit();
}

function renderProfile(){
  $('profileName').textContent = state.user.name || 'Student';
  $('profileMeta').textContent = `Born ${state.user.birth || ''}`;
  $('avatarLarge').textContent = state.userAvatar || 'A';
  // skills
  const sk = $('skills'); sk.innerHTML='';
  Object.entries(state.skills).forEach(([k,v])=>{
    const item = document.createElement('div'); item.className='skillItem';
    item.innerHTML = `<div class="skillIcon">${k[0].toUpperCase()}</div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between"><div style="text-transform:capitalize">${k}</div><div>${v}</div></div>
        <div class="skillBar"><div id="fill-${k}" class="skillFill" style="width:${Math.min(100,v*10)}%"></div></div>
      </div>`;
    sk.appendChild(item);
  });
  // badges
  const b = $('badges'); b.innerHTML='';
  state.badges.forEach(bd=>{ const el = document.createElement('div'); el.className='badge'; el.textContent=bd; b.appendChild(el); });
}

function renderCity(){
  const city = $('city'); city.innerHTML='';
  FAMILIES.forEach(f=>{
    const b = document.createElement('div'); b.className='building'; b.innerHTML = `<div>${f.name.split(' ')[0]}</div><div style="font-size:12px;color:var(--muted)">${f.mentor}</div>`;
    if(state.family===f.id) b.classList.add('active');
    b.onclick = ()=> { state.family=f.id; save(); document.querySelectorAll('.building').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('mentorText').textContent= `${f.mentor}: missions refreshed.`; renderMissions(); renderProfile(); updateFit(); };
    city.appendChild(b);
  });
}

function renderMissions(){
  const list = $('missionList'); list.innerHTML='';
  const pool = MISSIONS[state.family] || [];
  pool.forEach(m=>{
    const card = document.createElement('div'); card.className='missionCard';
    card.innerHTML = `<div><strong>${m.title}</strong><div class="meta">${m.type}</div></div><div><button class="btn primary" data-id="${m.id}">Start</button></div>`;
    list.appendChild(card);
    card.querySelector('button').onclick = ()=> startMission(m);
  });
}

function toggleModal(show, html=''){
  const modal = $('modal');
  if(show){ $('modalContent').innerHTML = html; modal.classList.remove('hidden'); } else { modal.classList.add('hidden'); $('modalContent').innerHTML=''; }
}

function startMission(mission){
  let step=0;
  const steps = mission.steps || [];
  const renderStep = ()=>{
    if(step >= steps.length){ // finish
      toggleModal(true, `<h3>Mission complete</h3><p>You finished "${mission.title}".</p><div style="margin-top:12px"><button id="closeOk" class="btn primary">Close</button></div>`);
      $('closeOk').onclick = ()=> { toggleModal(false); if(!state.badges.includes(mission.title)) state.badges.push(mission.title); save(); renderProfile(); updateFit(); };
      return;
    }
    const s = steps[step];
    let html = `<h3>${mission.title}</h3><p class="muted">${mission.type}</p><hr>`;
    if(s.opts){
      html += `<p>${s.q}</p>` + s.opts.map((o,i)=>`<button class="btn ghost opt" data-i="${i}" style="margin:6px">${o}</button>`).join('');
    } else {
      html += `<p>${s.q}</p><textarea id="resp" placeholder="Write 1-2 lines"></textarea><div style="margin-top:10px"><button id="sendText" class="btn primary">Submit</button></div>`;
    }
    toggleModal(true, html);

    document.querySelectorAll('.opt').forEach(btn=>{
      btn.onclick = ()=> {
        const chosen = parseInt(btn.getAttribute('data-i'),10);
        const correct = s.correct;
        const multiplier = (chosen === correct)? 1 : 0.6;
        applyEffects(s.effects || {}, multiplier);
        step++; save(); renderProfile(); updateFit(); renderStep();
      };
    });
    if($('sendText')) $('sendText').onclick = ()=> {
      const val = $('resp').value || '';
      applyEffects(s.effects || {}, 1);
      step++; save(); renderProfile(); updateFit(); renderStep();
    };
  };
  renderStep();
}

function applyEffects(effects, mult=1){
  Object.entries(effects||{}).forEach(([k,v]) => { state.skills[k] = (state.skills[k]||0) + Math.round(v*mult); });
  // auto badges by skill thresholds
  if(state.skills.creativity >=3 && !state.badges.includes('Creative')) state.badges.push('Creative');
  if(state.skills.analysis >=3 && !state.badges.includes('Analytical')) state.badges.push('Analytical');
  if(state.skills.empathy >=3 && !state.badges.includes('Caring')) state.badges.push('Caring');
  save();
}

function updateFit(){
  const w = { health:{empathy:0.5,analysis:0.3,communication:0.2}, tech:{analysis:0.6,creativity:0.2,communication:0.2}, design:{creativity:0.6,communication:0.2,analysis:0.2}, biz:{communication:0.4,analysis:0.4,creativity:0.2}, edu:{communication:0.4,empathy:0.4,analysis:0.2} }[state.family] || {analysis:0.4,creativity:0.3,communication:0.3};
  let score=0;
  Object.entries(w).forEach(([k,wk])=> score += (state.skills[k]||0)*wk );
  const fit = Math.max(0, Math.min(100, Math.round(score*8)));
  $('fitScore').textContent = fit + '%';
  $('summary').textContent = `Missions done: ${state.completed.length}`;
  // animate fills
  Object.keys(state.skills).forEach(k=>{
    const el = document.getElementById('fill-'+k);
    if(el) el.style.width = Math.min(100, state.skills[k]*10) + '%';
  });
}

function exportJSON(){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  a.download = `${state.user?.name || 'profile'}-careersim.json`; a.click();
}

function resetAll(){ if(confirm('Reset all progress?')){ localStorage.removeItem('careerSim_mint'); location.reload(); }}
function saveReflection(){ const txt = $('reflection').value.trim(); if(!txt) return alert('Write something'); state.reflections.push({text:txt, date:new Date().toISOString()}); save(); $('reflection').value=''; alert('Saved'); }

init();
