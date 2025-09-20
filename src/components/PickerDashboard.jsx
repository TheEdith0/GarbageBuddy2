import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Profile from './Profile';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// Re-using the animated background component
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState([28.4595, 77.0266]); // Default center

  useEffect(() => {
    let watcherId;
    if (navigator.geolocation) {
      watcherId = navigator.geolocation.watchPosition(
        (pos) => {
          const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapCenter([userLocation.lat, userLocation.lng]);
          fetchReports(userLocation);
        },
        () => {
          alert('Please enable location services to find reports.');
          setLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setLoading(false);
    }
    return () => {
      if (watcherId) {
        navigator.geolocation.clearWatch(watcherId);
      }
    };
  }, []);

  const fetchReports = async (location) => {
    setLoading(true);
    // This RPC call will now return latitude and longitude directly
    const { data, error } = await supabase.rpc('nearby_reports', {
      lat: location.lat, long: location.lng,
    });
    if (error) {
      console.error("Error fetching reports:", error);
    } else {
      // The data is now clean, no parsing needed
      setReports(data || []);
    }
    setLoading(false);
  };

  const acceptReport = async (reportId) => {
    const { error } = await supabase.from('reports').update({ status: 'claimed', claimed_by: user.id }).eq('id', reportId);
    if (error) {
      alert(error.message);
    } else {
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

        <div className="mb-8 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl" style={{ height: '400px' }}>
          {loading ? (
             <div className='h-full w-full flex items-center justify-center bg-gray-800'>Loading Map...</div>
          ) : (
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {reports.map(report => (
                <Marker key={report.id} position={[report.latitude, report.longitude]}>
                  <Popup>
                    <div className="text-center w-40">
                      <img src={report.image_url} alt="Garbage report" className="w-full h-24 object-cover rounded mb-2"/>
                      <p>{report.dist_meters.toFixed(0)}m away</p>
                       <button onClick={() => acceptReport(report.id)} className="w-full mt-2 text-sm px-2 py-1 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                        Accept
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col transition-transform hover:scale-105">
              <img src={report.image_url} alt="Garbage report" className="w-full h-48 object-cover" />
              <div className="p-4 flex flex-col flex-grow">
                <p className="font-semibold text-white">Distance: {report.dist_meters.toFixed(0)}m away</p>
                <p className="text-sm text-gray-400 mb-4">Status: <span className="font-semibold text-orange-400">{report.status.toUpperCase()}</span></p>
                <div className="mt-auto">
                   <a href={`https://www.openstreetmap.org/directions?from=&to=${report.latitude},${report.longitude}`} target="_blank" rel="noopener noreferrer" 
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