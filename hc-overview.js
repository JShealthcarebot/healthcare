// hc-overview.js — v2.1 tolerant today's calc + robust field fallback
(function(){
  const user = localStorage.getItem('hc_currentUser');
  if(!user){ location.href='index.html'; return; }

  const els = {
    tIntake: document.getElementById('tIntake'),
    tBurn:   document.getElementById('tBurn'),
    tNet:    document.getElementById('tNet'),
    tWater:  document.getElementById('tWater'),
    start:   document.getElementById('startDate'),
    end:     document.getElementById('endDate'),
    sumBody: document.getElementById('sumBody'),
  };

  // Helpers
  function localYMD(d){ const y=d.getFullYear(), m=('0'+(d.getMonth()+1)).slice(-2), da=('0'+d.getDate()).slice(-2); return `${y}-${m}-${da}`; }
  function toDateAny(s){
    if(!s) return null;
    if(s instanceof Date) return s;
    if(typeof s !== 'string') return null;
    const t = s.trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(t)) return new Date(t+'T00:00:00');
    if(/^\d{4}\/\d{2}\/\d{2}$/.test(t)) return new Date(t.replaceAll('/','-')+'T00:00:00');
    const d = new Date(t); return isNaN(d) ? null : d;
  }
  function num(v){ if(typeof v==='number') return v; if(typeof v==='string'){ const n=parseFloat(v.replace(/[^\d.-]/g,'')); return isNaN(n)?0:n; } return 0; }
  function within(d, s, e){ if(!d) return false; if(s && d<s) return false; if(e && d>e) return false; return true; }

  // Key detection
  function pickKey(module){
    const exact = `hc_${module}_${user}`;
    if(localStorage.getItem(exact) != null) return exact;
    let best=null, score=-1;
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i) || '';
      const v = localStorage.getItem(k) || '';
      const sc = (k.toLowerCase().includes(module)?2:0) + (k.toLowerCase().includes(user.toLowerCase())?2:0) + (v.trim().startsWith('[')?1:0);
      if(sc>score){ score=sc; best=k; }
    }
    return best;
  }
  function loadList(module){ const key=pickKey(module); if(!key) return []; try{ const a=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(a)?a:[]; }catch(_){ return []; } }

  // Field detection with tolerant fallback
  function probeFields(list, type){
    const dateCandidates = ['date','datetime','time','timestamp','createdAt','day'];
    const kcalCandidates = ['kcal','calories','cal','intake','consume','burned','energy'];
    const mlCandidates   = ['ml','volume','amount','water','intakeMl'];

    let dateKey=null, valKey=null;
    for(const it of list){
      if(!it||typeof it!=='object') continue;
      if(!dateKey){ for(const k of dateCandidates){ if(k in it && toDateAny(it[k])){ dateKey=k; break; } } }
      if(!valKey){
        const pool = (type==='water')?mlCandidates:kcalCandidates;
        for(const k of pool){ const v = it[k]; if(v!=null && !isNaN(parseFloat(String(v)))){ valKey=k; break; } }
      }
      if(dateKey && valKey) break;
    }
    // Fallbacks
    if(!dateKey) dateKey = 'date';
    if(!valKey)  valKey  = (type==='water')?'ml':'calories';
    return {dateKey, valKey};
  }

  function safeReduce(list, dateKey, valKey, predicateYmd){
    try{
      return list.reduce((s,it)=>{
        const d = toDateAny(it?.[dateKey]);
        const ok = predicateYmd ? (localYMD(d)===predicateYmd) : !!d;
        return ok ? s + num(it?.[valKey]) : s;
      }, 0);
    }catch(_){ return 0; }
  }

  // Today's stats (independent per category)
  function calcToday(){
    const todayStr = localYMD(new Date());
    const diet = loadList('diet'); const ex = loadList('exercise'); const wat = loadList('water');
    const fd = probeFields(diet,'diet'); const fe = probeFields(ex,'ex'); const fw = probeFields(wat,'water');

    const tIn  = safeReduce(diet, fd.dateKey, fd.valKey, todayStr);
    const tEx  = safeReduce(ex,   fe.dateKey, fe.valKey, todayStr);
    const tWat = safeReduce(wat,  fw.dateKey, fw.valKey, todayStr);

    els.tIntake.textContent = Math.round(tIn) + ' kcal';
    els.tBurn.textContent   = Math.round(tEx) + ' kcal';
    els.tNet.textContent    = Math.round(tIn - tEx) + ' kcal';
    els.tWater.textContent  = Math.round(tWat) + ' ml';
  }

  // Range summary + chart
  let chart;
  function calcRange(){
    if(!els.start || !els.end) return;
    const s = els.start.value? new Date(els.start.value+'T00:00:00'):null;
    const e = els.end.value? new Date(els.end.value+'T23:59:59'):null;
    if(!s||!e||s>e) return;

    const diet = loadList('diet'); const ex = loadList('exercise'); const wat = loadList('water');
    const fd = probeFields(diet,'diet'); const fe = probeFields(ex,'ex'); const fw = probeFields(wat,'water');

    const map = {}; function ensure(k){ if(!map[k]) map[k]={in:0,ex:0,wat:0}; return map[k]; }

    for(const it of diet){ const d=toDateAny(it?.[fd.dateKey]); if(d && within(d,s,e)) ensure(localYMD(d)).in += num(it?.[fd.valKey]); }
    for(const it of ex){   const d=toDateAny(it?.[fe.dateKey]); if(d && within(d,s,e)) ensure(localYMD(d)).ex += num(it?.[fe.valKey]); }
    for(const it of wat){  const d=toDateAny(it?.[fw.dateKey]); if(d && within(d,s,e)) ensure(localYMD(d)).wat += num(it?.[fw.valKey]); }

    // days
    const days=[]; for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)){ const key=localYMD(d); days.push(key); ensure(key); }

    if(els.sumBody){
      els.sumBody.innerHTML = days.map(day=>{
        const o = map[day]; const net = o.in - o.ex;
        return `<tr><td>${day}</td><td>${Math.round(o.in)}</td><td>${Math.round(o.ex)}</td><td>${Math.round(net)}</td><td>${Math.round(o.wat)}</td></tr>`;
      }).join('');
    }

    const ctx = document.getElementById('netChart');
    if(ctx){
      const netSeries = days.map(d=> map[d].in - map[d].ex);
      if(chart) chart.destroy();
      chart = new Chart(ctx, { type:'line', data:{ labels:days, datasets:[{label:'卡路里淨值（攝取-消耗）', data:netSeries, tension:.3 }]},
        options:{ responsive:true, scales:{ y:{ beginAtZero:false } } }
      });
    }
  }

  document.querySelectorAll('.qbtn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const q=btn.dataset.q, now=new Date();
      if(q==='today'){ els.start.value=localYMD(now); els.end.value=localYMD(now); }
      else{ const n=parseInt(q,10)||7; const s=new Date(now); s.setDate(now.getDate()-(n-1)); els.start.value=localYMD(s); els.end.value=localYMD(now); }
      calcRange();
    });
  });
  document.addEventListener('hc:records:updated', calcRange);

  (function init(){
    calcToday();
    const now=new Date(), s7=new Date(now); s7.setDate(now.getDate()-6);
    if(els.start && els.end){ els.start.value=localYMD(s7); els.end.value=localYMD(now); calcRange(); }
  })();
})();
