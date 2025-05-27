document.addEventListener('DOMContentLoaded', () => {
  const kickUser = 'tazo';
  const twitchUser = 'tazo';
  const streamWrapper = document.getElementById('streamWrapper');
  const streamEl = document.getElementById('stream');
  const linksEl = document.getElementById('links');
  const identityPlatforms = ['twitter', 'x', 'instagram', 'youtube', 'tiktok'];
  const debug = new URLSearchParams(location.search).get('debug') === '1';

  let currentPlatform = null;
  let forceKick = false;
  let forceTwitch = false;
  let kickLive = false;
  let twitchLive = false;

  const liveLinkContainer = document.createElement('div');
  liveLinkContainer.id = 'liveLinks';
  liveLinkContainer.className = 'flex flex-col sm:flex-row justify-center gap-3 mt-3 mb-6 hidden';
  streamWrapper.appendChild(liveLinkContainer);

  function markLive(id) {
    const label = document.getElementById(`${id}-lbl`);
    if (label && !label.innerHTML.includes('●')) {
      label.innerHTML += ' <span class="text-red-500 animate-pulse font-bold">● LIVE</span>';
    }
  }

  function unmarkLive() {
    ['kick', 'twitch'].forEach(id => {
      const label = document.getElementById(`${id}-lbl`);
      if (label) label.innerHTML = label.innerHTML.replace(/ <span.*?<\/span>/, '');
    });
    document.querySelectorAll('.live-only-link').forEach(el => (el.style.display = 'none'));
    document.getElementById('liveLinks').classList.add('hidden');
  }

  function updateDebugLabels() {
    if (!debug) return;
    document.getElementById('debug-kick').textContent = kickLive ? 'Hide Kick' : 'Show Kick';
    document.getElementById('debug-twitch').textContent = twitchLive ? 'Hide Twitch' : 'Show Twitch';
  }

  function setIframe(src, platform) {
    streamEl.innerHTML = '';
    streamWrapper.querySelector('.stream-glow')?.remove();

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.className = 'w-full aspect-video rounded-xl';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    streamEl.appendChild(iframe);

    const glow = document.createElement('div');
    glow.className = `stream-glow absolute -inset-2 blur-2xl opacity-20 ${
      platform === 'kick' ? 'bg-green-500' : 'bg-purple-500'
    } animate-pulse rounded-xl z-0`;
    streamWrapper.querySelector('.relative.z-10')?.prepend(glow);

    streamWrapper.classList.remove('hidden');
    document.querySelectorAll('.live-only-link').forEach(el => (el.style.display = 'flex'));
    document.getElementById('liveLinks').classList.remove('hidden');
  }

  async function checkLive() {
    unmarkLive();
    kickLive = false;
    twitchLive = false;

    if (debug) {
      kickLive = forceKick;
      twitchLive = forceTwitch;
    } else {
      try {
        const res = await fetch(`https://kick.com/api/v2/channels/${kickUser}`);
        const data = await res.json();
        kickLive = !!data.livestream;
      } catch {}

      try {
        const text = await fetch(`https://decapi.me/twitch/uptime/${twitchUser.toLowerCase()}`).then(r => r.text());
        twitchLive = !/is\s+offline/i.test(text);
      } catch {}
    }

    if (kickLive) markLive('kick');
    if (twitchLive) markLive('twitch');

    if (kickLive || twitchLive) {
      document.querySelectorAll('.live-only-link').forEach(el => (el.style.display = 'flex'));
      document.getElementById('liveLinks').classList.remove('hidden');
    }

    if (kickLive && currentPlatform !== 'kick') {
      currentPlatform = 'kick';
      setIframe(`https://player.kick.com/${kickUser}`, 'kick');
    } else if (!kickLive && twitchLive && currentPlatform !== 'twitch') {
      currentPlatform = 'twitch';
      setIframe(
        `https://player.twitch.tv/?channel=${twitchUser}&parent=${location.hostname}&muted=true&chat=false`,
        'twitch'
      );
    } else if (!kickLive && !twitchLive && currentPlatform) {
      streamEl.innerHTML = '';
      streamWrapper.querySelector('.stream-glow')?.remove();
      streamWrapper.classList.add('hidden');
      currentPlatform = null;
    }

    updateDebugLabels();
  }

  if (debug) {
    const debugControls = document.createElement('div');
    debugControls.className = 'fixed top-4 right-4 bg-zinc-900 p-4 rounded-xl z-50 flex gap-3';
    debugControls.innerHTML = `
      <button id="debug-kick" class="px-3 py-1 bg-green-600 text-white rounded">Show Kick</button>
      <button id="debug-twitch" class="px-3 py-1 bg-purple-600 text-white rounded">Show Twitch</button>
    `;
    document.body.appendChild(debugControls);

    document.getElementById('debug-kick').onclick = () => {
      forceKick = !forceKick;
      currentPlatform = null;
      checkLive();
    };
    document.getElementById('debug-twitch').onclick = () => {
      forceTwitch = !forceTwitch;
      currentPlatform = null;
      checkLive();
    };
  }

  fetch('links.json')
    .then(res => res.json())
    .then(links => {
      links
        .filter(link => link.showOnHomepage)
        .forEach(link => {
          const a = document.createElement('a');
          a.href = link.url;
          a.target = '_blank';
          a.rel = identityPlatforms.includes(link.id) ? 'me noopener' : 'noopener';
          a.className = `flex items-center gap-2 justify-center py-3 px-5 rounded-xl font-semibold bg-gradient-to-r ${link.bg} transition scale-[1] hover:scale-[1.03] hover:ring-2 hover:ring-white/10`;

          a.innerHTML = link.icon
            ? `<img src="https://cdn.simpleicons.org/${link.icon}/fff" class="w-5 h-5" alt="${link.icon}" />
               <span id="${link.id}-lbl">${link.title}</span>`
            : `<span id="${link.id}-lbl">${link.title}</span>`;

          a.addEventListener('click', () => {
            gtag?.('event', 'click', {
              event_category: 'Link',
              event_label: link.title,
              value: 1
            });
          });

          if (link.liveOnly) {
            a.classList.add('live-only-link');
            a.style.display = 'none';
            liveLinkContainer.appendChild(a);
          } else {
            linksEl.appendChild(a);
          }
        });

      checkLive();
      setInterval(checkLive, 60000);
    });
});
