import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import Profile from './Profile';
// --- CORRECTED IMPORT LINE ---
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet';

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

// Map settings
const blueDotOptions = { color: '#007BFF', fillColor: '#007BFF', fillOpacity: 1, radius: 8 };

export default function ReportForm({ user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [reportLocation, setReportLocation] = useState(null); // The draggable pin
  const [currentLocation, setCurrentLocation] = useState(null); // The user's live blue dot
  const [mapCenter, setMapCenter] = useState([28.4595, 77.0266]); // Default center
  const [imageFile, setImageFile] = useState(null);
  const [volume, setVolume] = useState('Small');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    let watcherId;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userCoords = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(userCoords);
          setReportLocation(userCoords);
          setCurrentLocation(userCoords);
        },
        () => {
          alert('Could not get your location. Please mark it manually.');
          setReportLocation(mapCenter);
        }
      );
      watcherId = navigator.geolocation.watchPosition((pos) => {
        setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
      });
    }

    return () => {
      if (watcherId) {
        navigator.geolocation.clearWatch(watcherId);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !reportLocation) {
      alert('Please upload an image and mark the location on the map.');
      return;
    }
    setLoading(true);

    const { data: uploadData, error: uploadError } = await supabase.storage.from('report-images').upload(`public/${Date.now()}_${imageFile.name}`, imageFile);
    if (uploadError) {
      alert(uploadError.message);
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('report-images').getPublicUrl(uploadData.path);
    const { error: insertError } = await supabase.from('reports').insert({
      user_id: user.id, image_url: publicUrl, location: `POINT(${reportLocation[1]} ${reportLocation[0]})`, volume,
    });

    if (insertError) alert(insertError.message);
    else {
      alert('Report submitted successfully!');
      setImageFile(null);
      e.target.reset();
    }
    setLoading(false);
  };
  
  const DraggableMarker = () => {
    const markerRef = useRef(null);
    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const { lat, lng } = marker.getLatLng();
            setReportLocation([lat, lng]);
          }
        },
      }),
      [],
    );

    useMapEvents({
      click(e) {
        setReportLocation([e.latlng.lat, e.latlng.lng]);
      },
    });

    return reportLocation === null ? null : (
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={reportLocation}
        ref={markerRef}>
      </Marker>
    );
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

      <main className="relative z-10 p-4 sm:p-8 flex justify-center items-start">
        <div className="w-full max-w-xl p-8 space-y-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white text-center">Create a New Report</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Mark the Location</label>
              <div className='rounded-2xl overflow-hidden' style={{ height: '300px', width: '100%' }}>
                {reportLocation ? (
                  <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <DraggableMarker />
                    {currentLocation && (
                       <CircleMarker center={currentLocation} pathOptions={blueDotOptions}>
                         <Tooltip>You are here</Tooltip>
                       </CircleMarker>
                    )}
                  </MapContainer>
                ) : <div className='h-full w-full flex items-center justify-center bg-gray-700'>Getting location...</div> }
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">The blue dot is your live location. Drag the red pin to the garbage pile.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Upload Photo</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required 
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-green-400 hover:file:bg-gray-600" />
            </div>
            <div>
              <label htmlFor="volume" className="block text-sm font-medium text-gray-400">Estimated Volume</label>
              <select id="volume" value={volume} onChange={(e) => setVolume(e.target.value)} 
                className="mt-1 block w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
                <option value="Small">Small (Backpack size)</option>
                <option value="Medium">Medium (Wheelbarrow size)</option>
                <option value="Large">Large (Truck bed size)</option>
              </select>
            </div>
            <button type="submit" disabled={loading || !reportLocation} 
              className="w-full p-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-500 transform hover:scale-105 transition-all duration-300">
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </main>

      <Profile user={user} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}