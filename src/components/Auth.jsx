import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('reporter');
  const [isSignUp, setIsSignUp] = useState(true);

  // --- LOGIC FOR 3D TILT EFFECT ---
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  // --- LOGIC FOR BACKGROUND SPOTLIGHT EFFECT ---
  const [mousePosition, setMousePosition] = useState({ x: -200, y: -200 });

  // Effect for the 3D card tilt
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    const handleMouseMove = (event) => {
      const rect = cardElement.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const rotateY = 20 * ((mouseX / rect.width) - 0.5);
      const rotateX = -20 * ((mouseY / rect.height) - 0.5);
      setRotate({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
      setRotate({ x: 0, y: 0 });
    };

    cardElement.addEventListener('mousemove', handleMouseMove);
    cardElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cardElement.removeEventListener('mousemove', handleMouseMove);
      cardElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Effect for the background spotlight
  useEffect(() => {
    const handleGlobalMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName, role } },
    });
    if (error) alert(error.message);
    else alert('Success! Please check your email for a confirmation link.');
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-300 overflow-hidden" style={{ perspective: '1000px' }}>
      {/* Background spotlight effect */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition duration-300"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.15), transparent 80%)`
        }}
      ></div>

      {/* The form card with a "glassmorphism" and 3D tilt effect */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-md p-8 space-y-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out"
        style={{ transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)` }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Get Started</h1>
          <p className="text-gray-400 mt-2">{isSignUp ? 'Join the community effort.' : 'Welcome back.'}</p>
        </div>
        <form onSubmit={isSignUp ? handleSignup : handleLogin} className="space-y-4">
          {isSignUp && (
             <input
              className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg placeholder:text-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          <input
            className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg placeholder:text-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg placeholder:text-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
           {isSignUp && (
            <select className={`w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all`} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="reporter">I am a Reporter</option>
              <option value="picker">I am a Picker</option>
            </select>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-green-600 text-white p-3 rounded-lg font-semibold mb-6 hover:bg-green-700 disabled:bg-gray-500 transform hover:scale-105 transition-all duration-300`}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className={`text-center text-gray-400`}>
          {isSignUp ? 'Already a member?' : "Don't have an account?"}
          <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-green-500 ml-1 hover:underline">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}