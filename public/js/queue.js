/**
 * JAMSC - Queue UI Module
 * Manages queue display and interactions
 */

const Queue = (() => {
  let tracks = [];
  let currentIndex = -1;

  /**
   * Update the queue display
   */
  function render() {
    const listEl = document.getElementById('queue-list');
    const countEl = document.getElementById('queue-count');

    if (!listEl) return;

    countEl.textContent = tracks.length;

    if (tracks.length === 0) {
      listEl.innerHTML = `
        <div class="queue-empty">
          <p>Hàng chờ trống</p>
          <p class="queue-empty-hint">Thêm bài hát từ YouTube hoặc SoundCloud</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = tracks.map((track, index) => {
      const isActive = index === currentIndex;
      const sourceLabel = track.source === 'youtube' ? 'YT' : 'SC';
      const thumbSrc = track.thumbnail || '';
      const thumbHtml = thumbSrc
        ? `<img src="${thumbSrc}" alt="" loading="lazy" />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">🎵</div>`;

      return `
        <div class="queue-item ${isActive ? 'active' : ''}" data-track-id="${track.id}" data-index="${index}">
          <div class="queue-item-thumb">${thumbHtml}</div>
          <div class="queue-item-info">
            <div class="queue-item-title">${escapeHtml(track.title || 'Loading...')}</div>
            <div class="queue-item-meta">
              <span class="queue-item-source">${sourceLabel}</span>
              <span>${escapeHtml(track.addedBy)}</span>
              ${track.duration ? `<span>• ${UI.formatTime(track.duration)}</span>` : ''}
            </div>
          </div>
          <button class="queue-item-remove" data-track-id="${track.id}" title="Xóa khỏi hàng chờ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    }).join('');

    // Add click handlers
    listEl.querySelectorAll('.queue-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking remove button
        if (e.target.closest('.queue-item-remove')) return;
        const trackId = item.dataset.trackId;
        if (typeof App !== 'undefined' && App.skipToTrack) {
          App.skipToTrack(trackId);
        }
      });
    });

    listEl.querySelectorAll('.queue-item-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = btn.dataset.trackId;
        if (typeof App !== 'undefined' && App.removeTrack) {
          App.removeTrack(trackId);
        }
      });
    });
  }

  /**
   * Set full queue data
   */
  function setQueue(data) {
    tracks = data.tracks || [];
    currentIndex = data.currentIndex ?? -1;
    render();
  }

  /**
   * Add a track
   */
  function addTrack(track) {
    tracks.push(track);
    render();
  }

  /**
   * Remove a track
   */
  function removeTrack(trackId) {
    const index = tracks.findIndex((t) => t.id === trackId);
    if (index === -1) return;

    tracks.splice(index, 1);
    if (index < currentIndex) {
      currentIndex--;
    } else if (index === currentIndex && tracks.length > 0) {
      if (currentIndex >= tracks.length) currentIndex = tracks.length - 1;
    } else if (tracks.length === 0) {
      currentIndex = -1;
    }
    render();
  }

  /**
   * Set current track index
   */
  function setCurrentIndex(index) {
    currentIndex = index;
    render();
  }

  /**
   * Update track title (after it's loaded by the player)
   */
  function updateTrackTitle(trackId, title) {
    const track = tracks.find((t) => t.id === trackId);
    if (track) {
      track.title = title;
      render();
    }
  }

  /**
   * Get current track
   */
  function getCurrentTrack() {
    if (currentIndex >= 0 && currentIndex < tracks.length) {
      return tracks[currentIndex];
    }
    return null;
  }

  /**
   * Get tracks
   */
  function getTracks() {
    return tracks;
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  return {
    render,
    setQueue,
    addTrack,
    removeTrack,
    setCurrentIndex,
    updateTrackTitle,
    getCurrentTrack,
    getTracks,
  };
})();
