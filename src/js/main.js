document.addEventListener('DOMContentLoaded', () => {
  const user = { kick: 'tazo', twitch: 'tazo' };
  const debug = new URLSearchParams(location.search).get('debug') === '1';

  const SW = document.getElementById('streamWrapper');
  const SE = document.getElementById('stream');
  const linksEl = document.getElementById('links');

  let live = { kick: false, twitch: false }, force = { kick: false, twitch: false };
  let cooldown = { kick: 0, twitch: 0 }, current = null;

  const badge = (id, on) => {
    const lbl = document.getElementById(`${id}-lbl`);
    if (!lbl) return;
    lbl.innerHTML = lbl.textContent.replace(/\s*● LIVE/, '') + (on ? ' <span class="ml-1 text-red-500 animate-pulse font-bold">● LIVE</span>' : '');
  };

  const embed = (src, plat) => {
    if (current === plat) return;
    SE.innerHTML = '';
    SW.querySelector('.stream-glow')?.remove();
    SE.appendChild(Object.assign(document.createElement('iframe'), {
      src,
      className: 'w-full aspect-video rounded-xl',
      allowFullscreen: true,
      loading: 'lazy'
    }));
    const glow = document.createElement('div');
    glow.className = `stream-glow absolute -inset-2 blur-2xl opacity-20 ${plat === 'kick' ? 'bg-green-500' : 'bg-purple-500'} animate-pulse rounded-xl z-0`;
    SW.querySelector('.relative.z-10')?.prepend(glow);
    SW.classList.remove('hidden');
    current = plat;
  };

  const clear = () => {
    SE.innerHTML = '';
    SW.querySelector('.stream-glow')?.remove();
    SW.classList.add('hidden');
    current = null;
  };

  const refresh = async () => {
    const now = Date.now();
    const prevLive = { ...live };
    const nextLive = { kick: prevLive.kick, twitch: prevLive.twitch };

    if (debug) {
      nextLive.kick = force.kick;
      nextLive.twitch = force.twitch;
    } else {
      if (now > cooldown.kick) {
        try {
          const data = await fetch(`https://kick.com/api/v2/channels/${user.kick}`).then(r => r.json());
          nextLive.kick = !!data.livestream;
        } catch {
          cooldown.kick = now + 300000;
        }
      }

      if (now > cooldown.twitch) {
        try {
          const txt = await fetch(`https://decapi.me/twitch/uptime/${user.twitch}`).then(r => r.text());
          nextLive.twitch = !/is\s+offline/i.test(txt);
        } catch {
          cooldown.twitch = now + 300000;
        }
      }
    }

    live = nextLive;

    badge('kick', live.kick);
    badge('twitch', live.twitch);

    if (live.kick && current !== 'kick') {
      embed(`https://player.kick.com/${user.kick}`, 'kick');
    } else if (!live.kick && live.twitch && current !== 'twitch') {
      embed(`https://player.twitch.tv/?channel=${user.twitch}&parent=${location.hostname}&muted=true`, 'twitch');
    } else if (!live.kick && !live.twitch && current !== null) {
      clear();
    }
  };

  if (debug) {
    const p = document.createElement('div');
    p.className = 'fixed top-4 right-4 bg-zinc-900 p-4 rounded-xl z-50 flex gap-3';
    p.innerHTML = `
      <button id="dbgKick" class="px-3 py-1 bg-green-600 text-white rounded">Show Kick</button>
      <button id="dbgTwitch" class="px-3 py-1 bg-purple-600 text-white rounded">Show Twitch</button>`;
    document.body.appendChild(p);
    ['kick', 'twitch'].forEach(id => {
      document.getElementById(`dbg${id.charAt(0).toUpperCase() + id.slice(1)}`).onclick = () => {
        force[id] = !force[id];
        refresh();
      };
    });
  }

  fetch('links.json').then(r => r.json()).then(data => {
    data.filter(l => l.showOnHomepage).forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = ['twitter', 'x', 'instagram', 'youtube', 'tiktok'].includes(link.id)
        ? 'me noopener noreferrer'
        : 'noopener noreferrer';
      a.className = `flex items-center gap-2 justify-center py-3 px-4 sm:px-5 rounded-xl font-semibold w-full sm:w-auto bg-gradient-to-r ${link.bg} transition hover:scale-[1.03] hover:ring-2 hover:ring-white/10`;
      a.innerHTML = link.icon
        ? `<img src="https://cdn.simpleicons.org/${link.icon}/fff" class="w-5 h-5" alt="${link.title} icon"/><span id="${link.id}-lbl">${link.button || link.title}</span>`
        : `<span id="${link.id}-lbl">${link.button || link.title}</span>`;
      linksEl.appendChild(a);
    });

    setTimeout(() => {
      refresh();
      if (!debug) {
        (async function refreshLoop() {
          while (true) {
            await refresh();
            await new Promise(r => setTimeout(r, 60000));
          }
        })();
      }
    }, 100);
  });
});
