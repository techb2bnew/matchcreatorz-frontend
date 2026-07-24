'use client';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

// Single shared Socket.IO connection for the whole web app.
// Auto-reconnects; authenticates with the JWT (mc_token cookie).

const API = process.env.NEXT_PUBLIC_API_URL || '';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (): Socket | null => {
  if (typeof window === 'undefined') return null;
  const token = Cookies.get('mc_token');
  if (!token) return null;

  // Reuse an existing live connection
  if (socket && socket.connected) return socket;

  // Re-create if token changed or socket missing
  if (socket) { socket.removeAllListeners(); socket.disconnect(); socket = null; }

  socket = io(API, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
