/**
 * UserSearch Component
 * Search for users to start a new chat
 */

import React, { useState } from 'react';
import { searchUsers, getOrCreateChat, type User } from '../../lib/chatApi';

interface UserSearchProps {
  onChatCreated: (chatId: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onChatCreated }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[UserSearch] Searching for:', searchQuery);
      const users = await searchUsers(searchQuery);
      console.log('[UserSearch] Results:', users);
      setResults(users);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search users';
      setError(errorMessage);
      console.error('[UserSearch] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    try {
      setLoading(true);
      const chat = await getOrCreateChat(userId);
      setQuery('');
      setResults([]);
      onChatCreated(chat._id);
    } catch (err) {
      setError('Failed to create chat');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border-b bg-white">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users to chat..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {loading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-500">{error}</div>
      )}

      {results.length > 0 && (
        <div className="mt-2 border rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
          {results.map((user) => (
            <div
              key={user._id}
              onClick={() => handleSelectUser(user._id)}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
            >
              <div className="font-semibold text-gray-900">
                {user.full_name || user.email}
              </div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="mt-2 text-sm text-gray-500">No users found</div>
      )}
    </div>
  );
};

export default UserSearch;
