// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // First try to get from localStorage 'user'
    const storedUser = localStorage.getItem('user');
    if (storedUser) return JSON.parse(storedUser);
    
    // If not found, check for the other authentication method
    const userIdentifier = localStorage.getItem('userIdentifier');
    const identifierType = localStorage.getItem('identifierType');
    
    if (userIdentifier && identifierType) {
      // Create a user object from this authentication method
      return {
        id: userIdentifier,
        type: identifierType,
        authMethod: 'identifier'
      };
    }
    
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('userIdentifier');
      localStorage.removeItem('identifierType');
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    
    // If logging in with identifier method, update those values too
    if (userData.authMethod === 'identifier') {
      localStorage.setItem('userIdentifier', userData.id);
      localStorage.setItem('identifierType', userData.type);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userIdentifier');
    localStorage.removeItem('identifierType');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};