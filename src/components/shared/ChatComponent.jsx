// src/components/shared/ChatComponent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { 
  MessageCircle, 
  Send, 
  X, 
  ChevronDown, 
  ChevronUp,
  Circle
} from 'lucide-react';

const ChatComponent = () => {
  const { 
    messages, 
    unreadCount, 
    isChatOpen, 
    setIsChatOpen, 
    addMessage, 
    markMessagesAsRead,
    isAdminOnline,
    isTyping,
    updateTypingStatus
  } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [userScrolled, setUserScrolled] = useState(false);

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

  // Set up real-time updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'kasoowaChats' && isChatOpen && !isMinimized) {
        markMessagesAsRead();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isChatOpen, isMinimized, markMessagesAsRead]);

  // Scroll handling
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current && !userScrolled) {
        const { scrollHeight, clientHeight } = chatContainerRef.current;
        chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
      }
    };

    if (isChatOpen && !isMinimized) {
      scrollToBottom();
      markMessagesAsRead();
    }
  }, [messages, isChatOpen, isMinimized, markMessagesAsRead, userScrolled]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setUserScrolled(!isAtBottom);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    updateTypingStatus(true, false);
    
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false, false);
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setUserScrolled(false); // Reset user scroll when sending a message
      addMessage(newMessage);
      setNewMessage('');
      updateTypingStatus(false, false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    setIsMinimized(false);
    setUserScrolled(false);
    if (!isChatOpen) {
      setTimeout(() => {
        markMessagesAsRead();
      }, 100);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      markMessagesAsRead();
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

  return (
    <>
      {isChatOpen && !isMinimized && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" onClick={toggleChat} />
      )}
      <div className="fixed bottom-4 right-4 z-[9999]">
        {/* Chat Button with Unread Count */}
        {!isChatOpen && (
          <button 
            onClick={toggleChat}
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

        {/* Chat Window */}
        {isChatOpen && (
          <div 
            className={`
              w-80 bg-white rounded-lg shadow-xl border border-gray-200 
              flex flex-col transition-all duration-300 ease-in-out
              ${isMinimized ? 'h-12 overflow-hidden' : 'h-[500px]'}
            `}
          >
            {/* Chat Header */}
            <div className="bg-green-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Customer Support</h3>
                <p className="text-xs flex items-center">
                  {isAdminOnline ? (
                    <span className="flex items-center">
                      <Circle className="h-2 w-2 fill-green-400 text-green-400 mr-1 animate-pulse" />
                      Admin Online
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Circle className="h-2 w-2 fill-gray-400 text-gray-400 mr-1" />
                      Currently Offline
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={toggleMinimize}
                  className="hover:bg-green-700 p-1 rounded-full transition-colors"
                >
                  {isMinimized ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </button>
                <button 
                  onClick={toggleChat}
                  className="hover:bg-green-700 p-1 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Container */}
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
                          ? 'bg-green-100 text-gray-900 mr-auto' 
                          : 'bg-white text-gray-900 ml-auto'}
                        rounded-lg p-3 text-sm shadow-sm
                      `}
                    >
                      <div className="break-words">
                        {formatMessageWithLinks(msg.text)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right flex items-center justify-end">
                        <span className="mr-1">{getMessageTime(msg.timestamp)}</span>
                        {!msg.isAdmin && (
                          <span className={`text-xs ${msg.delivered ? 'text-green-600' : 'text-gray-400'}`}>
                            {msg.delivered ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping.admin && (
                    <div className="text-sm text-gray-500 animate-pulse flex items-center">
                      <div className="bg-white rounded-full p-3 shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                      <span className="ml-2">Admin is typing...</span>
                    </div>
                  )}
                </div>

                {/* Message Input */}
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

export default ChatComponent;