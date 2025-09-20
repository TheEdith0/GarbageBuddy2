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
    // Check for an active session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    // Listen for changes in authentication state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // If there is a session, fetch the user's profile
    const fetchProfile = async () => {
      if (session?.user) {
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
      }
      setLoading(false);
    };

    fetchProfile();
  }, [session]);

  // Don't render anything until we're done loading the session and profile
  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }
  
  // Render the correct component based on auth state and user role
  return (
    <div className="container mx-auto">
      {!session ? (
        <Auth />
      ) : profile?.role === 'reporter' ? (
        <ReportForm user={session.user} />
      ) : profile?.role === 'picker' ? (
        <PickerDashboard user={session.user} />
      ) : (
        // Fallback for when profile is still loading or has no role
        <div className="text-center p-4">
          <p>Loading your dashboard...</p>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="mt-4 bg-red-500 text-white font-bold py-2 px-4 rounded"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default App;