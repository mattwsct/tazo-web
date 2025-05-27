document.addEventListener('DOMContentLoaded', () => {
  const kickUser = 'tazo';
  const twitchUser = 'tazo';
  const debugMode = new URLSearchParams(location.search).get('debug') === '1';

  const SW = document.getElementById('streamWrapper');
  const SE = document.getElementById('stream');
  const linksEl = document.getElementById('links');

  let kickLive = false, twitchLive = false, current = null;
  let forceKick = false, forceTwitch = false;
  let kickFailUntil = 0, twitchFailUntil = 0;

  const lbl = id => document.getElementById(`${id}-lbl`);
  const setBadge = (id, on) =>
    lbl(id)?.classList[on ? 'add' : 'remove'](
      'after:content-["●_LIVE"]',
      'after:text-red-500',
      'after:animate-pulse',
      'after:font-bold'
    );

  const showLiveLinks = on => {
    document.querySelectorAll('.live-only-link')
      .forEach(el => el.classList.toggle('hidden', !on));
  };

  const mountEmbed = (src, plat) => {
    SE.innerHTML = '';
    SW.querySelector('.stream-glow')?.remove();

    const iframe = Object.assign(document.createElement('iframe'), {
      src,
      className: 'w-full aspect-video rounded-xl',
      allowFullscreen: true,
      loading: 'lazy'
    });
    SE.appendChild(iframe);

    const glow = document.createElement('div');
    glow.className = `stream-glow absolute -inset-2 blur-2xl opacity-20 ${
      plat === 'kick' ? 'bg-green-500' : 'bg-purple-500'
    } animate-pulse rounded-xl z-0`;
    SW.querySelector('.relative.z-10')?.prepend(glow);

    SW.classList.remove('hidden');
    current = plat;
  };

  const clearEmbed = () => {
    SE.innerHTML = '';
    SW.querySelector('.stream-glow')?.remove();
    SW.classList.add('hidden');
    current = null;
  };

  /* ───── Debug panel ───── */
  if (debugMode) {
    const p = document.createElement('div');
    p.className = 'fixed top-4 right-4 bg-zinc-900 p-4 rounded-xl z-50 flex gap-3';
    p.innerHTML = `
      <button id="dbgKick" class="px-3 py-1 bg-green-600 text-white rounded">Show Kick</button>
      <button id="dbgTwitch" class="px-3 py-1 bg-purple-600 text-white rounded">Show Twitch</button>`;
    document.body.appendChild(p);

    const btnK = document.getElementById('dbgKick');
    const btnT = document.getElementById('dbgTwitch');

    const updateLabels = () => {
      btnK.textContent = (forceKick ? 'Hide ' : 'Show ') + 'Kick';
      btnT.textContent = (forceTwitch ? 'Hide ' : 'Show ') + 'Twitch';
    };

    btnK.onclick = () => {
      forceKick = !forceKick;
      kickLive = forceKick;
      refresh();
      updateLabels();
    };

    btnT.onclick = () => {
      forceTwitch = !forceTwitch;
      twitchLive = forceTwitch;
      refresh();
      updateLabels();
    };

    updateLabels();
  }

  async function refresh() {
    ['kick', 'twitch'].forEach(id => setBadge(id, false));
    kickLive = twitchLive = false;

    if (debugMode) {
      kickLive = forceKick;
      twitchLive = forceTwitch;
    } else {
      const now = Date.now();

      if (now > kickFailUntil) {
        try {
          kickLive = !!(await fetch(`https://kick.com/api/v2/channels/${kickUser}`).then(r => r.json())).livestream;
        } catch {
          kickFailUntil = now + 300000;
        }
      }

      if (now > twitchFailUntil) {
        try {
          const txt = await fetch(`https://decapi.me/twitch/uptime/${twitchUser}`).then(r => r.text());
          twitchLive = !/is\s+offline/i.test(txt);
        } catch {
          twitchFailUntil = now + 300000;
        }
      }
    }

    setBadge('kick', kickLive);
    setBadge('twitch', twitchLive);
    showLiveLinks(kickLive || twitchLive);

    if (kickLive) {
      mountEmbed(`https://player.kick.com/${kickUser}`, 'kick');
    } else if (twitchLive) {
      mountEmbed(
        `https://player.twitch.tv/?channel=${twitchUser}&parent=${location.hostname}&muted=true&chat=false`,
        'twitch'
      );
    } else {
      clearEmbed();
    }
  }

  fetch('links.json').then(r => r.json()).then(data => {
    data.filter(link => link.showOnHomepage).forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = ['twitter', 'x', 'instagram', 'youtube', 'tiktok'].includes(link.id)
        ? 'me noopener'
        : 'noopener';
      a.className = `flex items-center gap-2 justify-center py-3 px-5 rounded-xl font-semibold bg-gradient-to-r ${link.bg}
                     transition hover:scale-[1.03] hover:ring-2 hover:ring-white/10`;
      a.innerHTML = link.icon
        ? `<img src="https://cdn.simpleicons.org/${link.icon}/fff" class="w-5 h-5"/><span id="${link.id}-lbl">${link.title}</span>`
        : `<span id="${link.id}-lbl">${link.title}</span>`;

      if (link.liveOnly) a.classList.add('live-only-link', 'hidden');
      linksEl.appendChild(a);
    });

    // Delay first refresh until all links exist
    setTimeout(() => {
      refresh();
      if (!debugMode) setInterval(refresh, 60000);
    }, 100);
  });
});
