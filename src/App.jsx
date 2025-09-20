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
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
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
    };

    fetchProfile();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderDashboard = () => {
    if (loading) {
      return <div className="text-center p-8 text-gray-500">Loading...</div>;
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

    // Fallback while profile is loading
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="mb-4">Loading your dashboard...</p>
        <button onClick={handleLogout} className="px-4 py-2 font-semibold text-white bg-red-500 rounded-md hover:bg-red-600">
          Logout
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {renderDashboard()}
    </div>
  );
}

export default App;