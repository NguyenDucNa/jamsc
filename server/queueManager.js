/**
 * Queue Manager - Handles music queue operations per room
 */

const { v4: uuidv4 } = require('uuid');

// roomCode -> { queue: [], currentIndex: number }
const queues = new Map();

/**
 * Initialize queue for a room
 */
function initQueue(roomCode) {
  if (!queues.has(roomCode)) {
    queues.set(roomCode, {
      queue: [],
      currentIndex: -1,
    });
  }
}

/**
 * Add a track to the room's queue
 */
function addToQueue(roomCode, track) {
  initQueue(roomCode);
  const q = queues.get(roomCode);

  const queueItem = {
    id: uuidv4(),
    url: track.url,
    title: track.title || 'Unknown Track',
    thumbnail: track.thumbnail || '',
    duration: track.duration || 0,
    source: track.source, // 'youtube' | 'soundcloud'
    addedBy: track.addedBy || 'Unknown',
    addedBySocketId: track.addedBySocketId || '',
    sourceId: track.sourceId || '',
    addedAt: new Date(),
  };

  q.queue.push(queueItem);

  // If this is the first track and nothing is playing, set current
  if (q.queue.length === 1 && q.currentIndex === -1) {
    q.currentIndex = 0;
  }

  return queueItem;
}

/**
 * Remove a track from the queue
 */
function removeFromQueue(roomCode, trackId) {
  const q = queues.get(roomCode);
  if (!q) return null;

  const index = q.queue.findIndex((t) => t.id === trackId);
  if (index === -1) return null;

  const removed = q.queue.splice(index, 1)[0];

  // Adjust current index
  if (index < q.currentIndex) {
    q.currentIndex--;
  } else if (index === q.currentIndex) {
    // Current track was removed
    if (q.queue.length === 0) {
      q.currentIndex = -1;
    } else if (q.currentIndex >= q.queue.length) {
      q.currentIndex = q.queue.length - 1;
    }
  }

  return removed;
}

/**
 * Get the current track
 */
function getCurrentTrack(roomCode) {
  const q = queues.get(roomCode);
  if (!q || q.currentIndex === -1 || q.currentIndex >= q.queue.length) return null;
  return q.queue[q.currentIndex];
}

/**
 * Move to the next track
 */
function nextTrack(roomCode) {
  const q = queues.get(roomCode);
  if (!q || q.queue.length === 0) return null;

  if (q.currentIndex < q.queue.length - 1) {
    q.currentIndex++;
    return q.queue[q.currentIndex];
  }
  return null; // No more tracks
}

/**
 * Remove current track and return the next one (for consume-on-play behavior)
 */
function removeCurrentAndGetNext(roomCode) {
  const q = queues.get(roomCode);
  if (!q || q.currentIndex === -1 || q.queue.length === 0) {
    return { removedId: null, nextTrack: null };
  }

  const removedId = q.queue[q.currentIndex].id;
  q.queue.splice(q.currentIndex, 1);

  if (q.queue.length === 0) {
    q.currentIndex = -1;
    return { removedId, nextTrack: null };
  }

  if (q.currentIndex >= q.queue.length) {
    q.currentIndex = q.queue.length - 1;
  }

  return { removedId, nextTrack: q.queue[q.currentIndex] };
}

/**
 * Reorder queue tracks by providing a new ordered list of track IDs
 */
function reorderQueue(roomCode, trackIds) {
  const q = queues.get(roomCode);
  if (!q) return false;

  const currentTrackId = q.currentIndex >= 0 ? q.queue[q.currentIndex]?.id : null;
  const trackMap = new Map(q.queue.map((t) => [t.id, t]));
  const newQueue = trackIds.map((id) => trackMap.get(id)).filter(Boolean);

  if (newQueue.length !== q.queue.length) return false;

  q.queue = newQueue;

  if (currentTrackId) {
    q.currentIndex = q.queue.findIndex((t) => t.id === currentTrackId);
  }

  return true;
}

/**
 * Skip to a specific track in the queue
 */
function skipToTrack(roomCode, trackId) {
  const q = queues.get(roomCode);
  if (!q) return null;

  const index = q.queue.findIndex((t) => t.id === trackId);
  if (index === -1) return null;

  q.currentIndex = index;
  return q.queue[index];
}

/**
 * Get the full queue
 */
function getQueue(roomCode) {
  const q = queues.get(roomCode);
  if (!q) return { queue: [], currentIndex: -1 };
  return { queue: q.queue, currentIndex: q.currentIndex };
}

/**
 * Clear the queue for a room
 */
function clearQueue(roomCode) {
  queues.delete(roomCode);
}

/**
 * Serialize queue for client
 */
function serializeQueue(roomCode) {
  const { queue, currentIndex } = getQueue(roomCode);
  return {
    tracks: queue.map((t) => ({
      id: t.id,
      url: t.url,
      title: t.title,
      thumbnail: t.thumbnail,
      duration: t.duration,
      source: t.source,
      addedBy: t.addedBy,
      sourceId: t.sourceId,
    })),
    currentIndex,
    currentTrack: currentIndex >= 0 ? queue[currentIndex] : null,
  };
}

module.exports = {
  initQueue,
  addToQueue,
  removeFromQueue,
  getCurrentTrack,
  nextTrack,
  removeCurrentAndGetNext,
  reorderQueue,
  skipToTrack,
  getQueue,
  clearQueue,
  serializeQueue,
};
