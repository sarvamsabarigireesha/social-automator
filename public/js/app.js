const $ = sel => document.querySelector(sel);

async function loadRules() {
  const rules = await fetch('/api/rules').then(r => r.json());
  const tbody = $('#rulesTable tbody');
  tbody.innerHTML = rules.map(r => `
    <tr>
      <td>${r.platform}</td>
      <td>${r.keyword}</td>
      <td>${r.reply_text}</td>
      <td>${r.send_dm ? '✅' : '—'}</td>
      <td><span class="badge ${r.active ? 'active' : 'inactive'}">${r.active ? 'ON' : 'OFF'}</span></td>
      <td>
        <button onclick="toggleRule(${r.id})">${r.active ? 'Disable' : 'Enable'}</button>
        <button class="del-btn" onclick="deleteRule(${r.id})">Delete</button>
      </td>
    </tr>`).join('');
}

async function toggleRule(id) {
  await fetch(`/api/rules/${id}/toggle`, { method: 'PATCH' });
  loadRules();
}
async function deleteRule(id) {
  await fetch(`/api/rules/${id}`, { method: 'DELETE' });
  loadRules();
}

$('#ruleForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await fetch('/api/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform: fd.get('platform'),
      keyword: fd.get('keyword'),
      reply_text: fd.get('reply_text'),
      send_dm: fd.get('send_dm') === 'on',
      dm_text: fd.get('dm_text')
    })
  });
  e.target.reset();
  loadRules();
});

async function loadPosts() {
  const posts = await fetch('/api/posts').then(r => r.json());
  const tbody = $('#postsTable tbody');
  tbody.innerHTML = posts.map(p => `
    <tr>
      <td>${p.platform}</td>
      <td>${p.caption || ''}</td>
      <td>${new Date(p.scheduled_time).toLocaleString()}</td>
      <td>${p.status}</td>
      <td>${p.status === 'pending' ? `<button class="del-btn" onclick="deletePost(${p.id})">Cancel</button>` : ''}</td>
    </tr>`).join('');
}

async function deletePost(id) {
  await fetch(`/api/posts/${id}`, { method: 'DELETE' });
  loadPosts();
}

$('#postForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform: fd.get('platform'),
      caption: fd.get('caption'),
      media_path: fd.get('media_path'),
      scheduled_time: new Date(fd.get('scheduled_time')).toISOString()
    })
  });
  e.target.reset();
  loadPosts();
});

async function loadLogs() {
  const logs = await fetch('/api/logs').then(r => r.json());
  const tbody = $('#logsTable tbody');
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>${l.platform}</td>
      <td>${l.action}</td>
      <td>${l.detail || ''}</td>
      <td>${new Date(l.created_at).toLocaleString()}</td>
    </tr>`).join('');
}

function refreshAll() { loadRules(); loadPosts(); loadLogs(); }
refreshAll();
setInterval(refreshAll, 15000);
