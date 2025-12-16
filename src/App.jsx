import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Watchlist from './pages/Watchlist';
import UserReview from './pages/user_review';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import MovieDetails from './pages/MovieDetails';
import EpisodeDetails from './pages/EpisodeDetails';
import Biography from './pages/Biography';
import Settings from './pages/Settings';
import Followers from './pages/Followers';
import Following from './pages/Following';
import News from './pages/News';
import Friends from './pages/Friends';
import PosterSelection from './pages/PosterSelection';

import Search from './pages/Search';
import Layout from './Layout';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import './App.css';

import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

import { AuthProvider } from './context/AuthContext';

import ErrorBoundary from './components/ErrorBoundary';

const ConstructionMode = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    color: '#FFD600',
    fontFamily: 'Impact, sans-serif',
    textAlign: 'center',
    padding: '20px'
  }}>
    <div style={{ fontSize: '80px', marginBottom: '20px' }}>🚧</div>
    <h1 style={{ fontSize: '48px', textTransform: 'uppercase', marginBottom: '20px' }}>
      Whoops! Hold Your Horses! 🐴
    </h1>
    <p style={{ fontSize: '24px', color: '#fff', maxWidth: '600px', lineHeight: '1.5', fontFamily: 'Arial, sans-serif' }}>
      Our highly trained hamsters 🐹 are currently rewriting the entire codebase because they didn't like the color scheme.
    </p>
    <p style={{ fontSize: '18px', color: '#888', marginTop: '40px', fontFamily: 'Arial, sans-serif' }}>
      (We're bribing them with carrots. Back soon!)
    </p>
  </div>
);

function App() {
  // UNCOMMENT TO EXIT CONSTRUCTION MODE
  const IS_UNDER_CONSTRUCTION = true;

  if (IS_UNDER_CONSTRUCTION) {
    return <ConstructionMode />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Public Routes within Layout */}
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/news" element={<News />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/search" element={<Search />} />
                <Route path="/movie/:id" element={<MovieDetails />} />
                <Route path="/tv/:id" element={<MovieDetails />} />
                <Route path="/tv/:id/season/:seasonNumber" element={<MovieDetails />} />
                <Route path="/series/:id/season/:seasonNumber/posters" element={<PosterSelection />} />
                <Route path="/tv/:id/season/:seasonNumber/episode/:episodeNumber" element={<EpisodeDetails />} />
                <Route path="/person/:id" element={<Biography />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/watchlist" element={<Watchlist />} />
                  <Route path="/reviews" element={<UserReview />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:uid" element={<Profile />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile/:uid/followers" element={<Followers />} />
                  <Route path="/profile/:uid/following" element={<Following />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
