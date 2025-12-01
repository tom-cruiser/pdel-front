import { useState, useEffect } from 'react';
import { supabase, Message } from '../../lib/supabase';
import { Mail, MailOpen, Trash2 } from 'lucide-react';

export const MessageManagement = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: !isRead })
        .eq('id', messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading messages...</div>;
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{messages.length}</p>
              <p className="text-sm text-gray-600">Total Messages</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              <p className="text-sm text-gray-600">Unread</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No messages yet</div>
          ) : (
            messages.map((message) => (
              <button
                key={message.id}
                onClick={() => {
                  setSelectedMessage(message);
                  if (!message.is_read) {
                    handleMarkAsRead(message.id, false);
                  }
                }}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedMessage?.id === message.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : message.is_read
                    ? 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    : 'bg-white border-2 border-blue-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {message.is_read ? (
                      <MailOpen className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Mail className="w-4 h-4 text-blue-600" />
                    )}
                    <span className={`font-semibold ${message.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {message.name}
                    </span>
                  </div>
                  {!message.is_read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">{message.email}</p>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{message.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(message.created_at).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        {selectedMessage ? (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedMessage.name}
                </h2>
                <p className="text-gray-600">{selectedMessage.email}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Received on {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleMarkAsRead(selectedMessage.id, selectedMessage.is_read)}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  title={selectedMessage.is_read ? 'Mark as unread' : 'Mark as read'}
                >
                  {selectedMessage.is_read ? <Mail className="w-5 h-5" /> : <MailOpen className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  title="Delete message"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border-t-2 border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Message</h3>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            <div className="border-t-2 border-gray-100 pt-6">
              <button
                onClick={() => window.open(`mailto:${selectedMessage.email}?subject=Re: Your message`)}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-6 rounded-xl font-bold hover:from-blue-600 hover:to-green-600 transition"
              >
                Reply via Email
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">Select a message to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
