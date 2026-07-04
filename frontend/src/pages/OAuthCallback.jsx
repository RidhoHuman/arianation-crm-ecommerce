import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const processOAuth = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const refreshToken = params.get('refreshToken');
      const error = params.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth_failed');
        return;
      }

      if (token && refreshToken) {
        try {
          // Set token in localStorage immediately
          localStorage.setItem('token', token);
          
          // Fetch user profile
          const res = await api.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (res.data?.data) {
            const user = res.data.data;
            setAuth(user, token);
            
            // Redirect based on role
            if (user.role === 'ADMIN' || user.role === 'OWNER') {
              navigate('/admin');
            } else {
              navigate('/account');
            }
          } else {
            navigate('/login?error=profile_fetch_failed');
          }
        } catch (err) {
          console.error('Failed to fetch profile after OAuth:', err);
          navigate('/login?error=oauth_failed');
        }
      } else {
        navigate('/login');
      }
    };

    processOAuth();
  }, [location, navigate, setAuth]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-aria-charcoal mb-6 mx-auto"></div>
      <h2 className="text-xl font-medium tracking-widest uppercase mb-4 text-gray-800">Authenticating...</h2>
      <p className="text-sm text-gray-500 uppercase tracking-widest">Please wait while we log you in</p>
    </div>
  );
}
