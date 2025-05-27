document.addEventListener('DOMContentLoaded', () => {
  /* ───── config & flags ───── */
  const kickUser   = 'tazo';
  const twitchUser = 'tazo';
  const debugMode  = new URLSearchParams(location.search).get('debug') === '1';

  /* ───── dom refs ───── */
  const SW = document.getElementById('streamWrapper');
  const SE = document.getElementById('stream');
  const linksEl = document.getElementById('links');

  /* ───── state ───── */
  let kickLive = false, twitchLive = false, current = null;
  let forceKick = false, forceTwitch = false;
  let kickFailUntil = 0, twitchFailUntil = 0;

  /* ───── helpers ───── */
  const lbl = id => document.getElementById(`${id}-lbl`);
  const setBadge = (id,on)=>
    lbl(id)?.classList[on?'add':'remove']('after:content-["●_LIVE"]','after:text-red-500','after:animate-pulse','after:font-bold');
  const showLiveLinks = on => {
    document.getElementById('liveLinks')?.classList.toggle('hidden', !on);
    document.querySelectorAll('.live-only-link')
      .forEach(el=>el.classList.toggle('hidden', !on));
  };
  const clearEmbed = () => {
    SE.innerHTML = '';
    SW.querySelector('.stream-glow')?.remove();
    SW.classList.add('hidden');
    current = null;
  };
  const mountEmbed = (src, plat) => {
    clearEmbed();
    const ifr = Object.assign(document.createElement('iframe'), {
      src, className:'w-full aspect-video rounded-xl', allowFullscreen:true, loading:'lazy'
    });
    SE.appendChild(ifr);

    const glow = document.createElement('div');
    glow.className = `stream-glow absolute -inset-2 blur-2xl opacity-20 ${
      plat==='kick'?'bg-green-500':'bg-purple-500'
    } animate-pulse rounded-xl z-0`;
    SW.querySelector('.relative.z-10')?.prepend(glow);

    SW.classList.remove('hidden');
    current = plat;
  };

  /* ───── debug panel ───── */
  if (debugMode) {
    const panel = document.createElement('div');
    panel.className='fixed top-4 right-4 bg-zinc-900 p-4 rounded-xl z-50 flex gap-3';
    panel.innerHTML=`
      <button id="dbgKick"   class="px-3 py-1 bg-green-600 text-white rounded">Show Kick</button>
      <button id="dbgTwitch" class="px-3 py-1 bg-purple-600 text-white rounded">Show Twitch</button>`;
    document.body.appendChild(panel);
    const btnK=document.getElementById('dbgKick');
    const btnT=document.getElementById('dbgTwitch');
    const updBtn=()=>{btnK.textContent=(kickLive?'Hide ':'Show ')+'Kick';
                      btnT.textContent=(twitchLive?'Hide ':'Show ')+'Twitch';};
    btnK.onclick=()=>{forceKick=!forceKick; refresh(); updBtn();};
    btnT.onclick=()=>{forceTwitch=!forceTwitch; refresh(); updBtn();};
  }

  /* ───── live checker ───── */
  async function refresh(){
    // reset
    ['kick','twitch'].forEach(id=>setBadge(id,false));
    kickLive = twitchLive = false;

    if (debugMode){
      kickLive   = forceKick;
      twitchLive = forceTwitch;
    } else {
      const now = Date.now();

      if (now>kickFailUntil){
        try{
          const d=await fetch(`https://kick.com/api/v2/channels/${kickUser}`).then(r=>r.json());
          kickLive = !!d.livestream;
        }catch{ kickFailUntil = now + 300000; } // 5-min back-off
      }
      if (now>twitchFailUntil){
        try{
          const t=await fetch(`https://decapi.me/twitch/uptime/${twitchUser}`).then(r=>r.text());
          twitchLive = !/is\s+offline/i.test(t);
        }catch{ twitchFailUntil = now + 300000; }
      }
    }

    setBadge('kick',   kickLive);
    setBadge('twitch', twitchLive);
    showLiveLinks(kickLive||twitchLive);

    if (kickLive)       mountEmbed(`https://player.kick.com/${kickUser}`, 'kick');
    else if (twitchLive)mountEmbed(`https://player.twitch.tv/?channel=${twitchUser}&parent=${location.hostname}&muted=true&chat=false`,'twitch');
    else                clearEmbed();
  }

  /* ───── render links then start ───── */
  fetch('links.json').then(r=>r.json()).then(links=>{
    links.filter(l=>l.showOnHomepage).forEach(l=>{
      const a=document.createElement('a');
      a.href=l.url; a.target='_blank';
      a.rel=['twitter','x','instagram','youtube','tiktok'].includes(l.id)?'me noopener':'noopener';
      a.className=`flex items-center gap-2 justify-center py-3 px-5 rounded-xl font-semibold bg-gradient-to-r ${l.bg} transition hover:scale-[1.03] hover:ring-2 hover:ring-white/10`;
      a.innerHTML=l.icon
        ?`<img src="https://cdn.simpleicons.org/${l.icon}/fff" class="w-5 h-5"/><span id="${l.id}-lbl">${l.title}</span>`
        :`<span id="${l.id}-lbl">${l.title}</span>`;
      if(l.liveOnly){a.classList.add('live-only-link','hidden');
                     liveLinks.appendChild(a);}
      else linksEl.appendChild(a);
    });

    refresh();
    const poll = debugMode ? 0 : 60000;
    if (poll) setInterval(refresh, poll);
  });
});
