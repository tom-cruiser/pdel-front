/**
 * Socket.IO Client Setup
 * Manages real-time communication with the backend
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  /**
   * Initialize socket connection
   */
  connect(userId: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }
    
    this.socket = io(SOCKET_URL, {
      auth: {
        userId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();

    return this.socket;
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Join a chat room
   */
  joinChat(chatId: string): void {
    this.socket?.emit('chat:join', chatId);
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId: string): void {
    this.socket?.emit('chat:leave', chatId);
  }

  /**
   * Send a message
   */
  sendMessage(chatId: string, content: string, type: string = 'text'): void {
    this.socket?.emit('message:send', { chatId, content, type });
  }

  /**
   * Start typing indicator
   */
  startTyping(chatId: string): void {
    this.socket?.emit('typing:start', { chatId });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(chatId: string): void {
    this.socket?.emit('typing:stop', { chatId });
  }

  /**
   * Mark messages as read
   */
  markAsRead(chatId: string): void {
    this.socket?.emit('messages:read', { chatId });
  }

  /**
   * Listen for new messages
   */
  onNewMessage(callback: (data: any) => void): void {
    this.socket?.on('message:new', callback);
  }

  /**
   * Listen for message notifications
   */
  onMessageNotification(callback: (data: any) => void): void {
    this.socket?.on('message:notification', callback);
  }

  /**
   * Listen for messages read events
   */
  onMessagesRead(callback: (data: any) => void): void {
    this.socket?.on('messages:read', callback);
  }

  /**
   * Listen for typing start
   */
  onTypingStart(callback: (data: any) => void): void {
    this.socket?.on('typing:start', callback);
  }

  /**
   * Listen for typing stop
   */
  onTypingStop(callback: (data: any) => void): void {
    this.socket?.on('typing:stop', callback);
  }

  /**
   * Listen for user online status
   */
  onUserOnline(callback: (data: any) => void): void {
    this.socket?.on('user:online', callback);
  }

  /**
   * Listen for user offline status
   */
  onUserOffline(callback: (data: any) => void): void {
    this.socket?.on('user:offline', callback);
  }

  /**
   * Remove all listeners for a specific event
   */
  off(event: string): void {
    this.socket?.off(event);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
