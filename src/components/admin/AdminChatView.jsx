// src/components/admin/AdminChatView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { Send, X, MinusIcon, Circle, MessageCircle } from 'lucide-react';

const AdminChatView = () => {
  const {
    messages,
    setMessages,
    addMessage,
    isTyping,
    updateTypingStatus,
    markMessagesAsRead,
    isChatOpen,
    setIsChatOpen,
    unreadCount
  } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const chatContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Group messages by user identifier
  const messagesByUser = React.useMemo(() => {
    const userIds = new Set();
    messages.forEach(msg => {
      if (!msg.isAdmin && msg.userIdentifier) {
        userIds.add(msg.userIdentifier);
      }
    });
    return Array.from(userIds);
  }, [messages]);

  // Track unread messages
  useEffect(() => {
    const unread = messages.filter(msg => !msg.read && !msg.isAdmin);
    setUnreadMessages(unread);
  }, [messages]);

  // Set up storage event listener for real-time updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'kasoowaChats') {
        const updatedMessages = JSON.parse(e.newValue || '[]');
        setMessages(updatedMessages);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setMessages]);

  // Mark messages as read when opening chat
  useEffect(() => {
    if (!isMinimized && isChatOpen) {
      markMessagesAsRead();
      if (shouldAutoScroll) {
        scrollToBottom();
      }
    }
  }, [isChatOpen, isMinimized, markMessagesAsRead, shouldAutoScroll]);

  // Prevent background scrolling when chat is open
  useEffect(() => {
    if (isChatOpen && !isMinimized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isChatOpen, isMinimized]);

  // Auto-scroll to bottom when new message is added and we're near bottom
  useEffect(() => {
    if (shouldAutoScroll && !isMinimized && isChatOpen) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll, isMinimized, isChatOpen]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    updateTypingStatus(true, true);
    
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false, true);
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      addMessage(newMessage, true);
      setNewMessage('');
      updateTypingStatus(false, true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      setShouldAutoScroll(true);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const getMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageWithLinks = (text) => {
    // Simplified regex for better matching
    const urlRegex = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/g;
    const words = text.split(/\s+/);
    
    return words.map((word, index) => {
      // Check if the word matches our URL pattern
      if (word.match(urlRegex)) {
        let href = word;
        
        // Add http:// if no protocol is specified
        if (!word.startsWith('http://') && !word.startsWith('https://')) {
          // Check if it's an email address
          if (word.includes('@')) {
            href = 'mailto:' + word;
          } else {
            href = 'http://' + word;
          }
        }

        return (
          <React.Fragment key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {word}
            </a>
            {' '}
          </React.Fragment>
        );
      }
      return word + ' ';
    });
  };

  // ... rest of your component remains the same from return statement onwards
  return (
    <>
      {isChatOpen && !isMinimized && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" onClick={() => setIsChatOpen(false)} />
      )}
      <div className="fixed bottom-4 right-4 z-[9999]">
        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="relative cursor-pointer w-12 h-12 flex items-center justify-center bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {isChatOpen && (
          <div className={`
            w-80 bg-white rounded-lg shadow-xl border border-gray-200 
            flex flex-col transition-all duration-300 ease-in-out
            ${isMinimized ? 'h-12 overflow-hidden' : 'h-[500px]'}
          `}>
            <div className="bg-green-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Customer Support</h2>
                <div className="text-sm mt-1 flex items-center space-x-4">
                  <span>Active Users: {messagesByUser.length}</span>
                  {unreadMessages.length > 0 && (
                    <span className="bg-red-500 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                      {unreadMessages.length} unread
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="hover:bg-green-700 p-1 rounded-full transition-colors"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="hover:bg-green-700 p-1 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
                  ref={chatContainerRef}
                  onScroll={handleScroll}
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`
                        max-w-[90%] clear-both flex flex-col
                        ${msg.isAdmin
                          ? 'bg-green-100 text-gray-900 ml-auto'
                          : 'bg-white text-gray-900 mr-auto'}
                        rounded-lg p-3 text-sm shadow-sm
                        ${!msg.read && !msg.isAdmin ? 'border-2 border-red-400' : ''}
                      `}
                    >
                      {!msg.isAdmin && (
                        <div className="text-xs font-medium text-green-600 mb-1 flex items-center">
                          <Circle className={`h-2 w-2 ${msg.read ? 'text-gray-400' : 'text-red-400 animate-pulse'} mr-1`} />
                          {msg.userIdentifier || 'Anonymous User'}
                        </div>
                      )}
                      <div className="break-words">
                        {formatMessageWithLinks(msg.text)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right flex items-center justify-end">
                        <span className="mr-1">{getMessageTime(msg.timestamp)}</span>
                        {msg.isAdmin && (
                          <span className={`text-xs ${msg.delivered ? 'text-green-600' : 'text-gray-400'}`}>
                            {msg.delivered ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping.customer && (
                    <div className="text-sm text-gray-500 animate-pulse flex items-center">
                      <div className="bg-white rounded-full p-3 shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                      <span className="ml-2">Customer is typing...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-200 bg-white rounded-b-lg"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="Type your message..."
                      className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="submit"
                      className="bg-green-600 text-white p-2 rounded-r-md hover:bg-green-700 transition-colors"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminChatView;