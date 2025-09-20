import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import ReportForm from './components/ReportForm';
import PickerDashboard from './components/PickerDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an active session when the app first loads
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false); // Stop initial loading once session is checked
    };
    getSession();

    // Listen for changes in authentication state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // This effect runs whenever the session changes (i.e., after login)
    const fetchProfile = async () => {
      if (session?.user) {
        setLoading(true); // Start loading while we fetch the profile
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
        setLoading(false); // Stop loading once profile is fetched
      } else {
        // If there's no session, clear the profile
        setProfile(null);
      }
    };

    fetchProfile();
  }, [session]); // This is the key: it re-runs when the session object is updated

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="text-center p-8 text-white">Loading...</div>;
  }
  
  if (!session) {
    return <Auth />;
  }

  if (profile?.role === 'reporter') {
    return <ReportForm user={session.user} onLogout={handleLogout} />;
  }

  if (profile?.role === 'picker') {
    return <PickerDashboard user={session.user} onLogout={handleLogout} />;
  }

  // This fallback will show briefly after login while the profile is being fetched
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <p className="mb-4 text-white">Loading your dashboard...</p>
    </div>
  );
}

export default App;