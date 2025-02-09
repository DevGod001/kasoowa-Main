import React, { useState} from 'react';
import AuthPage from '../components/auth/AuthPage';
import UserDashboard from '../components/customer/UserDashboard';

const AccountPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage on initial load
    const userIdentifier = localStorage.getItem('userIdentifier');
    const identifierType = localStorage.getItem('identifierType');
    return !!(userIdentifier && identifierType);
  });
  
  const [userIdentifier, setUserIdentifier] = useState(() => 
    localStorage.getItem('userIdentifier') || ''
  );
  
  const [identifierType, setIdentifierType] = useState(() => 
    localStorage.getItem('identifierType') || ''
  );

  const handleLogin = (identifier, authMethod) => {
    // Save to state
    setIsAuthenticated(true);
    setUserIdentifier(identifier);
    setIdentifierType(authMethod);
    
    // Save to localStorage
    localStorage.setItem('userIdentifier', identifier);
    localStorage.setItem('identifierType', authMethod);
  };

  return isAuthenticated ? (
    <UserDashboard 
      userIdentifier={userIdentifier} 
      identifierType={identifierType} 
    />
  ) : (
    <AuthPage onLogin={handleLogin} />
  );
};

export default AccountPage;