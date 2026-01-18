import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginButton from '../components/LoginButton';

function Login() {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-state">
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="error-state">
          <div className="error-title">Oops!</div>
          <div className="error-message">Something went wrong</div>
          <div className="error-sub-message">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-card-wrapper">
        <img 
          src="https://cdn.auth0.com/quantum-assets/dist/latest/logos/auth0/auth0-lockup-en-ondark.png" 
          alt="Auth0 Logo" 
          className="auth0-logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="main-title">Payment Dashboard</h1>
        
        <div className="action-card">
          <p className="action-text">
            Manage your payments with TrueLayer integration. Sign in to access your dashboard and manage transactions securely.
          </p>
          <LoginButton />
          
          <div style={{ marginTop: '2rem', width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#cbd5e0', marginBottom: '1rem', textAlign: 'center' }}>
              Features:
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e0' }}>
                <svg style={{ width: '20px', height: '20px', color: '#68d391' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                View and manage all payments
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e0' }}>
                <svg style={{ width: '20px', height: '20px', color: '#68d391' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Create payment links with TrueLayer
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e0' }}>
                <svg style={{ width: '20px', height: '20px', color: '#68d391' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Filter by status and search payments
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e0' }}>
                <svg style={{ width: '20px', height: '20px', color: '#68d391' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                View payment analytics
              </li>
            </ul>
          </div>
        </div>
        
        <p style={{ fontSize: '0.875rem', color: '#a0aec0', textAlign: 'center', marginTop: '1.5rem' }}>
          Secured by Auth0 • Powered by TrueLayer
        </p>
      </div>
    </div>
  );
}

export default Login;
