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
      <div className="main-card-wrapper" style={{ maxWidth: '450px' }}>
        <h1 className="main-title" style={{ marginBottom: '0.75rem', fontSize: '2rem' }}>
          Welcome!
          <br />
          Easy AND Secured
          <br />
          Payment Application
        </h1>
        
        <div className="action-card" style={{ padding: '1.25rem' }}>
          <p className="action-text" style={{ marginBottom: '0.875rem', fontSize: '0.875rem' }}>
            Manage your payments with TrueLayer integration securely
          </p>
          
          <div style={{ marginBottom: '1rem', width: '100%' }}>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e0', fontSize: '0.8rem' }}>
                <svg style={{ width: '14px', height: '14px', color: '#68d391', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Create & manage TrueLayer payments
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e0', fontSize: '0.8rem' }}>
                <svg style={{ width: '14px', height: '14px', color: '#68d391', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Advanced sort and filter mechanisms
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e0', fontSize: '0.8rem' }}>
                <svg style={{ width: '14px', height: '14px', color: '#68d391', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Real-time analytics & payment statistics
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e0', fontSize: '0.8rem' }}>
                <svg style={{ width: '14px', height: '14px', color: '#68d391', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Intuitive user interface
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e0', fontSize: '0.8rem' }}>
                <svg style={{ width: '14px', height: '14px', color: '#68d391', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Exceptional user experience
              </li>
            </ul>
          </div>

          <LoginButton />
        </div>
        
        <p style={{ fontSize: '0.75rem', color: '#a0aec0', textAlign: 'center', marginTop: '0.75rem' }}>
          Secured by Auth0 • Powered by TrueLayer
        </p>
      </div>
    </div>
  );
}

export default Login;
