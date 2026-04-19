/**
 * Room Manager - Handles room CRUD operations and permissions
 */

const rooms = new Map();

/**
 * Generate a random 6-character room code
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (I,O,0,1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure uniqueness
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

/**
 * Create a new room
 */
function createRoom(hostSocketId, hostName) {
  const code = generateRoomCode();
  const room = {
    id: code,
    hostId: hostSocketId,
    hostName: hostName,
    settings: {
      allowSeek: false,
      allowQueueAdd: true,
    },
    members: new Map(),
    createdAt: new Date(),
    hostDisconnectTimer: null,
  };
  // Add host as first member
  room.members.set(hostSocketId, {
    name: hostName,
    isHost: true,
    joinedAt: new Date(),
  });
  rooms.set(code, room);
  return room;
}

/**
 * Join an existing room
 */
function joinRoom(roomCode, socketId, memberName) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Phòng không tồn tại' };

  // Check for duplicate names
  for (const [, member] of room.members) {
    if (member.name === memberName) {
      return { error: 'Tên này đã được sử dụng trong phòng' };
    }
  }

  room.members.set(socketId, {
    name: memberName,
    isHost: false,
    joinedAt: new Date(),
  });

  // Clear host disconnect timer if host is reconnecting
  if (room.hostDisconnectTimer) {
    clearTimeout(room.hostDisconnectTimer);
    room.hostDisconnectTimer = null;
  }

  return { room };
}

/**
 * Remove a member from a room
 */
function leaveRoom(roomCode, socketId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const member = room.members.get(socketId);
  if (!member) return null;

  room.members.delete(socketId);

  const isHost = socketId === room.hostId;

  // If host left
  if (isHost) {
    if (room.members.size > 0) {
      // Transfer host to first remaining member
      const [newHostId, newHostMember] = room.members.entries().next().value;
      room.hostId = newHostId;
      room.hostName = newHostMember.name;
      newHostMember.isHost = true;
      return { room, hostTransferred: true, newHostId, newHostName: newHostMember.name };
    } else {
      // No members left, delete room
      rooms.delete(roomCode);
      return { room: null, deleted: true };
    }
  }

  return { room, hostTransferred: false };
}

/**
 * Handle host disconnect with grace period
 */
function handleHostDisconnect(roomCode, socketId, onTimeout) {
  const room = rooms.get(roomCode);
  if (!room || room.hostId !== socketId) return;

  // Grace period: 30 seconds
  room.hostDisconnectTimer = setTimeout(() => {
    const result = leaveRoom(roomCode, socketId);
    if (onTimeout) onTimeout(result);
  }, 30000);
}

/**
 * Reconnect host within grace period
 */
function reconnectHost(roomCode, socketId, newSocketId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  if (room.hostDisconnectTimer) {
    clearTimeout(room.hostDisconnectTimer);
    room.hostDisconnectTimer = null;
  }

  // Transfer host data to new socket
  const hostData = room.members.get(socketId);
  if (hostData) {
    room.members.delete(socketId);
    room.members.set(newSocketId, hostData);
    room.hostId = newSocketId;
  }

  return room;
}

/**
 * Update room settings (host only)
 */
function updateSettings(roomCode, socketId, newSettings) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Phòng không tồn tại' };
  if (room.hostId !== socketId) return { error: 'Chỉ host mới có quyền thay đổi cài đặt' };

  room.settings = { ...room.settings, ...newSettings };
  return { room };
}

/**
 * Get room by code
 */
function getRoom(roomCode) {
  return rooms.get(roomCode) || null;
}

/**
 * Get room code by socket ID
 */
function getRoomBySocket(socketId) {
  for (const [code, room] of rooms) {
    if (room.members.has(socketId)) {
      return code;
    }
  }
  return null;
}

/**
 * Serialize room for client
 */
function serializeRoom(room) {
  if (!room) return null;
  const members = [];
  for (const [id, member] of room.members) {
    members.push({
      id,
      name: member.name,
      isHost: member.isHost,
      joinedAt: member.joinedAt,
    });
  }
  return {
    id: room.id,
    hostId: room.hostId,
    hostName: room.hostName,
    settings: room.settings,
    members,
    createdAt: room.createdAt,
  };
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  handleHostDisconnect,
  reconnectHost,
  updateSettings,
  getRoom,
  getRoomBySocket,
  serializeRoom,
};
