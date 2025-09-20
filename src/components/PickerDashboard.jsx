import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// A reusable Modal component for the photo upload prompt
const Modal = ({ isOpen, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      {children}
    </div>
  );
};

export default function PickerDashboard({ user, onLogout }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([28.59, 76.28]); // Centered on Charkhi Dadri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Fetch reports near Charkhi Dadri when the component loads
    const fetchReports = async (location) => {
      setLoading(true);
      const { data, error } = await supabase.rpc('nearby_reports', {
        lat: location.lat,
        long: location.lng,
      });
      if (error) {
        console.error("Error fetching reports:", error);
        alert('Could not fetch nearby reports.');
      } else {
        setReports(data || []);
      }
      setLoading(false);
    };

    fetchReports({ lat: mapCenter[0], lng: mapCenter[1] });
  }, [mapCenter]);

  const handleMarkCompleteClick = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!afterImageFile) {
      return alert('Please upload an "after" photo.');
    }
    setActionLoading(true);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('report-images')
      .upload(`public/after_${Date.now()}_${afterImageFile.name}`, afterImageFile);

    if (uploadError) {
      setActionLoading(false);
      return alert('Image upload failed. Please try again.');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('report-images')
      .getPublicUrl(uploadData.path);

    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 'completed', after_image_url: publicUrl })
      .eq('id', selectedReport.id);

    if (updateError) {
      alert('Failed to update the report.');
    } else {
      alert('Task completed! Thank you for your hard work!');
      setReports(reports.filter(r => r.id !== selectedReport.id));
      setIsModalOpen(false);
      setAfterImageFile(null);
      setSelectedReport(null);
    }
    setActionLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-dark-text text-gray-300 font-sans">
      <header className="relative z-20 p-4 flex justify-between items-center bg-dark-text/50 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white">Picker Dashboard</h1>
        <button onClick={onLogout} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">
          Logout
        </button>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Available Tasks in Charkhi Dadri</h2>
        <div className="mb-8 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl h-96">
          {loading ? (
            <div className='h-full flex items-center justify-center bg-gray-800'>Loading Map...</div>
          ) : (
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%', backgroundColor: '#1F2937' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap'/>
              {reports.map(report => (
                <Marker key={report.id} position={[report.latitude, report.longitude]}>
                  <Popup>
                    <img src={report.image_url} alt="Garbage" className="w-full h-28 object-cover rounded-t mb-2"/>
                    <div className="p-2">
                        <p className="text-xs text-gray-400 italic mb-2">"{report.description || 'No description provided.'}"</p>
                        <p className="text-sm font-bold">{report.dist_meters.toFixed(0)}m away</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg backdrop-blur-xl overflow-hidden flex flex-col">
              <img src={report.image_url} alt="Garbage report" className="w-full h-48 object-cover" />
              <div className="p-4 flex flex-col flex-grow">
                <p className="text-sm text-gray-400 italic">"{report.description || 'No description provided.'}"</p>
                <div className="flex-grow mt-2">
                    <p className="font-semibold text-white">{report.dist_meters.toFixed(0)}m away</p>
                    <p className="text-sm text-gray-400">Status: <span className="font-semibold text-orange-400">{report.status.toUpperCase()}</span></p>
                </div>
                <button 
                  onClick={() => handleMarkCompleteClick(report)} 
                  className="mt-4 w-full px-4 py-2 font-semibold text-white bg-secondary rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark as Completed
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Modal isOpen={isModalOpen}>
        <div className="w-full max-w-lg p-8 space-y-4 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold text-white">Complete Task ✅</h2>
            <p className="text-gray-400">Upload a photo of the clean area to verify completion.</p>
            <form onSubmit={handleCompleteSubmit}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setAfterImageFile(e.target.files[0])} 
                  required 
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-secondary hover:file:bg-gray-600"
                />
                <div className="mt-6 flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full p-2 font-semibold bg-gray-600 rounded-lg hover:bg-gray-700">Cancel</button>
                    <button type="submit" disabled={actionLoading} className="w-full p-2 font-semibold text-white bg-secondary rounded-lg hover:bg-green-700 disabled:bg-gray-500">
                      {actionLoading ? 'Uploading...' : 'Submit Completion'}
                    </button>
                </div>
            </form>
        </div>
      </Modal>
    </div>
  );
}