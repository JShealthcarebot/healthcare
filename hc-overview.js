
// hc-overview.js — 健康總覽：今日統計 + 期間清單 + 淨值圖表
(function(){
  const user = localStorage.getItem('hc_currentUser');
  if(!user){ location.href = 'index.html'; return; }

  const KEY = (m)=>`hc_${m}_${user}`;
  const $ = (id)=>document.getElementById(id);

  function parseDate(s){
    if(!s) return null;
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s+'T00:00:00');
    const d = new Date(s);
    return isNaN(d)?null:d;
  }
  function ymd(d){
    const z=(n)=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
  }
  function load(module){
    try{ const arr = JSON.parse(localStorage.getItem(KEY(module))||'[]'); return Array.isArray(arr)?arr:[]; }
    catch(_){ return []; }
  }
  function clampDate(d,hmsEnd=false){
    const dd = new Date(d);
    if(hmsEnd){ dd.setHours(23,59,59,999); } else { dd.setHours(0,0,0,0); }
    return dd;
  }

  // ---- Today stats ----
  function computeToday(){
    const today = ymd(new Date());
    const diets = load('diet').filter(x=>ymd(parseDate(x.date||x.datetime))===today);
    const exs   = load('exercise').filter(x=>ymd(parseDate(x.date||x.datetime))===today);
    const waters= load('water').filter(x=>ymd(parseDate(x.date||x.datetime))===today);

    const intake = diets.reduce((s,x)=>s + (+x.calories || +x.kcal || 0), 0);
    const burn   = exs.reduce((s,x)=>s + (+x.calories || +x.kcal || 0), 0);
    const water  = waters.reduce((s,x)=>s + (+x.ml || +x.volume || +x.amount || 0), 0);
    const net    = intake - burn;

    $('todayIntake').textContent = `${intake} kcal`;
    $('todayBurn').textContent   = `${burn} kcal`;
    $('todayNet').textContent    = `${net} kcal`;
    $('todayWater').textContent  = `${water} ml`;
  }

  // ---- Range lists & net series ----
  function applyRange(){
    const start = $('start').value ? clampDate(new Date($('start').value)) : null;
    const end   = $('end').value ? clampDate(new Date($('end').value), true) : null;

    const diets = load('diet').filter(x=>{
      const d = parseDate(x.date||x.datetime); return d && (!start || d>=start) && (!end || d<=end);
    });
    const exs   = load('exercise').filter(x=>{
      const d = parseDate(x.date||x.datetime); return d && (!start || d>=start) && (!end || d<=end);
    });
    const waters= load('water').filter(x=>{
      const d = parseDate(x.date||x.datetime); return d && (!start || d>=start) && (!end || d<=end);
    });

    // 清單
    $('listDiet').innerHTML = diets.map(x=>`<li>${ymd(parseDate(x.date||x.datetime))}：${x.name||'食物'}（${(+x.calories||+x.kcal||0)} kcal）</li>`).join('') || '<li>（本期間沒有資料）</li>';
    $('listEx').innerHTML   = exs.map(x=>`<li>${ymd(parseDate(x.date||x.datetime))}：${x.type||x.name||'運動'}（${(+x.calories||+x.kcal||0)} kcal）</li>`).join('') || '<li>（本期間沒有資料）</li>';
    $('listWater').innerHTML= waters.map(x=>`<li>${ymd(parseDate(x.date||x.datetime))}：${(+x.ml||+x.volume||+x.amount||0)} ml</li>`).join('') || '<li>（本期間沒有資料）</li>';

    // 依日彙總 淨值 = 飲食kcal - 運動kcal
    const bucket = {};
    const add = (d,v,kind)=>{
      const k = ymd(parseDate(d));
      if(!bucket[k]) bucket[k]={intake:0,burn:0};
      bucket[k][kind]+=v;
    };
    diets.forEach(x=>add(x.date||x.datetime, +x.calories||+x.kcal||0, 'intake'));
    exs.forEach(x=>add(x.date||x.datetime, +x.calories||+x.kcal||0, 'burn'));

    const labels = Object.keys(bucket).sort();
    const net = labels.map(k=> (bucket[k].intake - bucket[k].burn));

    draw(labels, net);
  }

  // ---- Chart ----
  let chart;
  function draw(labels, net){
    const ctx = $('netChart');
    if(chart){ chart.destroy(); }
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '卡路里淨值（攝取-消耗）',
          data: net,
          tension: 0.3,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // ---- Quick ranges ----
  function setDays(n){
    const end = new Date(); const start = new Date();
    start.setDate(end.getDate()- (n-1));
    $('start').value = ymd(start);
    $('end').value = ymd(end);
    applyRange();
  }

  // wiring
  document.querySelectorAll('.quick button[data-range]').forEach(b=>{
    b.addEventListener('click', ()=> setDays(+b.dataset.range));
  });
  $('apply').addEventListener('click', applyRange);
  document.addEventListener('hc:records:updated', (e)=>{
    // 若他頁刪除後返回，本頁可重算
    computeToday(); applyRange();
  });

  // init
  // 預設 7 天
  setDays(7);
  computeToday();
})();
