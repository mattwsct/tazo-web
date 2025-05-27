document.addEventListener('DOMContentLoaded', () => {
  /* ─────────────── Config ─────────────── */
  const kickUser   = 'tazo';
  const twitchUser = 'tazo';

  /* ─────────── DOM references ─────────── */
  const streamWrapper = document.getElementById('streamWrapper');
  const streamEl      = document.getElementById('stream');
  const linksEl       = document.getElementById('links');
  const debugMode     = new URLSearchParams(location.search).get('debug') === '1';

  /* ─────────── State flags ────────────── */
  let kickLive   = false;
  let twitchLive = false;
  let forceKick  = false;
  let forceTwitch= false;
  let currentPlatform = null;

  /* ─────── Live-only link container ───── */
  const liveLinks = document.createElement('div');
  liveLinks.id = 'liveLinks';
  liveLinks.className = 'flex flex-col sm:flex-row justify-center gap-3 mt-3 mb-6 hidden';
  streamWrapper.appendChild(liveLinks);

  /* ─────────── Helpers ────────────────── */
  const markLive   = id => {
    const el = document.getElementById(`${id}-lbl`);
    if (el && !el.innerHTML.includes('●')) el.innerHTML += ' <span class="text-red-500 animate-pulse font-bold">● LIVE</span>';
  };
  const clearBadges = () => ['kick','twitch'].forEach(id=>{
    const el=document.getElementById(`${id}-lbl`);
    if(el) el.innerHTML=el.innerHTML.replace(/ <span.*<\/span>/,'');
  });
  const updateDebugLabels = () => {
    if (!debugMode) return;
    btnKick.textContent   = kickLive   ? 'Hide Kick'   : 'Show Kick';
    btnTwitch.textContent = twitchLive ? 'Hide Twitch' : 'Show Twitch';
  };
  const showEmbed = (src, platform) => {
    streamEl.innerHTML = '';
    streamWrapper.querySelector('.stream-glow')?.remove();
    const iframe = Object.assign(document.createElement('iframe'), {
      src, className:'w-full aspect-video rounded-xl', allowFullscreen:true, loading:'lazy'
    });
    streamEl.appendChild(iframe);

    const glow = document.createElement('div');
    glow.className = `stream-glow absolute -inset-2 blur-2xl opacity-20 ${
      platform==='kick'?'bg-green-500':'bg-purple-500'
    } animate-pulse rounded-xl z-0`;
    streamWrapper.querySelector('.relative.z-10').prepend(glow);

    streamWrapper.classList.remove('hidden');
    document.querySelectorAll('.live-only-link').forEach(el=>el.style.display='flex');
    liveLinks.classList.remove('hidden');
    currentPlatform = platform;
  };
  const hideEmbed = () => {
    streamEl.innerHTML='';
    streamWrapper.querySelector('.stream-glow')?.remove();
    streamWrapper.classList.add('hidden');
    liveLinks.classList.add('hidden');
    currentPlatform=null;
  };

  /* ───────── Debug panel ───────── */
  let btnKick, btnTwitch;
  if (debugMode) {
    const panel = document.createElement('div');
    panel.className='fixed top-4 right-4 bg-zinc-900 p-4 rounded-xl z-50 flex gap-3';
    panel.innerHTML=`
      <button id="dbgKick"   class="px-3 py-1 bg-green-600 text-white rounded">Show Kick</button>
      <button id="dbgTwitch" class="px-3 py-1 bg-purple-600 text-white rounded">Show Twitch</button>`;
    document.body.appendChild(panel);
    btnKick   = document.getElementById('dbgKick');
    btnTwitch = document.getElementById('dbgTwitch');
    btnKick.onclick   = ()=>{forceKick=!forceKick;   refresh();};
    btnTwitch.onclick = ()=>{forceTwitch=!forceTwitch;refresh();};
  }

  /* ───────── Live‐check core ───────── */
  async function refresh(){
    clearBadges();
    kickLive   = debugMode ? forceKick   : false;
    twitchLive = debugMode ? forceTwitch : false;

    if (!debugMode){
      try{
        const d = await fetch(`https://kick.com/api/v2/channels/${kickUser}`).then(r=>r.json());
        kickLive = !!d.livestream;
      }catch{}
      try{
        const t = await fetch(`https://decapi.me/twitch/uptime/${twitchUser.toLowerCase()}`).then(r=>r.text());
        twitchLive = !/is\s+offline/i.test(t);
      }catch{}
    }

    if (kickLive)   markLive('kick');
    if (twitchLive) markLive('twitch');
    updateDebugLabels();

    if (kickLive)       showEmbed(`https://player.kick.com/${kickUser}`,'kick');
    else if (twitchLive)showEmbed(`https://player.twitch.tv/?channel=${twitchUser}&parent=${location.hostname}&muted=true&chat=false`,'twitch');
    else                {hideEmbed(); document.querySelectorAll('.live-only-link').forEach(el=>el.style.display='none');}
  }

  /* ───────── Render links, then start polling ───────── */
  fetch('links.json').then(r=>r.json()).then(links=>{
    links.filter(l=>l.showOnHomepage).forEach(l=>{
      const a=document.createElement('a');
      a.href=l.url;a.target='_blank';
      a.rel=['twitter','x','instagram','youtube','tiktok'].includes(l.id)?'me noopener':'noopener';
      a.className=`flex items-center gap-2 justify-center py-3 px-5 rounded-xl font-semibold bg-gradient-to-r ${l.bg} transition scale-[1] hover:scale-[1.03] hover:ring-2 hover:ring-white/10`;
      a.innerHTML=l.icon
        ?`<img src="https://cdn.simpleicons.org/${l.icon}/fff" class="w-5 h-5"/><span id="${l.id}-lbl">${l.title}</span>`
        :`<span id="${l.id}-lbl">${l.title}</span>`;
      if(l.liveOnly){a.classList.add('live-only-link');a.style.display='none';liveLinks.appendChild(a);}
      else linksEl.appendChild(a);
    });
    refresh(); setInterval(refresh,60000);
  });
});
