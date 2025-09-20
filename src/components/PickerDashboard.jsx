import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function PickerDashboard({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);

  // Function to accept a report
  const acceptReport = async (reportId) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'claimed', claimed_by: user.id })
      .eq('id', reportId);

    if (error) {
      alert('Error accepting report: ' + error.message);
    } else {
      alert('Report accepted!');
      // Refresh the list of reports
      fetchNearbyReports(location);
    }
  };
  
  // Function to fetch reports
  const fetchNearbyReports = async (currentLocation) => {
    if (!currentLocation) return;
    
    // This is where you call the special SQL function
    const { data, error } = await supabase.rpc('nearby_reports', {
      lat: currentLocation.lat,
      long: currentLocation.lng,
    });

    if (error) {
      console.error('Error fetching nearby reports:', error);
      alert('Could not fetch reports.');
    } else {
      setReports(data);
    }
    setLoading(false);
  }

  // Get picker's location and then fetch reports
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(currentLocation);
          fetchNearbyReports(currentLocation);
        },
        () => {
          alert('Please enable location services to find nearby reports.');
          setLoading(false);
        }
      );
    }
  }, []); // The empty array [] means this runs once when the component mounts

  if (loading) {
    return <div className="text-center p-8">Finding nearby reports...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Nearby Reports</h1>
      {reports.length === 0 ? (
        <p>No pending reports found near you. Great job!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="border rounded-lg shadow-lg overflow-hidden">
              <img src={report.image_url} alt="Garbage report" className="w-full h-48 object-cover"/>
              <div className="p-4">
                <p className="text-sm text-gray-600">
                  Distance: {report.dist_meters.toFixed(0)} meters away
                </p>
                <p className="text-lg font-semibold">Status: {report.status}</p>
                <button
                  onClick={() => acceptReport(report.id)}
                  className="mt-4 w-full bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600"
                >
                  Accept Task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}