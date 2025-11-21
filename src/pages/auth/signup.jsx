import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabaseClient';
import { sendSignupVerificationOTP } from '../../services/authService';

const Signup = () => {
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastOTPSentTime, setLastOTPSentTime] = useState(null);
  const navigate = useNavigate();

  // Cooldown timer effect
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase (always as controller)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation link
          data: {
            full_name: formData.fullName,
            role: 'controller',
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Check if email is already registered
        if (data.user.identities && data.user.identities.length === 0) {
          toast.error('This email is already registered. Please login instead.');
          setLoading(false);
          return;
        }

        // Store user ID for OTP verification
        setUserId(data.user.id);

        // Send OTP for verification
        const otpResult = await sendSignupVerificationOTP(formData.email);
        
        if (otpResult.success) {
          toast.success('OTP sent to your email. Please verify to continue.');
          setStep(2);
          setResendCooldown(120); // 2 minutes
          setLastOTPSentTime(Date.now());
        } else {
          toast.error(otpResult.message);
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      toast.error(err.message || 'An error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify OTP
      const { data, error } = await supabase.rpc('verify_otp', {
        user_email: formData.email,
        otp_code: otp
      });

      if (error) throw error;

      if (data.success) {
        // Mark email as confirmed in auth.users
        const { error: updateError } = await supabase.rpc('confirm_user_email', {
          user_id: userId
        });

        if (updateError) throw updateError;

        // Check if profile already exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        // Create profile only if it doesn't exist
        if (!existingProfile && !checkError) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: formData.email,
              full_name: formData.fullName,
              role: ['controller']
            });

          if (profileError && profileError.code !== '23505') {
            throw profileError;
          }
        }

        toast.success('Account verified successfully! Please login.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(data.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      toast.error(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, '0')} before requesting a new OTP`);
      return;
    }

    setLoading(true);
    const result = await sendSignupVerificationOTP(formData.email);
    
    if (result.success) {
      toast.success('OTP resent to your email.');
      setResendCooldown(120); // 2 minutes
      setLastOTPSentTime(Date.now());
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {step === 1 ? 'Create Account' : 'Verify Email'}
        </h2>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        ) : (
          <>
            <p className="text-gray-600 text-center mb-6">
              Enter the 6-digit OTP sent to <span className="font-semibold">{formData.email}</span>
            </p>
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  OTP Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength="6"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading || resendCooldown > 0}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
                {resendCooldown > 0 && (
                  <span className="text-sm text-gray-600">
                    ({Math.floor(resendCooldown / 60)}:{String(resendCooldown % 60).padStart(2, '0')})
                  </span>
                )}
              </div>
            </form>
          </>
        )}

        {step === 1 && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Signup;
