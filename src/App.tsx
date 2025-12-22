import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import WorkoutsPage from './pages/WorkoutsPage';
import UploadPage from './pages/UploadPage';
import WorkoutDetailPage from './pages/WorkoutDetailPage';

// Get base path from Vite config (for GitHub Pages)
const BASE_PATH = import.meta.env.BASE_URL || '/sam-fit/';
const BASENAME = BASE_PATH.endsWith('/') ? BASE_PATH.slice(0, -1) : BASE_PATH;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Component to handle 404 redirects from GitHub Pages
function RedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a stored redirect from 404.html
    const storedRoute = sessionStorage.getItem('githubPages404Redirect');
    if (storedRoute) {
      sessionStorage.removeItem('githubPages404Redirect');
      // Navigate to the stored route
      navigate(storedRoute, { replace: true });
    }
  }, [navigate]);

  return null;
}

function App() {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
          <p className="text-gray-600 mb-2">
            VITE_GOOGLE_CLIENT_ID is not configured.
          </p>
          <p className="text-sm text-gray-500">
            {import.meta.env.MODE === 'development' 
              ? 'Please set VITE_GOOGLE_CLIENT_ID in your .env.local file'
              : 'Please ensure VITE_GOOGLE_CLIENT_ID is set in GitHub Secrets and the workflow has access to the github-pages environment'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter basename={BASENAME}>
          <RedirectHandler />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/workouts" element={<WorkoutsPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/workout/:id" element={<WorkoutDetailPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

