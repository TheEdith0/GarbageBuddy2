import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import ReportForm from './components/ReportForm';
import PickerDashboard from './components/PickerDashboard';
import Leaderboard from './components/Leaderboard'; // <-- Import new component

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // <-- New state to control navigation

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Reset to dashboard view on login/logout
      if (_event === 'SIGNED_OUT') setView('dashboard');
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (error) console.error('Error fetching profile:', error);
        else setProfile(data);
      };
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading && !session) {
    return <div className="text-center p-8 text-white">Loading...</div>;
  }
  
  if (!session) {
    return <Auth />;
  }

  // --- New Navigation Logic ---
  const renderContent = () => {
    if (view === 'leaderboard') {
      return <Leaderboard onBack={() => setView('dashboard')} />;
    }

    // Default to dashboard view
    if (profile?.role === 'reporter') {
      return <ReportForm user={session.user} onLogout={handleLogout} />;
    }
    if (profile?.role === 'picker') {
      return <PickerDashboard user={session.user} onLogout={handleLogout} />;
    }
    // Fallback while profile is loading
    return <div className="text-center p-8 text-white">Loading dashboard...</div>;
  };
  
  return (
    <>
      {/* --- New Navigation Header --- */}
      {session && view === 'dashboard' && (
        <div className="bg-dark-text/80 backdrop-blur-sm p-2 text-center sticky top-0 z-40">
          <button onClick={() => setView('leaderboard')} className="text-white font-semibold hover:text-secondary transition">
            🏆 View Leaderboard
          </button>
        </div>
      )}
      {renderContent()}
    </>
  );
}

export default App;