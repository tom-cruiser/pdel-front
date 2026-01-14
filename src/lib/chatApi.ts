/**
 * Chat API Functions
 * HTTP API calls for chat operations
 */

import { apiGet, apiPost, apiDelete } from './api';

export interface User {
  _id: string;
  full_name: string;
  email: string;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
  sender?: User;
}

export interface Chat {
  _id: string;
  participants: string[];
  lastMessage: {
    content: string;
    senderId: string | null;
    timestamp: string | null;
  };
  unreadCount: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  participantDetails?: User[];
}

/**
 * Get all chats for the current user
 */
export async function getUserChats(): Promise<Chat[]> {
  const response = await apiGet('/chat');
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to get chats');
  }
  
  return data.data;
}

/**
 * Get or create a chat with another user
 */
export async function getOrCreateChat(otherUserId: string): Promise<Chat> {
  console.log('[chatApi] Creating/getting chat with user:', otherUserId);
  
  try {
    const response = await apiPost('/chat', { otherUserId });
    console.log('[chatApi] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[chatApi] Error response:', errorText);
      throw new Error(`Failed to create chat: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[chatApi] Chat data:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create chat');
    }
    
    return data.data;
  } catch (error) {
    console.error('[chatApi] Exception in getOrCreateChat:', error);
    throw error;
  }
}

/**
 * Get a specific chat by ID
 */
export async function getChatById(chatId: string): Promise<Chat> {
  const response = await apiGet(`/chat/${chatId}`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to get chat');
  }
  
  return data.data;
}

/**
 * Get messages for a chat
 */
export async function getChatMessages(
  chatId: string,
  limit: number = 50,
  skip: number = 0
): Promise<Message[]> {
  const response = await apiGet(`/chat/${chatId}/messages?limit=${limit}&skip=${skip}`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to get messages');
  }
  
  return data.data;
}

/**
 * Send a message (HTTP fallback - prefer Socket.IO)
 */
export async function sendMessage(
  chatId: string,
  content: string,
  type: string = 'text'
): Promise<Message> {
  const response = await apiPost(`/chat/${chatId}/messages`, { content, type });
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to send message');
  }
  
  return data.data;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(chatId: string): Promise<void> {
  const response = await apiPost(`/chat/${chatId}/read`, {});
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to mark messages as read');
  }
}

/**
 * Search for users to chat with
 */
export async function searchUsers(query: string): Promise<User[]> {
  console.log('[chatApi] Searching users with query:', query);
  const response = await apiGet(`/chat/users/search?q=${encodeURIComponent(query)}`);
  console.log('[chatApi] Search response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[chatApi] Search failed:', response.status, errorText);
    throw new Error(`Search failed: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('[chatApi] Search data:', data);
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to search users');
  }
  
  return data.data;
}

/**
 * Get all users (excluding current user)
 */
export async function getAllUsers(): Promise<User[]> {
  console.log('[chatApi] Fetching all users');
  const response = await apiGet('/chat/users');
  console.log('[chatApi] Get all users response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[chatApi] Get all users failed:', response.status, errorText);
    throw new Error(`Failed to get users: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('[chatApi] All users data:', data);
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to get users');
  }
  
  return data.data;
}

/**
 * Delete a chat
 */
export async function deleteChat(chatId: string): Promise<void> {
  const response = await apiDelete(`/chat/${chatId}`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to delete chat');
  }
}
