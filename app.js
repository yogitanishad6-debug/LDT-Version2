/* CareerSim — Immersive (Bold) prototype
   Single-file client side app. Drop into your repo, replace existing app.js
*/

const FAMILIES = [
  {id:'health', name:'Healthcare', color:'#00d28a', mentor:'Dr. Aria'},
  {id:'tech', name:'Engineering & Tech', color:'#00c2ff', mentor:'Rian the Researcher'},
  {id:'design', name:'Design & Creativity', color:'#7c3aed', mentor:'Zoya the Designer'},
  {id:'biz', name:'Business & Management', color:'#ffc857', mentor:'Maya the Founder'},
  {id:'edu', name:'Education & Social', color:'#ff6b6b', mentor:'Arjun the Guide'},
];

const MISSIONS = {
  health: [
    {id:'h1', title:'Triage a simple case', type:'scenario', steps:[
      {q:'A child has fever & stomachache. First step?', opts:['Give rest','Ask more symptoms','Ignore'], correct:1, effects:{empathy:1,analysis:1}},
      {q:'How would you explain to a parent what to monitor?', opts:['Only temp','Temp + fluid','No need'], correct:1, effects:{communication:2}}
    ]},
    {id:'h2', title:'Create a community health tip', type:'task', steps:[
      {q:'Write a short tip in 1-2 lines (simulated):', opts:null, effects:{communication:2,empathy:1}}
    ]}
  ],
  tech: [
    {id:'t1', title:'Find the bug', type:'mini', steps:[
      {q:'A process stops when list is empty. What would you check?', opts:['Index','Name','Color'], correct:0, effects:{analysis:2}},
    ]},
    {id:'t2', title:'Plan a small algorithm', type:'task', steps:[
      {q:'Describe (1 line) how you would sort 3 numbers', opts:null, effects:{analysis:1,creativity:1}}
    ]}
  ],
  design: [
    {id:'d1', title:'Sketch a school tool', type:'task', steps:[
      {q:'Pick a need: Storage / Writing / Play', opts:['Storage','Writing','Play'], correct:0, effects:{creativity:2}},
      {q:'Write concept in one line', opts:null, effects:{creativity:1}}
    ]},
    {id:'d2', title:'Respond to user feedback', type:'scenario', steps:[
      {q:'User says product is heavy. Choose action', opts:['Ignore','Lighten','Change color'], correct:1, effects:{creativity:1,communication:1}}
    ]}
  ]
};

const DEFAULT_SKILLS = {creativity:0,communication:0,analysis:0,empathy:0};

let state = { user:null, family:null, skills:{...DEFAULT_SKILLS}, badges:[], completed:[], reflections:[] };

const $ = id => document.getElementById(id);
const save = ()=> localStorage.setItem('careerSim_v2', JSON.stringify(state));
const load = ()=> {
  const s = localStorage.getItem('careerSim_v2');
  if(s) state = JSON.parse(s);
};

function init(){
  load();
  renderAvatars();
  renderFamilyChoices();
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
    const a = document.createElement('div'); a.className='avatar'; a.textContent = 'A'+i;
    a.onclick = ()=> { document.querySelectorAll('.avatar').forEach(x=>x.classList.remove('selected')); a.classList.add('selected'); state.userAvatar = 'A'+i; };
    cont.appendChild(a);
  }
}
function renderFamilyChoices(){
  const cont = $('families'); cont.innerHTML='';
  FAMILIES.forEach(f=>{
    const el = document.createElement('div'); el.className='choice'; el.textContent = f.name;
    el.onclick = ()=> {
      document.querySelectorAll('.choice').forEach(x=>x.classList.remove('active'));
      el.classList.add('active');
      state.family = f.id;
      // set mentor text live
      $('mentorText').textContent = `${f.mentor}: Ready with missions for ${f.name}.`;
    };
    cont.appendChild(el);
  });
}

function start(){
  const name = $('name').value.trim();
  const birth = parseInt($('birth').value,10);
  if(!name || !birth || birth>2016){ alert('Enter valid name & birth year (<=2016)'); return; }
  if(!state.family){ alert('Pick a career family'); return; }
  state.user = {name, birth}; save(); enterGame();
}
function quickDemo(){
  state = { user:{name:'Demo', birth:2010}, family:'tech', skills:{...DEFAULT_SKILLS}, badges:[], completed:[], reflections:[] };
  save(); enterGame();
}

function enterGame(){
  $('onboard').classList.add('hidden');
  $('game').classList.remove('hidden');
  $('userTag').textContent = `${state.user.name} • ${state.family}`;
  renderProfile();
  renderCity();
  renderMissions();
  updateFit();
}

function renderProfile(){
  $('profileName').textContent = state.user.name;
  $('profileMeta').textContent = `Born ${state.user.birth}`;
  $('avatarLarge').textContent = state.userAvatar || 'A';
  // skills UI
  const skCont = $('skills'); skCont.innerHTML='';
  Object.entries(state.skills).forEach(([k,v])=>{
    const item = document.createElement('div'); item.className='skillItem';
    item.innerHTML = `<div class="skillIcon">${k[0].toUpperCase()}</div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between"><div style="text-transform:capitalize">${k}</div><div>${v}</div></div>
        <div class="skillBar"><div class="skillFill" id="fill-${k}" style="width:${Math.min(100,v*10)}%"></div></div>
      </div>`;
    skCont.appendChild(item);
  });
  // badges
  const bd = $('badges'); bd.innerHTML='';
  state.badges.forEach(b=>{ const el = document.createElement('div'); el.className='badge'; el.textContent=b; bd.appendChild(el); });
}

function renderCity(){
  const city = $('city'); city.innerHTML='';
  FAMILIES.forEach(f=>{
    const b = document.createElement('div'); b.className='building';
    b.innerHTML = `<div style="font-size:12px">${f.name.split(' ')[0]}</div><div style="font-size:11px;color:var(--muted)">${f.mentor}</div>`;
    if(f.id === state.family) b.classList.add('active');
    b.onclick = ()=> {
      state.family = f.id; document.querySelectorAll('.building').forEach(x=>x.classList.remove('active')); b.classList.add('active');
      $('mentorText').textContent = `${f.mentor}: Missions refreshed for ${f.name}.`;
      renderMissions();
      save();
    };
    city.appendChild(b);
  });
}

function renderMissions(){
  const list = $('missionList'); list.innerHTML='';
  const pool = MISSIONS[state.family] || [];
  pool.forEach(m => {
    const card = document.createElement('div'); card.className='missionCard';
    card.innerHTML = `<div><strong>${m.title}</strong><div class="meta">${m.type}</div></div>
      <div><button class="btn primary" data-id="${m.id}">Start</button></div>`;
    list.appendChild(card);
    card.querySelector('button').onclick = ()=> startMission(m);
  });
}

function toggleModal(show, contentHtml=''){
  const modal = $('modal');
  if(show){
    $('modalContent').innerHTML = contentHtml;
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
    $('modalContent').innerHTML = '';
  }
}

function startMission(mission){
  // render mission steps via modal
  let stepIndex = 0;
  const steps = mission.steps || [];
  const renderStep = ()=>{
    const s = steps[stepIndex];
    if(!s) return finalize();
    let html = `<h3>${mission.title}</h3><p class="muted">${mission.type}</p><hr>`;
    if(s.opts){
      html += `<p>${s.q}</p>`;
      html += s.opts.map((o,i)=>`<button class="btn ghost optBtn" data-i="${i}" style="margin:6px">${o}</button>`).join('');
    } else {
      html += `<p>${s.q}</p><textarea id="resp" placeholder="Write 1-2 lines"></textarea>`;
      html += `<div style="margin-top:8px"><button id="submitText" class="btn primary">Submit</button></div>`;
    }
    toggleModal(true, html);

    // wire handlers
    document.querySelectorAll('.optBtn').forEach(btn=>{
      btn.onclick = (e)=> {
        const chosen = parseInt(btn.getAttribute('data-i'),10);
        const correct = s.correct;
        // small feedback
        const win = (chosen === correct);
        if(win){ state.skills = applyEffects(state.skills, s.effects || {}, 1); toast('Good choice! Skill +'); }
        else { state.skills = applyEffects(state.skills, s.effects || {}, 0.6); toast('Nice attempt — keep going'); }
        stepIndex++; save(); renderProfile(); renderMissions(); renderCity(); updateFit(); renderModalStep();
      };
    });
    const submit = $('submitText');
    if(submit){
      submit.onclick = ()=> {
        const text = $('resp').value || '';
        // treat as success, give effects
        state.skills = applyEffects(state.skills, s.effects || {}, 1);
        state.completed.push(mission.id+"-"+stepIndex);
        stepIndex++; save(); renderProfile(); updateFit(); toast('Well done — mission step saved'); renderModalStep();
      };
    }
  };
  const renderModalStep = ()=> {
    if(stepIndex < steps.length) renderStep();
    else {
      toggleModal(true, `<h3>Mission Complete</h3><p>You finished "${mission.title}".</p><button id="finishBtn" class="btn primary">Close</button>`);
      $('finishBtn').onclick = ()=> { toggleModal(false); if(!state.badges.includes(mission.title)) state.badges.push(mission.title); save(); renderProfile(); updateFit(); };
    }
  };
  renderModalStep();
}

function applyEffects(skills, effects, multiplier=1){
  const copy = {...skills};
  Object.entries(effects || {}).forEach(([k,v]) => {
    copy[k] = (copy[k] || 0) + Math.round(v * multiplier);
  });
  state.skills = copy;
  return copy;
}

function toast(msg){
  // simple transient toast in modal if needed
  toggleModal(true, `<div style="padding:12px">${msg}</div>`);
  setTimeout(()=> toggleModal(false), 900);
}

function updateFit(){
  const w = { health:{empathy:0.5,analysis:0.3,communication:0.2}, tech:{analysis:0.6,creativity:0.2,communication:0.2},
    design:{creativity:0.6,communication:0.2,analysis:0.2}, biz:{communication:0.4,analysis:0.4,creativity:0.2}, edu:{communication:0.4,empathy:0.4,analysis:0.2} }[state.family] || {analysis:0.4,creativity:0.3,communication:0.3};

  let score = 0;
  Object.entries(w).forEach(([k,wk])=> score += (state.skills[k]||0) * wk );
  const fit = Math.max(0, Math.min(100, Math.round(score*8)));
  $('fitScore').textContent = fit+'%';
  $('summary').textContent = `Missions done: ${state.completed.length}`;
  // animate skill fills
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

function resetAll(){
  if(confirm('Reset all progress?')){ localStorage.removeItem('careerSim_v2'); location.reload(); }
}

function saveReflection(){
  const text = $('reflection').value.trim();
  if(!text) return alert('Write something');
  state.reflections.push({text, date:new Date().toISOString()});
  save(); $('reflection').value=''; alert('Reflection saved');
}

init();
