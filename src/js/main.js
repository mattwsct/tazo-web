const kickUser = 'tazo';
const twitchUser = 'tazo';
const streamEl = document.getElementById('stream');
let currentPlatform = null;

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
    currentPlatform = null;
  }
}

// Auto-check every 60 seconds
checkLive();
setInterval(checkLive, 60000);