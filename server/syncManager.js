/**
 * Sync Manager - Handles playback synchronization across room members
 */

// roomCode -> playback state
const playbackStates = new Map();

/**
 * Initialize playback state for a room
 */
function initPlayback(roomCode) {
  if (!playbackStates.has(roomCode)) {
    playbackStates.set(roomCode, {
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      lastSyncAt: Date.now(),
      startedAt: null,
    });
  }
}

/**
 * Get the current playback state, calculating real-time position
 */
function getPlaybackState(roomCode) {
  const state = playbackStates.get(roomCode);
  if (!state) return null;

  // Calculate current position based on elapsed time
  if (state.isPlaying && state.startedAt) {
    const elapsed = (Date.now() - state.startedAt) / 1000;
    state.currentTime = state.currentTime + elapsed;
    state.startedAt = Date.now();
    state.lastSyncAt = Date.now();
  }

  return {
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    lastSyncAt: state.lastSyncAt,
  };
}

/**
 * Set the current track and reset playback
 */
function setTrack(roomCode, track) {
  initPlayback(roomCode);
  const state = playbackStates.get(roomCode);
  state.currentTrack = track;
  state.isPlaying = false;
  state.currentTime = 0;
  state.startedAt = null;
  state.lastSyncAt = Date.now();
  return getPlaybackState(roomCode);
}

/**
 * Play - start/resume playback
 */
function play(roomCode, fromTime) {
  initPlayback(roomCode);
  const state = playbackStates.get(roomCode);
  if (fromTime !== undefined) {
    state.currentTime = fromTime;
  }
  state.isPlaying = true;
  state.startedAt = Date.now();
  state.lastSyncAt = Date.now();
  return getPlaybackState(roomCode);
}

/**
 * Pause playback
 */
function pause(roomCode) {
  const state = playbackStates.get(roomCode);
  if (!state) return null;

  // Calculate current position before pausing
  if (state.isPlaying && state.startedAt) {
    const elapsed = (Date.now() - state.startedAt) / 1000;
    state.currentTime = state.currentTime + elapsed;
  }

  state.isPlaying = false;
  state.startedAt = null;
  state.lastSyncAt = Date.now();
  return getPlaybackState(roomCode);
}

/**
 * Seek to a specific time
 */
function seek(roomCode, time) {
  const state = playbackStates.get(roomCode);
  if (!state) return null;

  state.currentTime = time;
  if (state.isPlaying) {
    state.startedAt = Date.now();
  }
  state.lastSyncAt = Date.now();
  return getPlaybackState(roomCode);
}

/**
 * Clear playback state for a room
 */
function clearPlayback(roomCode) {
  playbackStates.delete(roomCode);
}

/**
 * Get heartbeat data for sync
 */
function getHeartbeat(roomCode) {
  return getPlaybackState(roomCode);
}

module.exports = {
  initPlayback,
  getPlaybackState,
  setTrack,
  play,
  pause,
  seek,
  clearPlayback,
  getHeartbeat,
};
