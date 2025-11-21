import { supabase } from '../lib/supabaseClient';

// Generate and send OTP for password reset using Edge Function
export const sendPasswordResetOTP = async (email) => {
  try {
    // Call Edge Function to generate OTP and send email
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { 
        email,
        purpose: 'password_reset'
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    if (data?.success) {
      return { success: true, message: 'OTP sent to your email' };
    }

    return { success: false, message: data?.message || 'Failed to send OTP' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    
    // Fallback: Try direct database call if edge function fails
    try {
      const { data: dbData, error: dbError } = await supabase.rpc('create_password_reset_otp', {
        user_email: email
      });

      if (dbError) throw dbError;

      if (dbData.success) {
        // In development, show OTP
        if (import.meta.env.DEV) {
          console.log('=================================');
          console.log('📧 DEVELOPMENT MODE - OTP Code:', dbData.otp);
          console.log('=================================');
          alert(`DEVELOPMENT MODE:\nYour OTP is: ${dbData.otp}\n\nNote: Edge Function not available. Check EDGE_FUNCTION_SETUP.md`);
        }
        return { success: true, message: 'OTP generated. Check console in development mode.' };
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }

    return { success: false, message: error.message };
  }
};

// Verify OTP
export const verifyPasswordResetOTP = async (email, otp) => {
  try {
    const { data, error } = await supabase.rpc('verify_otp', {
      user_email: email,
      otp_code: otp
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: error.message };
  }
};

// Reset password after OTP verification
export const resetPassword = async (email, newPassword) => {
  try {
    // Get user by email to verify they exist
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!profile) {
      return { success: false, message: 'User not found' };
    }

    // Use Supabase Admin API to update the user's password
    // This requires using the service role, so we'll use an edge function
    const { data, error } = await supabase.functions.invoke('reset-password', {
      body: { 
        email: email,
        newPassword: newPassword
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    if (data?.success) {
      return { success: true, message: 'Password reset successfully' };
    }

    return { success: false, message: data?.message || 'Failed to reset password' };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, message: error.message };
  }
};

// Send OTP for email verification (signup)
export const sendSignupVerificationOTP = async (email) => {
  try {
    // Call Edge Function to send verification OTP
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { 
        email,
        purpose: 'signup'
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    if (data?.success) {
      return { success: true, message: 'Verification code sent to your email' };
    }

    return { success: false, message: data?.message || 'Failed to send verification code' };
  } catch (error) {
    console.error('Error sending verification OTP:', error);
    return { success: false, message: error.message };
  }
};
