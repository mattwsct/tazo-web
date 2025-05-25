const kickUser = 'tazo';
const twitchUser = 'tazo';
const streamEl = document.getElementById('stream');
const linksEl = document.getElementById('links');
let currentPlatform = null;

// Render homepage links
fetch('/links.json')
  .then(res => res.json())
  .then(links => {
    links.filter(l => l.showOnHomepage).forEach(link => {
      const a = document.createElement('a');
      a.href = '/' + link.id;
      a.className = `flex items-center gap-2 justify-center py-3 px-5 rounded-xl font-semibold bg-gradient-to-r ${link.bg} transition scale-[1] hover:scale-[1.03]`;

      if (link.icon) {
        a.innerHTML = `
          <img src="https://cdn.simpleicons.org/${link.icon}/fff" class="w-5 h-5" alt="${link.icon}" />
          <span id="${link.icon}-lbl">${link.title}</span>
        `;
      } else {
        a.innerHTML = `<span>${link.title}</span>`;
      }

      linksEl.appendChild(a);
    });
  });

function markLive(id) {
  const label = document.getElementById(id + '-lbl');
  if (label && !label.innerHTML.includes('●')) {
    label.innerHTML += ' <span class="text-red-500 animate-pulse">●</span>';
  }
}

function setIframe(src) {
  streamEl.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.className = 'w-full aspect-video rounded-xl shadow-lg';
  iframe.allowFullscreen = true;
  iframe.loading = 'lazy';
  streamEl.appendChild(iframe);
  streamEl.classList.remove('hidden');
}

async function checkLive() {
  let kickLive = false, twitchLive = false;

  try {
    const kickRes = await fetch(`https://kick.com/api/v2/channels/${kickUser}`);
    kickLive = !!(await kickRes.json()).livestream;
    if (kickLive) markLive('kick');
  } catch {}

  try {
    const twitchText = await fetch(`https://decapi.me/twitch/status/${twitchUser}`).then(r => r.text());
    twitchLive = twitchText.toLowerCase().includes('is live');
    if (twitchLive) markLive('twitch');
  } catch {}

  if (kickLive && currentPlatform !== 'kick') {
    setIframe(`https://kick.com/embed/${kickUser}?muted=true&chatEnabled=false`);
    currentPlatform = 'kick';
  } else if (!kickLive && twitchLive && currentPlatform !== 'twitch') {
    setIframe(`https://player.twitch.tv/?channel=${twitchUser}&parent=${location.hostname}&muted=true&chat=false`);
    currentPlatform = 'twitch';
  } else if (!kickLive && !twitchLive && currentPlatform) {
    streamEl.innerHTML = '';
    streamEl.classList.add('hidden');
    currentPlatform = null;
  }
}

checkLive();
setInterval(checkLive, 60000);