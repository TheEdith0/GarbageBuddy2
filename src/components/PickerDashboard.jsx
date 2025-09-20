import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Profile from './Profile';

// ... (Keep the AnimatedBackground component as it is)
const AnimatedBackground = () => {
  const particles = [
    { left: '10%', duration: '20s', delay: '0s', size: '15px' },
    { left: '20%', duration: '25s', delay: '2s', size: '25px' },
    { left: '25%', duration: '18s', delay: '4s', size: '10px' },
    { left: '40%', duration: '22s', delay: '0s', size: '20px' },
    { left: '50%', duration: '30s', delay: '7s', size: '18px' },
    { left: '65%', duration: '20s', delay: '0s', size: '15px' },
    { left: '75%', duration: '28s', delay: '2s', size: '22px' },
    { left: '90%', duration: '15s', delay: '5s', size: '12px' },
  ];
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      {particles.map((p, i) => (
        <div key={i} className="floating-particle" style={{ left: p.left, width: p.size, height: p.size, animationDuration: p.duration, animationDelay: p.delay }} ></div>
      ))}
    </div>
  );
};

export default function PickerDashboard({ user, onLogout }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // State for modal

  useEffect(() => {
    const fetchReports = async (location) => {
      const { data, error } = await supabase.rpc('nearby_reports', {
        lat: location.lat, long: location.lng,
      });
      if (error) console.error("Error fetching reports:", error);
      else setReports(data);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchReports({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        alert('Please enable location services to find reports.');
        setLoading(false);
      }
    );
  }, []);

  const acceptReport = async (reportId) => {
    const { error } = await supabase.from('reports').update({ status: 'claimed', claimed_by: user.id }).eq('id', reportId);
    if (error) alert(error.message);
    else {
      alert('Report accepted!');
      setReports(reports.filter(r => r.id !== reportId));
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-gray-300 overflow-hidden">
      <AnimatedBackground />
      <header className="relative z-20 p-4 flex justify-between items-center bg-gray-900/50 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white">Garbage Buddy</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsProfileOpen(true)} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Profile
          </button>
          <button onClick={onLogout} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Available Tasks Near You</h2>
        {loading && <p className="text-center text-gray-400">Finding nearby reports...</p>}
        {!loading && reports.length === 0 && (
          <div className="text-center py-10 px-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-xl">
            <h3 className="text-2xl font-semibold text-white">All Clean!</h3>
            <p className="text-gray-400 mt-2">There are no pending reports in your area. Thank you!</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col transition-transform hover:scale-105">
              <img src={report.image_url} alt="Garbage report" className="w-full h-48 object-cover" />
              <div className="p-4 flex flex-col flex-grow">
                <p className="font-semibold text-white">Distance: {report.dist_meters.toFixed(0)}m away</p>
                <p className="text-sm text-gray-400 mb-4">Status: <span className="font-semibold text-orange-400">{report.status.toUpperCase()}</span></p>
                <div className="mt-auto">
                   <a href={`http://googleusercontent.com/maps.google.com/3{report.latitude},${report.longitude}`} target="_blank" rel="noopener noreferrer" 
                     className="block w-full text-center mb-2 px-4 py-2 font-semibold text-blue-300 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                    Get Directions
                  </a>
                  <button onClick={() => acceptReport(report.id)} 
                    className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                    Accept Task
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Profile user={user} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}