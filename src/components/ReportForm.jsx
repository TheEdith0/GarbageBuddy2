import { useState, useEffect, useRef, useMemo } from 'react'; // <-- Restore hooks
import { supabase } from '../supabaseClient';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'; // <-- Restore map components
import Profile from './Profile'; // <-- Restore profile import

export default function ReportForm({ user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [volume, setVolume] = useState('Small');
  const [description, setDescription] = useState('');
  const [myReports, setMyReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // --- Restore map and profile state ---
  const [reportLocation, setReportLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([28.59, 76.28]); // Charkhi Dadri
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // This function fetches the user's reports
  const fetchMyReports = async () => {
    const { data, error } = await supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) console.error("Error fetching reports:", error);
    else setMyReports(data || []);
    setReportsLoading(false);
  };
  
  // This useEffect fetches reports on load and then sets up polling
  useEffect(() => {
    fetchMyReports(); 
    const interval = setInterval(() => fetchMyReports(), 15000); 
    return () => clearInterval(interval);
  }, [user.id]);

  // --- Restore geolocation useEffect ---
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
          setReportLocation(mapCenter); // Fallback to default
        }
      );
      watcherId = navigator.geolocation.watchPosition((pos) => {
        setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
      });
    }
    return () => { if (watcherId) navigator.geolocation.clearWatch(watcherId); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !reportLocation) {
      return alert('Please upload a photo and mark the location on the map.');
    }
    setLoading(true);

    const { data: uploadData, error: uploadError } = await supabase.storage.from('report-images').upload(`public/${Date.now()}_${imageFile.name}`, imageFile);
    if (uploadError) {
      setLoading(false);
      return alert('Image upload failed.');
    }

    const { data: { publicUrl } } = supabase.storage.from('report-images').getPublicUrl(uploadData.path);
    const { data: newReport, error: insertError } = await supabase.from('reports').insert({
        user_id: user.id,
        image_url: publicUrl,
        location: `POINT(${reportLocation[1]} ${reportLocation[0]})`, // Use location from map
        volume,
        description,
      }).select().single();

    if (insertError) {
      alert(insertError.message);
    } else {
      alert('Report submitted successfully!');
      setMyReports([newReport, ...myReports]);
      setImageFile(null);
      setDescription('');
      e.target.reset();
    }
    setLoading(false);
  };

  // --- Restore Draggable Marker component ---
  const DraggableMarker = () => {
    const markerRef = useRef(null);
    const eventHandlers = useMemo(() => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setReportLocation([lat, lng]);
        }
      },
    }), []);

    useMapEvents({
      click(e) {
        setReportLocation([e.latlng.lat, e.latlng.lng]);
      },
    });

    return reportLocation ? <Marker draggable={true} eventHandlers={eventHandlers} position={reportLocation} ref={markerRef} /> : null;
  };
  
  return (
    <div className="relative min-h-screen bg-dark-text text-gray-300 font-sans">
      <header className="relative z-20 p-4 flex justify-between items-center bg-dark-text/50 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white">Reporter Dashboard</h1>
        {/* --- Restore Profile and Logout buttons --- */}
        <div className="flex items-center gap-4">
          <button onClick={() => setIsProfileOpen(true)} className="px-4 py-2 font-semibold text-white bg-primary rounded-lg hover:bg-blue-700 transition-colors">
            Profile
          </button>
          <button onClick={onLogout} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">
            Logout
          </button>
        </div>
      </header>

      <main className="relative z-10 p-4 sm:p-8 flex flex-col items-center gap-8">
        <div className="w-full max-w-xl p-8 space-y-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white text-center">Create a New Report</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- Restore Map section --- */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Mark the Location</label>
              <div className='rounded-2xl overflow-hidden' style={{ height: '300px', width: '100%' }}>
                {reportLocation ? (
                  <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    <DraggableMarker />
                  </MapContainer>
                ) : <div className='h-full w-full flex items-center justify-center bg-gray-700'>Getting location...</div> }
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">Click or drag the pin to the garbage pile.</p>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-400">Description</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" placeholder="e.g., Plastic bottles near the park entrance" className="mt-1 block w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Upload "Before" Photo</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-secondary hover:file:bg-gray-600" />
            </div>
            <div>
              <label htmlFor="volume" className="block text-sm font-medium text-gray-400">Estimated Volume</label>
              <select id="volume" value={volume} onChange={(e) => setVolume(e.target.value)} className="mt-1 block w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary">
                <option>Small (Backpack)</option>
                <option>Medium (Wheelbarrow)</option>
                <option>Large (Truck bed)</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="w-full p-3 font-semibold text-white bg-secondary rounded-lg hover:bg-green-700 disabled:bg-gray-500 transform hover:scale-105">
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>

        <div className="w-full max-w-4xl p-8 space-y-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white text-center">My Submitted Reports</h2>
          <div className="space-y-4">
            {reportsLoading ? ( <p className="text-center text-gray-400">Loading reports...</p> ) : myReports.length === 0 ? ( <p className="text-center text-gray-500">You haven't submitted any reports yet.</p> ) : (
              myReports.map(report => (
                <div key={report.id} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="flex-grow">
                      <p className="text-sm text-gray-400 italic">"{report.description}"</p>
                      <p className="font-semibold text-white">Status: <span className={`font-bold ml-2 ${ report.status === 'completed' ? 'text-secondary' : report.status === 'claimed' ? 'text-yellow-400' : 'text-orange-400' }`}>{report.status}</span></p>
                      <p className="text-xs text-gray-500">Reported on: {new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {report.status === 'completed' && report.after_image_url && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-center text-xs text-gray-400 mb-1">BEFORE</p>
                          <img src={report.image_url} alt="Before cleanup" className="w-full h-32 object-cover rounded-md" />
                        </div>
                        <div>
                          <p className="text-center text-xs text-green-400 mb-1">AFTER</p>
                          <img src={report.after_image_url} alt="After cleanup" className="w-full h-32 object-cover rounded-md" />
                        </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* --- Restore Profile Component --- */}
      <Profile user={user} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}