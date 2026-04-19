/**
 * JAMSC - Queue UI Module
 * Manages queue display and interactions
 */

const Queue = (() => {
  let tracks = [];
  let currentIndex = -1;
  let dragSrcIndex = -1;

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

    const isHost = typeof Room !== 'undefined' && Room.getIsHost();

    listEl.innerHTML = tracks.map((track, index) => {
      const isActive = index === currentIndex;
      const sourceLabel = track.source === 'youtube' ? 'YT' : 'SC';
      const thumbSrc = track.thumbnail || '';
      const thumbHtml = thumbSrc
        ? `<img src="${thumbSrc}" alt="" loading="lazy" />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">🎵</div>`;

      return `
        <div class="queue-item ${isActive ? 'active' : ''}" data-track-id="${track.id}" data-index="${index}" ${isHost ? 'draggable="true"' : ''}>
          ${isHost ? `
          <div class="queue-item-drag" title="Kéo để sắp xếp">
            <svg width="12" height="16" viewBox="0 0 12 20" fill="currentColor">
              <circle cx="4" cy="4" r="1.5"/><circle cx="8" cy="4" r="1.5"/>
              <circle cx="4" cy="10" r="1.5"/><circle cx="8" cy="10" r="1.5"/>
              <circle cx="4" cy="16" r="1.5"/><circle cx="8" cy="16" r="1.5"/>
            </svg>
          </div>` : ''}
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

    // Click to skip
    listEl.querySelectorAll('.queue-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.queue-item-remove') || e.target.closest('.queue-item-drag')) return;
        const trackId = item.dataset.trackId;
        if (typeof App !== 'undefined' && App.skipToTrack) {
          App.skipToTrack(trackId);
        }
      });
    });

    // Remove button
    listEl.querySelectorAll('.queue-item-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = btn.dataset.trackId;
        if (typeof App !== 'undefined' && App.removeTrack) {
          App.removeTrack(trackId);
        }
      });
    });

    // Drag-and-drop (host only)
    if (isHost) {
      listEl.querySelectorAll('.queue-item[draggable="true"]').forEach((item) => {
        item.addEventListener('dragstart', (e) => {
          dragSrcIndex = parseInt(item.dataset.index);
          item.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(dragSrcIndex));
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          listEl.querySelectorAll('.queue-item').forEach((i) => i.classList.remove('drag-over'));
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          listEl.querySelectorAll('.queue-item').forEach((i) => i.classList.remove('drag-over'));
          item.classList.add('drag-over');
        });

        item.addEventListener('dragleave', (e) => {
          if (!item.contains(e.relatedTarget)) {
            item.classList.remove('drag-over');
          }
        });

        item.addEventListener('drop', (e) => {
          e.preventDefault();
          item.classList.remove('drag-over');
          const destIndex = parseInt(item.dataset.index);
          if (dragSrcIndex === -1 || dragSrcIndex === destIndex) return;

          // Capture current track ID before mutation
          const currentTrackId = currentIndex >= 0 ? tracks[currentIndex]?.id : null;

          // Apply reorder locally for immediate feedback
          const newTracks = [...tracks];
          const [moved] = newTracks.splice(dragSrcIndex, 1);
          newTracks.splice(destIndex, 0, moved);
          tracks = newTracks;

          // Update currentIndex to follow the playing track
          if (currentTrackId) {
            currentIndex = tracks.findIndex((t) => t.id === currentTrackId);
          }

          render();

          // Broadcast reorder to server
          const trackIds = tracks.map((t) => t.id);
          if (typeof App !== 'undefined' && App.reorderTracks) {
            App.reorderTracks(trackIds);
          }

          dragSrcIndex = -1;
        });
      });
    }
  }

  function setQueue(data) {
    tracks = data.tracks || [];
    currentIndex = data.currentIndex ?? -1;
    render();
  }

  function addTrack(track) {
    tracks.push(track);
    render();
  }

  function addBatch(newTracks) {
    newTracks.forEach((t) => tracks.push(t));
    render();
  }

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

  function setCurrentIndex(index) {
    currentIndex = index;
    render();
  }

  function updateTrackTitle(trackId, title) {
    const track = tracks.find((t) => t.id === trackId);
    if (track) {
      track.title = title;
      render();
    }
  }

  function getCurrentTrack() {
    if (currentIndex >= 0 && currentIndex < tracks.length) {
      return tracks[currentIndex];
    }
    return null;
  }

  function getTracks() {
    return tracks;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  return {
    render,
    setQueue,
    addTrack,
    addBatch,
    removeTrack,
    setCurrentIndex,
    updateTrackTitle,
    getCurrentTrack,
    getTracks,
  };
})();
