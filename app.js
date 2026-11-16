let S=load();
let edit=null;

function load(){
  try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.slots)return d}catch(e){}
  return{slots:[0,1,2,3].map(i=>({color:COLORS[i*2%COLORS.length],coffee:null})),history:[]};
}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function today(){return new Date().toISOString().slice(0,10)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&','<':'<','>':'>','"':'"'}[c]))}
function days(d){if(!d)return null;const n=Math.floor((Date.now()-new Date(d))/864e5);return n>=0?n:null}
function ppList(c){return Array.isArray(c.puckPrep)?c.puckPrep:[]}

function render(){
  const g=document.getElementById('grid');
  g.innerHTML=S.slots.map((s,i)=>{
    const c=s.coffee;
    if(!c)return`<div class="card empty" onclick="openEdit(${i})"><div class="bar" style="background:${s.color}"></div><div class="plus">+</div>Slot ${i+1}<br>leer</div>`;
    const d=days(c.roastDate);
    const ratio=(c.dose&&c.yield)?'1:'+(c.yield/c.dose).toFixed(1):'';
    const tags=(c.tags||'').split(',').map(t=>t.trim()).filter(Boolean).map(t=>`<span class="tag">${esc(t)}</span>`).join('');
    const info=[c.process,c.roastType].filter(Boolean).map(esc).join(' · ');
    const pp=ppList(c).map(esc).join(' · ');
    return`<div class="card" onclick="openEdit(${i})"><div class="bar" style="background:${s.color}"></div>
      <div class="name">${esc(c.name)||'–'}</div>
      <div class="sub">${esc(c.roaster)}${c.roaster&&c.origin?' · ':''}${esc(c.origin)}</div>
      ${info?`<div class="sub">${info}</div>`:''}
      <div class="tags">${tags}</div>
      <div class="sub">${esc(c.profile)||''}</div>
      ${pp?`<div class="sub">${pp}</div>`:''}
      <div class="big"><div><b>${c.grind||'–'}</b><span>Mahlgrad</span></div><div><b>${c.time||'–'}s</b><span>Zeit</span></div></div>
      <div class="meta"><span>${c.dose||'?'}→${c.yield||'?'}g ${ratio}</span><span>${c.temp?c.temp+'°':''}</span></div>
      <div class="meta"><span>${c.rpm?c.rpm+' RPM':''}</span><span>${d!=null?d+' Tage':''}</span><span>${c.rating?'★ '+c.rating:''}</span></div>
    </div>`;
  }).join('');
}

function stepper(id,val,step,min,max){
  return`<div class="stepper"><button onclick="step('${id}',-${step},${min},${max})">−</button><input id="${id}" type="number" inputmode="decimal" step="${step}" value="${esc(val)}"><button onclick="step('${id}',${step},${min},${max})">+</button></div>`;
}
function step(id,d,min,max){
  const el=document.getElementById(id);
  let v=parseFloat(el.value);if(isNaN(v))v=0;
  v=Math.round((v+d)*100)/100;
  if(min!=null&&v<min)v=min;if(max!=null&&v>max)v=max;
  el.value=v;
}

function openEdit(i,prefill){
  edit=i;
  const s=S.slots[i];
  const c=prefill||s.coffee||{};
  const v=id=>c[id]!=null?c[id]:'';
  const f=(id,label,type)=>{
    if(type==='text')return`<label>${label}</label><input id="f_${id}" value="${esc(v(id))}">`;
    if(type==='date')return`<label>${label}</label><input id="f_${id}" type="date" value="${esc(v(id))}">`;
    if(type==='area')return`<label>${label}</label><textarea id="f_${id}" rows="3">${esc(v(id))}</textarea>`;
    if(type==='num')return`<label>${label}</label>${stepper('f_'+id,v(id),...STEP[id])}`;
  };
  const sel=(id,label,opts)=>`<label>${label}</label><select id="f_${id}"><option value="">–</option>${opts.map(o=>`<option${c[id]===o?' selected':''}>${esc(o)}</option>`).join('')}</select>`;
  const pp=ppList(c);
  const chips=PUCKPREP.map(o=>`<div class="chip${pp.includes(o)?' sel':''}" onclick="this.classList.toggle('sel')">${esc(o)}</div>`).join('');
  const sw=COLORS.map(col=>`<div class="sw ${col===s.color?'sel':''}" style="background:${col}" onclick="pickColor('${col}',this)"></div>`).join('');
  document.getElementById('panel').innerHTML=`
    <h2>Slot ${i+1}</h2>
    <label>Deckelfarbe</label><div class="colors" id="colors">${sw}</div>
    ${f('name','Name','text')}${f('roaster','Rösterei','text')}${f('origin','Herkunft','text')}
    <div class="row"><div>${sel('process','Processing',PROCESSING)}</div><div>${sel('roastType','Röstart',ROAST)}</div></div>
    ${f('tags','Geschmack (Komma getrennt)','text')}
    <div class="row"><div>${f('roastDate','Röstdatum','date')}</div><div>${f('rating','Bewertung','num')}</div></div>
    ${f('profile','DE1-Profil','text')}
    <div class="row"><div>${f('grind','Mahlgrad','num')}</div><div>${f('rpm','Drehzahl (RPM)','num')}</div></div>
    <div class="row"><div>${f('dose','Dosis (g)','num')}</div><div>${f('yield','Ertrag (g)','num')}</div></div>
    <div class="row"><div>${f('time','Zeit (s)','num')}</div><div>${f('temp','Temperatur (°C)','num')}</div></div>
    <label>Puck Prep</label><div class="chips" id="pp">${chips}</div>
    ${f('notes','Notizen','area')}
    <div class="actions">
      <button class="primary" onclick="saveEdit()">Speichern</button>
      <button onclick="closeSheet()">Abbrechen</button>
    </div>
    <div class="actions">
      ${s.coffee?'<button class="danger" onclick="finish()">Aufgebraucht → Historie</button>':''}
      <button onclick="openHist(true)">Aus Historie laden</button>
    </div>`;
  document.getElementById('sheet').classList.add('open');
}
function pickColor(col,el){
  S.slots[edit].color=col;
  document.querySelectorAll('#colors .sw').forEach(x=>x.classList.remove('sel'));
  el.classList.add('sel');
}
function closeSheet(){document.getElementById('sheet').classList.remove('open');edit=null}
function val(id){const el=document.getElementById('f_'+id);return el?el.value.trim():''}
function num(id){const v=val(id);return v===''?null:parseFloat(v)}

function readForm(){
  return{
    name:val('name'),roaster:val('roaster'),origin:val('origin'),
    process:val('process'),roastType:val('roastType'),tags:val('tags'),
    roastDate:val('roastDate'),rating:num('rating'),profile:val('profile'),
    grind:num('grind'),rpm:num('rpm'),time:num('time'),dose:num('dose'),yield:num('yield'),temp:num('temp'),
    puckPrep:Array.from(document.querySelectorAll('#pp .chip.sel')).map(x=>x.textContent),
    notes:val('notes'),updated:today()
  };
}
function saveEdit(){
  const c=readForm();
  if(!c.name){alert('Bitte einen Namen eingeben.');return}
  S.slots[edit].coffee=c;
  save();render();closeSheet();
}
function keyOf(c){return((c.name||'')+'|'+(c.roaster||'')).toLowerCase()}
function finish(){
  const c=S.slots[edit].coffee;
  if(!c)return;
  if(!confirm('Kaffee „'+c.name+'“ in die Historie verschieben?'))return;
  const k=keyOf(c);
  let h=S.history.find(x=>keyOf(x)===k);
  if(h){
    h.versions=h.versions||[];
    h.versions.push({date:h.updated,grind:h.grind,rpm:h.rpm,time:h.time,dose:h.dose,yield:h.yield,temp:h.temp,profile:h.profile,roastDate:h.roastDate,puckPrep:h.puckPrep});
    Object.assign(h,c,{versions:h.versions});
  }else{
    S.history.unshift(Object.assign({versions:[]},c));
  }
  S.slots[edit].coffee=null;
  save();render();closeSheet();
}

function openHist(pick){
  const slot=pick===true?edit:null;
  const list=S.history.map((h,i)=>{
    const v=(h.versions||[]).slice().reverse().map(x=>`${x.date||'?'}: Mahlgrad ${x.grind||'?'}${x.rpm?' @ '+x.rpm+' RPM':''}, ${x.time||'?'}s, ${x.dose||'?'}→${x.yield||'?'}g${x.profile?', '+x.profile:''}`).join('\n');
    const info=[h.process,h.roastType].filter(Boolean).join(' · ');
    const pp=ppList(h).join(', ');
    return`<div class="hitem"><div class="t">${esc(h.name)} <span style="font-weight:400;color:#9a9a9f">${esc(h.roaster)}</span></div>
      <div class="s">${esc(h.origin)}${info?' · '+esc(info):''}${h.tags?' · '+esc(h.tags):''}
Zuletzt (${h.updated||'?'}): Mahlgrad ${h.grind||'?'}${h.rpm?' @ '+h.rpm+' RPM':''}, ${h.time||'?'}s, ${h.dose||'?'}→${h.yield||'?'}g${h.temp?', '+h.temp+'°':''}${h.profile?'\nProfil: '+esc(h.profile):''}${pp?'\nPuck Prep: '+esc(pp):''}${h.rating?'\nBewertung: ★ '+h.rating:''}${v?'\n\nFrühere Einstellungen:\n'+esc(v):''}</div>
      <div class="a">
        <button class="primary" onclick="loadHist(${i})">In Slot laden</button>
        <button class="danger" onclick="delHist(${i})">Löschen</button>
      </div></div>`;
  }).join('')||'<div class="sub" style="padding:12px;color:#9a9a9f">Noch keine Einträge.</div>';
  document.getElementById('panel').innerHTML=`<h2>Historie</h2>${list}
    <div class="actions">
      <button onclick="exportData()">Backup exportieren</button>
      <button onclick="document.getElementById('imp').click()">Backup importieren</button>
      <input id="imp" type="file" accept="application/json" style="display:none" onchange="importData(this)">
    </div>
    <div class="actions"><button onclick="${slot!=null?'openEdit('+slot+')':'closeSheet()'}">Zurück</button></div>`;
  document.getElementById('sheet').classList.add('open');
  window._histSlot=slot;
}
function loadHist(i){
  let slot=window._histSlot;
  if(slot==null){
    const free=S.slots.findIndex(s=>!s.coffee);
    const ans=prompt('In welchen Slot laden? (1–4)',free>=0?free+1:'1');
    if(!ans)return;
    slot=parseInt(ans)-1;
    if(!(slot>=0&&slot<4))return;
  }
  const h=Object.assign({},S.history[i]);
  delete h.versions;
  openEdit(slot,h);
}
function delHist(i){
  if(!confirm('Eintrag löschen?'))return;
  S.history.splice(i,1);save();openHist(window._histSlot!=null?true:undefined);
}
function exportData(){
  const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  const f=new File([blob],'kaffee-backup-'+today()+'.json',{type:'application/json'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){
    navigator.share({files:[f]}).catch(()=>{});
  }else{
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=f.name;a.click();
  }
}
function importData(inp){
  const file=inp.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!d.slots||!d.history)throw 0;
      if(confirm('Aktuelle Daten durch Backup ersetzen?')){S=d;save();render();closeSheet()}
    }catch(e){alert('Ungültige Datei.')}
  };
  r.readAsText(file);
}

if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();
render();
