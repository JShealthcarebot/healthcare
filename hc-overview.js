// hc-overview.js — 健康總覽：今日統計 + 區間彙總 + 淨值圖
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

  // 解析日期字串：支援 YYYY-MM-DD 或 ISO
  function toDate(s){
    if(!s) return null;
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T00:00:00');
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }
  function ymd(d){ return d.toISOString().slice(0,10); }
  function num(v){
    if(typeof v === 'number') return v;
    if(typeof v === 'string'){
      const n = parseFloat(v.replace(/[^\d.-]/g,''));
      return isNaN(n) ? 0 : n;
    }
    return 0;
  }

  // 取得三類資料
  function load(module){
    const key = `hc_${module}_${user}`;
    try{
      const arr = JSON.parse(localStorage.getItem(key)||'[]');
      return Array.isArray(arr) ? arr : [];
    }catch(_){ return []; }
  }

  // 取出某筆紀錄的日期與數值（容錯欄位名稱）
  function readDiet(rec){
    const d = toDate(rec.date || rec.datetime);
    const kcal = num(rec.kcal ?? rec.calories);
    return { d, kcal };
  }
  function readEx(rec){
    const d = toDate(rec.date || rec.datetime);
    const kcal = num(rec.kcal ?? rec.calories ?? rec.burned);
    return { d, kcal };
  }
  function readWater(rec){
    const d = toDate(rec.date || rec.datetime);
    const ml = num(rec.ml ?? rec.volume ?? rec.amount);
    return { d, ml };
  }

  // 今日統計
  function calcToday(){
    const today = new Date(); const dayStr = ymd(today);
    const diet = load('diet').map(readDiet).filter(x=>x.d && ymd(x.d)===dayStr);
    const ex   = load('exercise').map(readEx).filter(x=>x.d && ymd(x.d)===dayStr);
    const wat  = load('water').map(readWater).filter(x=>x.d && ymd(x.d)===dayStr);
    const tIn  = diet.reduce((s,x)=>s+x.kcal,0);
    const tEx  = ex.reduce((s,x)=>s+x.kcal,0);
    const tWat = wat.reduce((s,x)=>s+x.ml,0);
    els.tIntake.textContent = `${Math.round(tIn)} kcal`;
    els.tBurn.textContent   = `${Math.round(tEx)} kcal`;
    els.tNet.textContent    = `${Math.round(tIn - tEx)} kcal`;
    els.tWater.textContent  = `${Math.round(tWat)} ml`;
  }

  // 區間每日彙總 + 圖
  let chart;
  function calcRange(){
    const s = els.start.value ? new Date(els.start.value+'T00:00:00') : null;
    const e = els.end.value   ? new Date(els.end.value  +'T23:59:59') : null;
    if(!s || !e || s>e){ // 無效就預設近7天
      const now = new Date();
      const s7 = new Date(now); s7.setDate(now.getDate()-6);
      els.start.value = ymd(s7);
      els.end.value = ymd(now);
      return calcRange();
    }

    const map = {}; // ymd -> { in, ex, wat }
    function ensure(day){
      if(!map[day]) map[day] = {in:0, ex:0, wat:0};
      return map[day];
    }

    for(const r of load('diet').map(readDiet)){
      if(r.d && r.d>=s && r.d<=e){ ensure(ymd(r.d)).in += r.kcal; }
    }
    for(const r of load('exercise').map(readEx)){
      if(r.d && r.d>=s && r.d<=e){ ensure(ymd(r.d)).ex += r.kcal; }
    }
    for(const r of load('water').map(readWater)){
      if(r.d && r.d>=s && r.d<=e){ ensure(ymd(r.d)).wat += r.ml; }
    }

    // 塞滿期間天數（就算沒有資料也顯示0）
    const days = [];
    for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)){
      days.push(ymd(d));
      ensure(ymd(d));
    }

    // 更新每日彙總表
    const rows = days.map(day=>{
      const o = map[day];
      const net = o.in - o.ex;
      return `<tr>
        <td>${day}</td>
        <td>${Math.round(o.in)}</td>
        <td>${Math.round(o.ex)}</td>
        <td>${Math.round(net)}</td>
        <td>${Math.round(o.wat)}</td>
      </tr>`;
    }).join('');
    els.sumBody.innerHTML = rows;

    // 更新圖（淨值）
    const netSeries = days.map(day => (map[day].in - map[day].ex));
    const ctx = document.getElementById('netChart');
    if(chart){ chart.destroy(); }
    chart = new Chart(ctx, {
      type: 'line',
      data: { labels: days, datasets: [{ label: '卡路里淨值（攝取-消耗）', data: netSeries, tension: 0.3 }] },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: true } }
      }
    });
  }

  // 快捷範圍
  document.querySelectorAll('.qbtn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const n = parseInt(btn.dataset.q,10) || 7;
      const now = new Date();
      const s = new Date(now); s.setDate(now.getDate()-(n-1));
      els.start.value = ymd(s);
      els.end.value = ymd(now);
      calcRange();
    });
  });

  // 監聽外部清除動作
  document.addEventListener('hc:records:updated', calcRange);

  // 初始化
  (function init(){
    calcToday();
    // 預設近7天
    const now = new Date();
    const s7 = new Date(now); s7.setDate(now.getDate()-6);
    els.start.value = ymd(s7);
    els.end.value = ymd(now);
    calcRange();
  })();
})();
