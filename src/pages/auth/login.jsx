import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabaseClient';
import Spline from '@splinetool/react-spline';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        toast.error(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Get user roles from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        let userRoles = profile?.role;

        // If no profile found, create one with controller role
        if (!profile && !profileError) {
          console.log('No profile found, creating one with controller role...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              role: ['controller'],
              full_name: data.user.user_metadata?.full_name || 'User'
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
            toast.error('Error creating user profile. Please try again.');
            setLoading(false);
            return;
          }
          userRoles = ['controller'];
        } else if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast.error('Error fetching user profile. Please try again.');
          setLoading(false);
          return;
        }

        // Validate roles exist
        if (!userRoles || userRoles.length === 0) {
          toast.error('Invalid user roles. Please contact admin.');
          setLoading(false);
          return;
        }

        // Check if user has multiple roles
        if (userRoles.length > 1) {
          setAvailableRoles(userRoles);
          setUserData(data.user);
          setShowRoleSelector(true);
          setLoading(false);
          return;
        }

        // Single role - navigate directly
        const primaryRole = userRoles[0];
        navigateToRole(primaryRole, userRoles, data.user.id);
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRole = (selectedRole, allRoles, userId) => {
    // Set authentication state
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', selectedRole);
    localStorage.setItem('userRoles', JSON.stringify(allRoles)); // Store all roles
    localStorage.setItem('userId', userId);

    toast.success(`Welcome! Logging in as ${selectedRole}`);

    // Navigate based on selected role
    if (selectedRole === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/controller/dashboard');
    }
  };

  const handleRoleSelection = (role) => {
    navigateToRole(role, availableRoles, userData.id);
    setShowRoleSelector(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Role Selection Modal */}
      {showRoleSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
              Select Your Role
            </h2>
            <p className="text-gray-600 text-center mb-6">
              You have multiple roles. Please choose how you want to proceed:
            </p>
            <div className="space-y-3">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelection(role)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium capitalize">{role}</span>
                  <svg
                    className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center">
              You can always switch roles later from the dashboard
            </p>
          </div>
        </div>
      )}

      {/* Left Side - 3D Spline Scene */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <Spline scene="https://prod.spline.design/kOz7ef-PqxsxwwLA/scene.splinecode" />
        </div>
        
        {/* Overlay Text */}
        <div className="absolute bottom-8 left-8 text-white z-10 bg-black bg-opacity-30 p-6 rounded-lg backdrop-blur-sm">
          <h1 className="text-4xl font-bold mb-2">Inventory Management System</h1>
          <p className="text-lg opacity-90">Manage your inventory with ease and efficiency</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Login
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign up
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
