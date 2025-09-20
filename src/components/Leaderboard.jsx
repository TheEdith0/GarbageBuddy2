import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Leaderboard({ onBack }) {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsers = async () => {
      setLoading(true);
      // Fetch users with the most points, limiting to the top 10
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, points')
        .order('points', { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching leaderboard:", error);
      } else {
        setTopUsers(data);
      }
      setLoading(false);
    };
    fetchTopUsers();
  }, []);

  return (
    <div className="relative min-h-screen bg-dark-text text-gray-300 font-sans p-4">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white">Community Leaderboard</h1>
        <p className="text-secondary">Top 10 Heroes of Charkhi Dadri</p>
      </header>
      
      {loading ? (
        <p className="text-center">Loading heroes...</p>
      ) : (
        <div className="max-w-2xl mx-auto bg-gray-800/50 rounded-2xl p-4">
          <ul className="space-y-3">
            {topUsers.map((user, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
                <div className="flex items-center">
                  <span className="text-xl font-bold w-8">{index + 1}</span>
                  <span className="text-lg">{user.full_name}</span>
                </div>
                <span className="text-xl font-bold text-secondary">{user.points} pts</span>
              </li>
            ))}
          </ul>
        </div>
      )}
       <div className="text-center mt-8">
        <button onClick={onBack} className="px-6 py-2 font-semibold text-white bg-primary rounded-lg hover:bg-blue-700">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}