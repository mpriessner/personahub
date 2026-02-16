// PersonaHub Time Machine UI

let snapshots = [];
let selectedSnapshotId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadSnapshots();
});

// API helpers
async function api(endpoint, options = {}) {
  const response = await fetch(`/api${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API error');
  }
  return data;
}

// Load snapshots
async function loadSnapshots() {
  const listEl = document.getElementById('snapshot-list');
  
  try {
    const data = await api('/snapshots');
    snapshots = data.snapshots;
    renderSnapshots();
  } catch (error) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p>❌ Failed to load snapshots</p>
        <p>${error.message}</p>
        <button onclick="loadSnapshots()">Retry</button>
      </div>
    `;
  }
}

// Render snapshot list
function renderSnapshots() {
  const listEl = document.getElementById('snapshot-list');
  listEl.classList.remove('loading');
  
  if (snapshots.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p>📭 No snapshots yet</p>
        <p>Run <code>personahub save</code> to create your first snapshot</p>
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = snapshots.map(snap => `
    <div class="snapshot-card ${snap.id === selectedSnapshotId ? 'selected' : ''}" 
         onclick="selectSnapshot(${snap.id})">
      <div class="snapshot-info">
        <span class="snapshot-id">#${snap.id}</span>
        <p class="snapshot-message">${escapeHtml(snap.message || '(no message)')}</p>
        <div class="snapshot-meta">
          <span>📅 ${formatDate(snap.createdAt)}</span>
          <span>📁 ${snap.fileCount} files</span>
          <span>📦 ${formatSize(snap.totalSize)}</span>
        </div>
      </div>
      <div class="snapshot-badges">
        ${snap.isAuto ? '<span class="badge auto">🕐 Auto</span>' : ''}
        ${snap.isRestoreBackup ? '<span class="badge backup">💾 Backup</span>' : ''}
      </div>
      <div class="snapshot-actions" onclick="event.stopPropagation()">
        <button onclick="showDiff(${snap.id})">📊 Diff</button>
        <button class="danger" onclick="confirmRestore(${snap.id})">⏪ Restore</button>
      </div>
    </div>
  `).join('');
}

// Select snapshot
async function selectSnapshot(id) {
  selectedSnapshotId = id;
  renderSnapshots();
  
  const detailsSection = document.getElementById('details');
  const detailsEl = document.getElementById('snapshot-details');
  
  try {
    const snapshot = await api(`/snapshots/${id}`);
    detailsSection.classList.remove('hidden');
    
    detailsEl.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">ID</span>
        <span class="detail-value">#${snapshot.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Hash</span>
        <span class="detail-value"><code>${snapshot.hash}</code></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Message</span>
        <span class="detail-value">${escapeHtml(snapshot.message || '(none)')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Created</span>
        <span class="detail-value">${formatDate(snapshot.createdAt)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Files</span>
        <span class="detail-value">${snapshot.fileCount}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Size</span>
        <span class="detail-value">${formatSize(snapshot.totalSize)}</span>
      </div>
      <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem;">
        <button onclick="showDiff(${id})">📊 View Changes</button>
        <button class="danger" onclick="confirmRestore(${id})">⏪ Restore to this version</button>
      </div>
    `;
  } catch (error) {
    detailsEl.innerHTML = `<p>❌ ${error.message}</p>`;
  }
}

// Show diff
async function showDiff(id) {
  const diffSection = document.getElementById('diff-view');
  const diffContent = document.getElementById('diff-content');
  
  diffSection.classList.remove('hidden');
  diffContent.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading diff...</p></div>';
  
  try {
    const diff = await api(`/diff/${id}`);
    
    const added = diff.added.length;
    const removed = diff.removed.length;
    const modified = diff.modified.length;
    
    if (added === 0 && removed === 0 && modified === 0) {
      diffContent.innerHTML = `
        <div class="empty-state">
          <p>✨ No differences</p>
          <p>Snapshot matches current state</p>
        </div>
      `;
      return;
    }
    
    let html = `
      <div class="diff-summary">
        <span class="diff-stat added">+${added} added</span>
        <span class="diff-stat removed">-${removed} removed</span>
        <span class="diff-stat modified">~${modified} modified</span>
      </div>
    `;
    
    // Added files
    for (const file of diff.added) {
      html += `
        <div class="file-diff">
          <div class="file-diff-header">+ ${escapeHtml(file)} (new file)</div>
        </div>
      `;
    }
    
    // Removed files
    for (const file of diff.removed) {
      html += `
        <div class="file-diff">
          <div class="file-diff-header">- ${escapeHtml(file)} (deleted)</div>
        </div>
      `;
    }
    
    // Modified files
    for (const mod of diff.modified) {
      html += `
        <div class="file-diff">
          <div class="file-diff-header">~ ${escapeHtml(mod.path)} (${mod.linesChanged} lines changed)</div>
          <div class="file-diff-content">${formatDiff(mod.diff)}</div>
        </div>
      `;
    }
    
    diffContent.innerHTML = html;
  } catch (error) {
    diffContent.innerHTML = `<p>❌ ${error.message}</p>`;
  }
}

// Confirm restore
function confirmRestore(id) {
  if (confirm(`⚠️ Restore to snapshot #${id}?\n\nThis will:\n• Create a backup of current state\n• Overwrite current files\n\nContinue?`)) {
    doRestore(id);
  }
}

// Perform restore
async function doRestore(id) {
  try {
    const result = await api(`/restore/${id}`, { method: 'POST' });
    showToast(`✅ Restored to #${id}! Backup created as #${result.backupId}`, 'success');
    loadSnapshots();
  } catch (error) {
    showToast(`❌ Restore failed: ${error.message}`, 'error');
  }
}

// Toast notifications
function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = type;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

// Utilities
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDiff(diffText) {
  if (!diffText) return '';
  
  const lines = diffText.split('\n');
  return lines.map(line => {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      return `<div class="diff-line added">${escapeHtml(line)}</div>`;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      return `<div class="diff-line removed">${escapeHtml(line)}</div>`;
    } else if (line.startsWith('@@')) {
      return `<div class="diff-line context">${escapeHtml(line)}</div>`;
    } else {
      return `<div class="diff-line">${escapeHtml(line)}</div>`;
    }
  }).join('');
}
