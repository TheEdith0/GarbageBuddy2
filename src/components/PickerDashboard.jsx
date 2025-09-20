import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function PickerDashboard({ user, onLogout }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setReports(reports.filter(r => r.id !== reportId)); // Remove from list
    }
  };

  return (
    <div className="min-h-screen bg-light-gray">
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">Picker Dashboard</h1>
          <button onClick={onLogout} className="px-4 py-2 font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600">Logout</button>
        </nav>
      </header>
      <main className="container mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-dark-text mb-6">Available Tasks Near You</h2>
        {loading && <p className="text-center text-gray-500">Finding nearby reports...</p>}
        {!loading && reports.length === 0 && (
          <div className="text-center py-10 px-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-dark-text">All Clean!</h3>
            <p className="text-gray-500 mt-2">There are no pending reports in your area. Thank you for your work!</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
              <img src={report.image_url} alt="Garbage report" className="w-full h-48 object-cover" />
              <div className="p-4 flex flex-col flex-grow">
                <p className="font-semibold text-dark-text">Distance: {report.dist_meters.toFixed(0)}m away</p>
                <p className="text-sm text-gray-500 mb-4">Status: <span className="font-semibold text-orange-500">{report.status.toUpperCase()}</span></p>
                <div className="mt-auto">
                   <a href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`} target="_blank" rel="noopener noreferrer" className="block w-full text-center mb-2 px-4 py-2 font-semibold text-primary bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                    Get Directions
                  </a>
                  <button onClick={() => acceptReport(report.id)} className="w-full px-4 py-2 font-semibold text-white bg-secondary rounded-lg hover:bg-green-600 transition-colors">
                    Accept Task
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}