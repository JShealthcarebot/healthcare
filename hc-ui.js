
// hc-ui.js — non-invasive UI enhancement & header/avatar wiring
(function(){
  // Ensure wrapper exists without breaking existing structure
  const body = document.body;
  if(!document.querySelector('.hc-wrap')){
    const wrap = document.createElement('div');
    wrap.className = 'hc-wrap';
    while (body.firstChild) wrap.appendChild(body.firstChild);
    body.appendChild(wrap);
  }
  // Ensure a .card exists to host the page content
  if(!document.querySelector('.card')){
    const card = document.createElement('div');
    card.className = 'card';
    const wrap = document.querySelector('.hc-wrap');
    while (wrap.firstChild) card.appendChild(wrap.firstChild);
    wrap.appendChild(card);
  }

  const card = document.querySelector('.card');

  // Toolbar (avatar + logout)
  let bar = document.querySelector('.hc-toolbar');
  if(!bar){
    bar = document.createElement('div');
    bar.className = 'hc-toolbar';
    const avatar = document.createElement('div');
    avatar.className = 'hc-avatar';
    avatar.title = '個人資料（點擊前往）';
    const img = document.createElement('img');
    img.id = 'hcAvatarImg';
    img.alt = 'avatar';
    img.src = 'avatar-neutral.png';
    avatar.appendChild(img);
    const logout = document.createElement('button');
    logout.className = 'hc-logout';
    logout.textContent = '登出';
    logout.id = 'btnLogout';
    bar.appendChild(avatar);
    bar.appendChild(logout);
    card.appendChild(bar);
  }

  // Brand header
  if(!document.querySelector('.hc-header')){
    const header = document.createElement('div');
    header.className = 'hc-header';
    header.innerHTML = `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0" stop-color="#ff6b6b"/>
            <stop offset="1" stop-color="#ff9aa2"/>
          </linearGradient>
          <linearGradient id="g2" x1="0" x2="1">
            <stop offset="0" stop-color="#2b7cff"/>
            <stop offset="1" stop-color="#13c2c2"/>
          </linearGradient>
        </defs>
        <path d="M22 10c-6 0-10 4.8-10 10.7 0 11.2 20 23.8 20 23.8s20-12.6 20-23.8C52 14.8 48 10 42 10c-4.2 0-7 2.4-10 6-2.8-3.6-5.8-6-10-6z" fill="url(#g1)"/>
        <rect x="10" y="38" width="44" height="6" rx="3" fill="url(#g2)"/>
        <rect x="6" y="35" width="6" height="12" rx="2" fill="#2b7cff"/>
        <rect x="52" y="35" width="6" height="12" rx="2" fill="#13c2c2"/>
      </svg>
      <h1>health care</h1>
    `;
    card.insertBefore(header, card.firstChild);
  }

  // Optional subtitle if none exists
  if(!document.querySelector('.hc-sub')){
    const sub = document.createElement('div');
    sub.className = 'hc-sub';
    sub.textContent = '保持優雅，資料更有型 ✨（此為樣式強化，不改動功能）';
    const after = document.querySelector('.hc-header');
    after.insertAdjacentElement('afterend', sub);
  }

  // Avatar gender logic
  (function syncAvatar(){
    const g = (localStorage.getItem('hc_profile_gender') || 'neutral').toLowerCase();
    const map = { male:'avatar-male.png', female:'avatar-female.png', neutral:'avatar-neutral.png' };
    const img = document.getElementById('hcAvatarImg');
    if(img){ img.src = map[g] || map.neutral; }
  })();

  // Avatar click -> profile.html
  const av = document.querySelector('.hc-avatar');
  if(av){ av.addEventListener('click', ()=> { window.location.href='profile.html'; }); }

  // Logout (preserves existing handlers if any by also dispatching click on #logout/#btnLogout)
  const btn = document.getElementById('btnLogout');
  if(btn){
    btn.addEventListener('click', (e)=>{
      try{
        localStorage.removeItem('hc_currentUser');
        localStorage.removeItem('hc_role');
      }catch(_){}
      window.location.href = 'index.html';
    });
  }
})();
