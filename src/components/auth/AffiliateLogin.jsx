import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import bcrypt from 'bcryptjs';

const AffiliateLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');
    setIsLoading(true);
    
    try {
      // Get all users and affiliates
      const usersData = JSON.parse(localStorage.getItem('users') || '[]');
      const pendingAffiliates = JSON.parse(localStorage.getItem('pendingAffiliates') || '[]');
      const affiliates = JSON.parse(localStorage.getItem('affiliates') || '[]');
      
      // Debug logging for data
      console.log('Users:', usersData);
      console.log('Email trying to login:', email);
      console.log('All affiliates:', affiliates);
      
      // Find user with matching email
      const user = usersData.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        setDebugInfo('User not found in the database');
        throw new Error('Invalid email or password');
      }
      
      console.log('User found:', user);
      
      // Check if user has password (might be null or undefined)
      if (!user.password) {
        setDebugInfo('User has no password saved');
        throw new Error('Account setup incomplete. Please reset your password.');
      }
      
      try {
        // Verify password with bcrypt
        console.log('Comparing password...');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password comparison result:', isPasswordValid);
        
        if (!isPasswordValid) {
          setDebugInfo('Password comparison failed');
          throw new Error('Invalid email or password');
        }
      } catch (bcryptError) {
        console.error('bcrypt error:', bcryptError);
        setDebugInfo(`Password comparison error: ${bcryptError.message}`);
        throw new Error('Error verifying credentials. Please try again.');
      }
      
      // Check if user is an affiliate - enhanced logging and comparison
      console.log('Checking affiliate status for user ID:', user.id);
      console.log('Checking affiliate status for email:', user.email);
      
      // Enhanced matching logic with more detailed logging
      const affiliate = affiliates.find(a => {
        const emailMatch = a.email && a.email.toLowerCase() === user.email.toLowerCase();
        const idMatch = a.userId === user.id || String(a.userId) === String(user.id);
        
        console.log(`Checking affiliate: ${a.email}, userId: ${a.userId}`);
        console.log(`Email match: ${emailMatch}, ID match: ${idMatch}`);
        
        return emailMatch || idMatch;
      });
      
      // Add same detailed logging for pending affiliates
      const pendingAffiliate = pendingAffiliates.find(a => {
        const emailMatch = a.email && a.email.toLowerCase() === user.email.toLowerCase();
        const idMatch = a.userId === user.id || String(a.userId) === String(user.id);
        
        console.log(`Checking pending: ${a.email}, userId: ${a.userId}`);
        console.log(`Email match: ${emailMatch}, ID match: ${idMatch}`);
        
        return emailMatch || idMatch;
      });
      
      console.log('Affiliate status:', { isAffiliate: !!affiliate, isPending: !!pendingAffiliate });
      if (affiliate) {
        console.log('Affiliate details:', affiliate);
      }
      
      // Call login with user data
      await login({
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: affiliate ? 'affiliate' : (pendingAffiliate ? 'pending' : 'user')
      });
      
      // Navigate based on affiliate status
      if (affiliate) {
        navigate('/affiliate/dashboard');
      } else if (pendingAffiliate) {
        navigate('/affiliate/pending');
      } else {
        navigate('/affiliate/register');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ShoppingBag className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Login to Affiliate Dashboard
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your credentials to access your affiliate account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {debugInfo && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md text-xs">
             {debugInfo}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Log in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/affiliate/auth')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Back
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Return to Store
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                const usersData = JSON.parse(localStorage.getItem('users') || '[]');
                const pendingAffiliates = JSON.parse(localStorage.getItem('pendingAffiliates') || '[]');
                const affiliates = JSON.parse(localStorage.getItem('affiliates') || '[]');
                setDebugInfo(`Users: ${usersData.length}, Affiliates: ${affiliates.length}, Pending: ${pendingAffiliates.length}`);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Check Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateLogin;