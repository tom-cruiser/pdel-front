/**
 * ChatList Component
 * Displays a list of all users for chatting
 */

import React, { useEffect, useState } from 'react';
import { getAllUsers, getOrCreateChat, type User } from '../../lib/chatApi';
import { useAuth } from '../../contexts/AuthContext';

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, selectedChatId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    try {
      console.log('[ChatList] Selecting user:', userId);
      setSelectedUserId(userId);
      const chat = await getOrCreateChat(userId);
      console.log('[ChatList] Chat created/retrieved:', chat);
      if (chat && chat._id) {
        onSelectChat(chat._id);
      } else {
        console.error('[ChatList] Invalid chat object:', chat);
        setError('Failed to create chat - invalid response');
        setSelectedUserId(null);
      }
    } catch (err) {
      console.error('[ChatList] Failed to create chat:', err);
      setError(`Failed to create chat: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSelectedUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
        <button onClick={loadUsers} className="ml-2 text-blue-500 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b bg-gray-50">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* User List */}
      <div className="overflow-y-auto flex-1">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            {searchQuery ? 'No users found' : 'No users available'}
          </div>
        ) : (
          filteredUsers.map((userItem) => (
            <div
              key={userItem._id}
              onClick={() => {
                console.log('[ChatList] User clicked:', userItem);
                console.log('[ChatList] User ID:', userItem._id);
                handleSelectUser(userItem._id);
              }}
              className={`p-4 border-b cursor-pointer transition ${
                selectedUserId === userItem._id
                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {(userItem.full_name || userItem.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {userItem.full_name || 'No Name'}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">{userItem.email}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
