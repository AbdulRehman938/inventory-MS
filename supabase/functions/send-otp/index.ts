// Supabase Edge Function: send-otp
// Deploy this to: supabase/functions/send-otp/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, purpose } = await req.json()

    // Validate input
    if (!email || !purpose) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email and purpose are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate OTP via database function
    let otpData
    if (purpose === 'password_reset') {
      const { data, error } = await supabaseClient.rpc('create_password_reset_otp', {
        user_email: email
      })
      
      if (error) throw error
      otpData = data
    } else if (purpose === 'signup') {
      const { data, error } = await supabaseClient.rpc('generate_otp', {
        user_email: email
      })
      
      if (error) throw error
      otpData = data
    } else {
      throw new Error('Invalid purpose')
    }

    if (!otpData?.success) {
      throw new Error(otpData?.message || 'Failed to generate OTP')
    }

    // Send email via Resend API
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email service not configured. Contact administrator.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const emailSubject = purpose === 'password_reset' 
      ? 'Password Reset OTP' 
      : 'Verify Your Email'
    
    const emailBody = purpose === 'password_reset'
      ? `Your password reset OTP is: <strong>${otpData.otp}</strong><br><br>This code will expire in 10 minutes.`
      : `Your verification OTP is: <strong>${otpData.otp}</strong><br><br>This code will expire in 10 minutes.`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Inventory MS <onboarding@resend.dev>', // Change this to your verified domain
        to: [email],
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${emailSubject}</h2>
            <p style="font-size: 16px; color: #666;">
              ${emailBody}
            </p>
            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        `,
      }),
    })

    const resendData = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', resendData)
      throw new Error(resendData.message || 'Failed to send email')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully',
        emailId: resendData.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in send-otp function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Internal server error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
