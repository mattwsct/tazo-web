document.addEventListener('DOMContentLoaded', () => {
  const kickUser = 'tazo';
  const twitchUser = 'tazo';
  const streamWrapper = document.getElementById('streamWrapper');
  const streamEl = document.getElementById('stream');
  const linksEl = document.getElementById('links');
  let currentPlatform = null;

  const identityPlatforms = ['twitter', 'x', 'instagram', 'youtube', 'tiktok'];

  const liveLinkContainer = document.createElement('div');
  liveLinkContainer.id = 'liveLinks';
  liveLinkContainer.className = 'flex flex-col sm:flex-row justify-center gap-3 mt-3 mb-6 hidden';
  streamWrapper.appendChild(liveLinkContainer);

  // Render homepage links
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

          const icon = link.icon
            ? `<img src="https://cdn.simpleicons.org/${link.icon}/fff" class="w-5 h-5" alt="${link.icon}" />
               <span id="${link.icon}-lbl">${link.title}</span>`
            : `<span>${link.title}</span>`;

          a.innerHTML = icon;

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
    });

  function markLive(id) {
    const label = document.getElementById(`${id}-lbl`);
    if (label && !label.innerHTML.includes('●')) {
      label.innerHTML += ' <span class="text-red-500 animate-pulse font-bold">● LIVE</span>';
    }
  }

  function unmarkLive() {
    ['kick', 'twitch'].forEach(id => {
      const label = document.getElementById(`${id}-lbl`);
      if (label) {
        label.innerHTML = label.innerHTML.replace(/ <span.*?<\/span>/, '');
      }
    });
    document.querySelectorAll('.live-only-link').forEach(el => el.style.display = 'none');
    document.getElementById('liveLinks').classList.add('hidden');
  }

  function setIframe(src, platform) {
    streamEl.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.className = 'w-full aspect-video rounded-xl';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    streamEl.appendChild(iframe);

    streamWrapper.querySelector('.stream-glow')?.remove();

    const glowColor = platform === 'kick' ? 'bg-green-500' : 'bg-purple-500';
    const glowDiv = document.createElement('div');
    glowDiv.className = `stream-glow absolute -inset-2 blur-2xl opacity-20 ${glowColor} animate-pulse rounded-xl z-0`;
    streamWrapper.querySelector('.relative.z-10').prepend(glowDiv);

    streamWrapper.classList.remove('hidden');
    document.querySelectorAll('.live-only-link').forEach(el => el.style.display = 'flex');
    document.getElementById('liveLinks').classList.remove('hidden');
  }

  async function checkLive() {
    let kickLive = false;
    let twitchLive = false;

    try {
      const res = await fetch(`https://kick.com/api/v2/channels/${kickUser}`);
      const data = await res.json();
      kickLive = !!data.livestream;
    } catch {}

    try {
      const text = await fetch(`https://decapi.me/twitch/status/${twitchUser}`).then(r => r.text());
      twitchLive = text.toLowerCase().includes('is live');
    } catch {}

    if (kickLive) markLive('kick');
    if (twitchLive) markLive('twitch');

    if (kickLive || twitchLive) {
      document.querySelectorAll('.live-only-link').forEach(el => el.style.display = 'flex');
      document.getElementById('liveLinks').classList.remove('hidden');
    }

    if (kickLive && currentPlatform !== 'kick') {
      currentPlatform = 'kick';
      setIframe(`https://player.kick.com/${kickUser}`, 'kick');
    } else if (!kickLive && twitchLive && currentPlatform !== 'twitch') {
      currentPlatform = 'twitch';
      setIframe(`https://player.twitch.tv/?channel=${twitchUser}&parent=${location.hostname}&muted=true&chat=false`, 'twitch');
    } else if (!kickLive && !twitchLive && currentPlatform) {
      streamEl.innerHTML = '';
      streamWrapper.querySelector('.stream-glow')?.remove();
      streamWrapper.classList.add('hidden');
      currentPlatform = null;
      unmarkLive();
    }
  }

  checkLive();
  setInterval(checkLive, 60000);
});