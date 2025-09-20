import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile({ user, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Only fetch data when the modal is opened
    if (isOpen) {
      const fetchProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select(`full_name, role`)
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn(error);
          alert("Could not fetch profile.");
        } else {
          setProfile(data);
        }
        setLoading(false);
      };

      fetchProfile();
    }
  }, [user.id, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm font-sans">
      <div className="w-full max-w-md p-8 space-y-4 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">My Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-light">&times;</button>
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
              <p className="text-lg font-semibold capitalize text-secondary">{profile?.role}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}