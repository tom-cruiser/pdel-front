/**
 * Chat Page
 * Main page for real-time user-to-user messaging
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { socketService } from '../lib/socket';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';
import { getChatById, type Chat } from '../lib/chatApi';

const ChatPage: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    console.log('[ChatPage] useEffect triggered, user:', user);
    
    // Wait a bit for user to be available if it's not ready yet
    const timer = setTimeout(() => {
      if (user?.id) {
        // Connect to Socket.IO
        console.log('[ChatPage] Connecting socket for user:', user.id);
        const socket = socketService.connect(user.id);
        console.log('[ChatPage] Socket instance:', socket);
        console.log('[ChatPage] Socket connected:', socket.connected);
        setIsConnected(socket.connected);

        // Listen for connection events
        socket.on('connect', () => {
          console.log('[ChatPage] Socket connected!');
          setIsConnected(true);
        });

        socket.on('disconnect', () => {
          console.log('[ChatPage] Socket disconnected!');
          setIsConnected(false);
        });
      } else {
        console.log('[ChatPage] ❌ User is null/undefined after timeout, cannot connect socket');
      }
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      console.log('[ChatPage] Disconnecting socket');
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [user]);

  const handleSelectChat = async (chatId: string) => {
    try {
      console.log('[ChatPage] Loading chat:', chatId);
      const chat = await getChatById(chatId);
      console.log('[ChatPage] Chat loaded:', chat);
      setSelectedChat(chat);
    } catch (err) {
      console.error('[ChatPage] Failed to load chat:', err);
      alert(`Failed to load chat: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Please log in to access chat</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Chat Interface - WhatsApp Style */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - User List - Always visible on desktop, hide on mobile when chat selected */}
          <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 bg-white border-r flex-col`}>
            <ChatList
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChat?._id}
            />
          </div>

          {/* Right Side - Chat Window - Show when chat selected, placeholder otherwise */}
          <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 bg-white flex-col w-full`}>
            {selectedChat ? (
              <>
                {/* Mobile back button */}
                <div className="md:hidden p-4 border-b bg-white flex items-center gap-4">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="text-blue-500 hover:text-blue-700 font-semibold"
                  >
                    ← Back
                  </button>
                  <h2 className="text-lg font-semibold flex-1">
                    {selectedChat.participantDetails?.[0]
                      ? selectedChat.participantDetails[0].full_name || selectedChat.participantDetails[0].email
                      : 'Chat'}
                  </h2>
                </div>
                <ChatWindow chat={selectedChat} />
              </>
            ) : (
              <div className="hidden md:flex items-center justify-center w-full h-full text-gray-500 bg-gray-50">
                <div className="text-center">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-lg">Select a user to start messaging</p>
                  <p className="text-sm text-gray-400 mt-2">Choose from your contacts on the left</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
