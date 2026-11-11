const TABS = [
  ['foryou', '★ בשבילי'], ['latest', 'הכל'], ['israel', 'ישראל'],
  ['world', 'World'], ['tech', 'Tech'], ['finance', 'שוק ההון']
];
let tab = 'latest';
try { tab = localStorage.getItem('tab') || 'latest'; } catch {}
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ago = d => {
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
};

function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([id, label]) =>
    `<button class="${id === tab ? 'on' : ''}" data-t="${id}">${label}</button>`).join('');
}

document.addEventListener('click', async e => {
  const t = e.target.closest('#tabs button');
  if (t) {
    tab = t.dataset.t;
    try { localStorage.setItem('tab', tab); } catch {}
    return load();
  }
  const v = e.target.closest('.votes button');
  if (v) {
    const itemId = v.parentElement.dataset.id;
    const vote = v.classList.contains('on') ? 0 : Number(v.dataset.v);
    await fetch('api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, vote })
    }).catch(() => {});
    return load();
  }
});

function card(i) {
  return `<article dir="auto" class="v${i.myVote}">
    <a href="${esc(i.link)}" target="_blank" rel="noopener">${esc(i.title)}</a>
    ${i.summary ? `<p dir="auto">${esc(i.summary)}</p>` : ''}
    <footer>
      <span>${esc(i.source)} · ${ago(i.published)}${i.score !== undefined ? ` · ★${i.score}` : ''}</span>
      <span class="votes" data-id="${esc(i._id)}">
        <button data-v="1" ${i.myVote === 1 ? 'class="on"' : ''} title="עוד כאלה">👍</button>
        <button data-v="-1" ${i.myVote === -1 ? 'class="on"' : ''} title="פחות כאלה">👎</button>
      </span>
    </footer>
  </article>`;
}

async function load() {
  renderTabs();
  $('#status').textContent = '…';
  const items = await fetch(`api/items?tab=${tab}`).then(r => r.json()).catch(() => []);
  $('#status').textContent = items.length ? '' : 'אין פריטים עדיין — הרענון הראשון רץ ברקע';
  $('#list').innerHTML = items.map(card).join('');
}

async function loadSources() {
  const list = await fetch('api/sources').then(r => r.json()).catch(() => []);
  $('#sources').innerHTML = list.map(s => {
    const ok = s.lastStatus === 'ok';
    const tip = `${s.name || s._id}: ${s.lastStatus || 'never run'}${s.lastRun ? ' · ' + new Date(s.lastRun).toLocaleString() : ''}`;
    return `<span class="src" title="${esc(tip)}"><i class="dot ${ok ? 'ok' : 'bad'}"></i>${esc(s.name || s._id)}</span>`;
  }).join('');
}

load();
loadSources();
setInterval(load, 5 * 60 * 1000);
setInterval(loadSources, 5 * 60 * 1000);
