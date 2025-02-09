// src/contexts/ChatContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [isTyping, setIsTyping] = useState({
    customer: false,
    admin: false
  });
  
  // Use refs to prevent excessive re-renders
  const storageUpdateTimeout = useRef(null);
  const lastUpdate = useRef(Date.now());

  // Initialize messages and unread count
  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem('kasoowaChats') || '[]');
    setMessages(storedMessages);
    
    const isAdmin = window.location.pathname.includes('/admin');
    const unread = storedMessages.filter(msg => 
      !msg.read && (isAdmin ? !msg.isAdmin : msg.isAdmin)
    ).length;
    setUnreadCount(unread);
  }, []);

  // Listen for storage changes for real-time updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'kasoowaChats') {
        const now = Date.now();
        if (now - lastUpdate.current > 500) { // Debounce updates
          const storedMessages = JSON.parse(e.newValue || '[]');
          setMessages(storedMessages);
          
          const isAdmin = window.location.pathname.includes('/admin');
          const unread = storedMessages.filter(msg => 
            !msg.read && (isAdmin ? !msg.isAdmin : msg.isAdmin)
          ).length;
          setUnreadCount(unread);
          lastUpdate.current = now;
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Set up admin online status check
  useEffect(() => {
    const isAdmin = window.location.pathname.includes('/admin');
    
    const updateAdminStatus = () => {
      if (isAdmin) {
        localStorage.setItem('lastAdminActivity', Date.now().toString());
        localStorage.setItem('adminOnlineStatus', 'true');
        setIsAdminOnline(true);
      } else {
        const lastActivity = localStorage.getItem('lastAdminActivity');
        if (lastActivity) {
          const isStillOnline = Date.now() - parseInt(lastActivity) < 30000; // 30 seconds
          setIsAdminOnline(isStillOnline);
        }
      }
    };

    updateAdminStatus();
    const interval = setInterval(updateAdminStatus, 5000);

    return () => {
      clearInterval(interval);
      if (isAdmin) {
        localStorage.removeItem('lastAdminActivity');
        localStorage.setItem('adminOnlineStatus', 'false');
      }
    };
  }, []);

  const addMessage = useCallback((message, isAdmin = false) => {
    const userIdentifier = localStorage.getItem('userIdentifier');
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      timestamp: new Date().toISOString(),
      isAdmin,
      read: false,
      userIdentifier: !isAdmin ? userIdentifier : undefined,
      delivered: false
    };

    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newMessage];
      
      // Clear any pending updates
      if (storageUpdateTimeout.current) {
        clearTimeout(storageUpdateTimeout.current);
      }

      // Debounce localStorage updates
      storageUpdateTimeout.current = setTimeout(() => {
        localStorage.setItem('kasoowaChats', JSON.stringify(updatedMessages));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'kasoowaChats',
          newValue: JSON.stringify(updatedMessages)
        }));
      }, 100);
      
      return updatedMessages;
    });

    setTimeout(() => {
      setMessages(prevMessages => {
        const deliveredMessages = prevMessages.map(msg =>
          msg.id === newMessage.id ? { ...msg, delivered: true } : msg
        );
        localStorage.setItem('kasoowaChats', JSON.stringify(deliveredMessages));
        return deliveredMessages;
      });
    }, 1000);
  }, []);

  const markMessagesAsRead = useCallback(() => {
    const isAdmin = window.location.pathname.includes('/admin');
    
    setMessages(prevMessages => {
      const readMessages = prevMessages.map(msg => ({
        ...msg,
        read: msg.read || (isAdmin ? !msg.isAdmin : msg.isAdmin)
      }));
      
      if (storageUpdateTimeout.current) {
        clearTimeout(storageUpdateTimeout.current);
      }

      storageUpdateTimeout.current = setTimeout(() => {
        localStorage.setItem('kasoowaChats', JSON.stringify(readMessages));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'kasoowaChats',
          newValue: JSON.stringify(readMessages)
        }));
      }, 100);
      
      return readMessages;
    });
    
    setUnreadCount(0);
  }, []);

  const updateTypingStatus = useCallback((isTypingState, isAdmin) => {
    setIsTyping(prev => ({
      customer: isAdmin ? false : isTypingState,
      admin: isAdmin ? isTypingState : false
    }));
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      setMessages,
      unreadCount,
      isChatOpen,
      setIsChatOpen,
      addMessage,
      markMessagesAsRead,
      isAdminOnline,
      setIsAdminOnline,
      isTyping,
      updateTypingStatus
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;