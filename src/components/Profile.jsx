import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile({ user, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchProfileAndStats = async () => {
        setLoading(true);
        
        // Fetch profile details
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`full_name, role`)
          .eq('id', user.id)
          .single();

        if (profileError) console.warn(profileError);
        else setProfile(profileData);

        // Fetch reporter stats if the user is a reporter
        if (profileData?.role === 'reporter') {
          const { data: statsData, error: statsError } = await supabase
            .rpc('get_reporter_stats', { p_user_id: user.id });

          if (statsError) console.warn(statsError);
          else if (statsData && statsData.length > 0) setStats(statsData[0]);
        }

        setLoading(false);
      };

      fetchProfileAndStats();
    }
  }, [user.id, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="w-full max-w-md p-8 space-y-4 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">My Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Loading profile...</p>
        ) : (
          <div className="space-y-4 pt-4 text-center">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-lg font-semibold text-white">{profile?.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg text-gray-300">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <p className="text-lg font-semibold capitalize text-green-400">{profile?.role}</p>
            </div>
            {/* --- NEW: Display Report Count --- */}
            {profile?.role === 'reporter' && stats && (
              <div>
                <label className="text-sm font-medium text-gray-500">Total Reports Submitted</label>
                <p className="text-2xl font-bold text-white">{stats.report_count}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}