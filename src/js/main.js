const kickUser = 'tazo', twitchUser = 'tazo';
const streamEl = document.getElementById('stream');
const linksEl = document.getElementById('links');
let currentPlatform = null;

// Load and display homepage buttons
fetch('/links.json')
  .then(res => res.json())
  .then(links => {
    links.filter(l => l.showOnHomepage).forEach(link => {
      const a = document.createElement('a');
      a.href = '/' + link.id;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = `flex items-center gap-2 justify-center py-3 px-5 rounded-xl font-semibold bg-gradient-to-r ${link.bg} transition-transform duration-150 ease-out hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30`;

      const icon = link.icon
        ? `<img src="https://cdn.simpleicons.org/${link.icon}/fff" class="w-5 h-5" alt="${link.icon}" /><span id="${link.icon}-lbl">${link.title}</span>`
        : `<span>${link.title}</span>`;

      a.innerHTML = icon;
      linksEl.appendChild(a);
    });
  });

// Add live dot to labels
const markLive = id => {
  const lbl = document.getElementById(id + '-lbl');
  if (lbl && !lbl.innerHTML.includes('●')) {
    lbl.innerHTML += ' <span class="text-red-500 animate-pulse">●</span>';
  }
};

// Create and insert stream iframe
const setIframe = src => {
  streamEl.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.className = 'w-full aspect-video rounded-xl shadow-lg';
  iframe.allowFullscreen = true;
  iframe.loading = 'lazy';
  streamEl.appendChild(iframe);
};

// Check livestream status and embed if live
async function checkLive() {
  let kickLive = false, twitchLive = false;

  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${kickUser}`);
    kickLive = !!(await res.json()).livestream;
    if (kickLive) markLive('kick');
  } catch {}

  try {
    const text = await fetch(`https://decapi.me/twitch/status/${twitchUser}`).then(r => r.text());
    twitchLive = text.toLowerCase().includes('is live');
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

checkLive();
setInterval(checkLive, 60000);
