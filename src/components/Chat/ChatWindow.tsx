/**
 * ChatWindow Component
 * Displays messages and allows sending new messages
 */

import React, { useEffect, useState, useRef } from 'react';
import { getChatMessages, type Message, type Chat } from '../../lib/chatApi';
import { useAuth } from '../../contexts/AuthContext';
import { socketService } from '../../lib/socket';

interface ChatWindowProps {
  chat: Chat;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();
    
    // Join chat room
    socketService.joinChat(chat._id);

    // Mark messages as read
    socketService.markAsRead(chat._id);

    // Listen for new messages
    socketService.onNewMessage((data) => {
      if (data.chatId === chat._id) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      }
    });

    // Listen for typing indicators
    socketService.onTypingStart((data) => {
      if (data.chatId === chat._id && data.userId !== user?.id) {
        setTypingUsers((prev) => new Set(prev).add(data.userId));
      }
    });

    socketService.onTypingStop((data) => {
      if (data.chatId === chat._id) {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(data.userId);
          return updated;
        });
      }
    });

    return () => {
      // Leave chat room
      socketService.leaveChat(chat._id);
      socketService.off('message:new');
      socketService.off('typing:start');
      socketService.off('typing:stop');
    };
  }, [chat._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      console.log('[ChatWindow] Loading messages for chat:', chat._id);
      setLoading(true);
      const data = await getChatMessages(chat._id);
      console.log('[ChatWindow] Messages loaded:', data);
      setMessages(data);
    } catch (err) {
      console.error('[ChatWindow] Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    socketService.sendMessage(chat._id, newMessage.trim());
    setNewMessage('');
    
    // Stop typing indicator
    socketService.stopTyping(chat._id);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    // Send typing indicator
    if (value.trim()) {
      socketService.startTyping(chat._id);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(chat._id);
      }, 2000);
    } else {
      socketService.stopTyping(chat._id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    // Show time for today
    if (diffInHours < 24 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Show "Yesterday" for yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && 
        date.getMonth() === yesterday.getMonth() && 
        date.getFullYear() === yesterday.getFullYear()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Show date for older messages
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDisplayName = () => {
    if (!chat.participantDetails || chat.participantDetails.length === 0) {
      return 'Unknown User';
    }
    const participant = chat.participantDetails[0];
    return participant.full_name || participant.email;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white">
        <h2 className="text-lg font-semibold">{getDisplayName()}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === user?.id;
            
            return (
              <div
                key={message._id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm ${
                    isMine
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-white text-gray-900 border rounded-bl-none'
                  }`}
                >
                  <p className="break-words text-sm">{message.content}</p>
                  <p
                    className={`text-[10px] mt-1 text-right ${
                      isMine ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTimestamp(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-white border px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
