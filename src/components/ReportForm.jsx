import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ReportForm({ user }) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [volume, setVolume] = useState('Small');

  // 1. Get user's location when the component loads
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          console.log('Location captured:', position.coords);
        },
        () => {
          alert('Unable to retrieve your location. Please enable location services.');
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  // 2. Handle the form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!imageFile) {
      alert('Please select an image to upload.');
      return;
    }
    if (!location) {
      alert('Could not determine your location. Please wait or refresh.');
      return;
    }

    setLoading(true);
    
    // 3. Upload the image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('report-images') // Your bucket name
      .upload(`public/${Date.now()}_${imageFile.name}`, imageFile);

    if (uploadError) {
      alert(uploadError.message);
      setLoading(false);
      return;
    }

    // Get the public URL of the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('report-images')
      .getPublicUrl(uploadData.path);

    // 4. Insert the report into the database
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        location: `POINT(${location.lng} ${location.lat})`, // PostGIS format
        volume: volume,
      });

    if (insertError) {
      alert(insertError.message);
    } else {
      alert('Report submitted successfully!');
      // Optionally reset the form here
      setImageFile(null);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-extrabold text-center text-gray-900">Report New Garbage Pile</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* File Input */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Upload Photo
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              required
              className="w-full px-3 py-2 mt-1 text-gray-700 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Volume Selection */}
          <div>
            <label htmlFor="volume" className="block text-sm font-medium text-gray-700">
              Estimated Volume
            </label>
            <select
              id="volume"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Small">Small (e.g., a backpack)</option>
              <option value="Medium">Medium (e.g., a wheelbarrow)</option>
              <option value="Large">Large (e.g., a truck bed)</option>
            </select>
          </div>

          {/* Location Info */}
          <div className="text-sm text-center text-gray-500">
            {location ? `Location captured: Lat ${location.lat.toFixed(4)}, Lng ${location.lng.toFixed(4)}` : 'Getting your location...'}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || !location}
              className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}