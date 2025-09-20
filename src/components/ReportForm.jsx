import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ReportForm({ user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [volume, setVolume] = useState('Small');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('Please enable location services.')
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !location) {
      alert('Please provide an image and ensure location is enabled.');
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
      user_id: user.id, image_url: publicUrl, location: `POINT(${location.lng} ${location.lat})`, volume,
    });

    if (insertError) alert(insertError.message);
    else {
      alert('Report submitted successfully!');
      setImageFile(null);
      e.target.reset(); // Reset the form fields
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-light-gray">
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">Reporter Dashboard</h1>
          <button onClick={onLogout} className="px-4 py-2 font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600">Logout</button>
        </nav>
      </header>
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-dark-text mb-6">Create a New Report</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photo</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100" />
            </div>
            <div>
              <label htmlFor="volume" className="block text-sm font-medium text-gray-700">Estimated Volume</label>
              <select id="volume" value={volume} onChange={(e) => setVolume(e.target.value)} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Small">Small (Backpack size)</option>
                <option value="Medium">Medium (Wheelbarrow size)</option>
                <option value="Large">Large (Truck bed size)</option>
              </select>
            </div>
            <p className="text-sm text-center text-gray-500">
              {location ? `📍 Location captured successfully!` : 'Detecting your location...'}
            </p>
            <button type="submit" disabled={loading || !location} className="w-full px-4 py-3 font-semibold text-white bg-secondary rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors">
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}