import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiClient } from '../services/api';

/**
 * Auth Token Context
 * Coordinates token retrieval across the application
 * Ensures components only fetch data when token is ready
 */

interface AuthTokenContextType {
  tokenReady: boolean;
  tokenError: string | null;
}

const AuthTokenContext = createContext<AuthTokenContextType | undefined>(undefined);

interface AuthTokenProviderProps {
  children: ReactNode;
}

export function AuthTokenProvider({ children }: AuthTokenProviderProps) {
  const { isAuthenticated, isLoading, getAccessTokenSilently, getAccessTokenWithPopup } = useAuth0();
  const [tokenReady, setTokenReady] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    const initToken = async () => {
      // Wait for Auth0 to finish loading
      if (isLoading) {
        console.log('⏳ Auth0 is loading, waiting...');
        return;
      }

      // If not authenticated, clear token
      if (!isAuthenticated) {
        console.log('🔓 User not authenticated, clearing token');
        setTokenReady(false);
        setTokenError(null);
        apiClient.clearAuthToken();
        return;
      }

      // User is authenticated, get the token
      try {
        console.log('🔐 Attempting to get Auth0 access token...');
        console.log('   Audience:', import.meta.env.VITE_AUTH0_AUDIENCE);
        console.log('   Auth0 Domain:', import.meta.env.VITE_AUTH0_DOMAIN);

        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          },
        });

        console.log('✅ Token retrieved successfully');
        console.log('   Token preview:', token.substring(0, 30) + '...');
        console.log('   Token length:', token.length);

        apiClient.setAuthToken(token);
        setTokenReady(true);
        setTokenError(null);
        console.log('✅ Token set in API client - Ready to fetch data!');
      } catch (error: any) {
        console.error('❌ Failed to get access token');
        console.error('   Error type:', error?.name || 'Unknown');
        console.error('   Error message:', error?.message || 'No message');
        console.error('   Error code:', error?.error || 'No code');

        // Handle session expiration (login_required)
        if (error?.error === 'login_required') {
          console.log('⏱️  Session has expired - login required');
          setTokenError('Your session has expired. Please log in again.');
          setTokenReady(false);
          console.log('💡 Session expired due to inactivity or absolute timeout');
          console.log('   Configure session duration in Auth0 Dashboard - see AUTH0_SESSION_CONFIG.md');
          return;
        }

        // Handle consent_required with popup
        if (error?.error === 'consent_required') {
          console.log('🔄 Consent required - attempting popup authentication...');
          try {
            const token = await getAccessTokenWithPopup({
              authorizationParams: {
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
              },
            });

            console.log('✅ Token retrieved via popup');
            console.log('   Token preview:', token.substring(0, 30) + '...');
            apiClient.setAuthToken(token);
            setTokenReady(true);
            setTokenError(null);
            console.log('✅ Token set in API client (via popup)');
            console.log('💡 TIP: Enable "Skip Consent" in Auth0 to avoid popups - see AUTH0_SKIP_CONSENT_GUIDE.md');
          } catch (popupError: any) {
            console.error('❌ Popup authentication failed:', popupError);
            setTokenError(popupError?.message || 'Failed to authenticate');
            setTokenReady(false);
            console.error('💡 SOLUTION: Enable "Skip Consent" and "Allow Offline Access" in Auth0 Dashboard');
            console.error('   See: AUTH0_SKIP_CONSENT_GUIDE.md for instructions');
          }
        } else {
          // Generic error handling
          setTokenError(error?.message || 'Failed to retrieve token');
          setTokenReady(false);
        }
      }
    };

    initToken();
  }, [isAuthenticated, isLoading, getAccessTokenSilently, getAccessTokenWithPopup]);

  return (
    <AuthTokenContext.Provider value={{ tokenReady, tokenError }}>
      {children}
    </AuthTokenContext.Provider>
  );
}

/**
 * Hook to access token state
 * Use this in any component that needs to fetch data from the API
 */
export function useAuthToken() {
  const context = useContext(AuthTokenContext);
  if (context === undefined) {
    throw new Error('useAuthToken must be used within AuthTokenProvider');
  }
  return context;
}
