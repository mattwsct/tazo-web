document.addEventListener('DOMContentLoaded', () => {
  const kickUser = 'tazo';
  const twitchUser = 'tazo';
  const streamWrapper = document.getElementById('streamWrapper');
  const streamEl = document.getElementById('stream');
  const linksEl = document.getElementById('links');
  let currentPlatform = null;

  // Render homepage links
  fetch('links.json')
    .then(res => res.json())
    .then(links => {
      links
        .filter(link => link.showOnHomepage)
        .forEach(link => {
          const a = document.createElement('a');
          a.href = `/${link.id}`;
          a.className = `flex items-center gap-2 justify-center py-3 px-5 rounded-xl font-semibold bg-gradient-to-r ${link.bg} transition scale-[1] hover:scale-[1.03]`;

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

          linksEl.appendChild(a);
        });
    });

  function markLive(id) {
    const label = document.getElementById(`${id}-lbl`);
    if (label && !label.innerHTML.includes('●')) {
      label.innerHTML += ' <span class="text-red-500 animate-pulse">●</span>';
    }
  }

  function unmarkLive() {
    ['kick', 'twitch'].forEach(id => {
      const label = document.getElementById(`${id}-lbl`);
      if (label) label.innerHTML = label.innerHTML.replace(/ <span.*<\/span>/, '');
    });
  }

  function setIframe(src, platform) {
    streamEl.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.className = 'w-full aspect-video rounded-xl';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    streamEl.appendChild(iframe);

    // Remove old glow
    streamWrapper.querySelector('.stream-glow')?.remove();

    // Add new glow
    const glowColor = platform === 'kick' ? 'bg-green-500' : 'bg-purple-500';
    const glowDiv = document.createElement('div');
    glowDiv.className = `stream-glow absolute -inset-2 blur-2xl opacity-20 ${glowColor} animate-pulse rounded-xl`;
    streamWrapper.querySelector('.relative.z-10').prepend(glowDiv);

    streamWrapper.classList.remove('hidden');
  }

  async function checkLive() {
    let kickLive = false;
    let twitchLive = false;

    try {
      const res = await fetch(`https://kick.com/api/v2/channels/${kickUser}`);
      const data = await res.json();
      kickLive = !!data.livestream;
      if (kickLive) markLive('kick');
    } catch {}

    try {
      const text = await fetch(`https://decapi.me/twitch/status/${twitchUser}`).then(r => r.text());
      twitchLive = text.toLowerCase().includes('is live');
      if (twitchLive) markLive('twitch');
    } catch {}

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
