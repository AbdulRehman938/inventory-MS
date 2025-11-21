import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    // Check if service role key exists
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    
    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY not found in environment");
      return new Response(
        JSON.stringify({ error: "Service role key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!supabaseUrl) {
      console.error("SUPABASE_URL not found in environment");
      return new Response(
        JSON.stringify({ error: "Supabase URL not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const body = await req.json();
    console.log("Request body:", body);
    
    const { email, password, fullName, roles } = body;

    if (!email || !password || !fullName || !roles) {
      return new Response(
        JSON.stringify({ error: "Email, password, full name, and roles are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Creating Supabase client with URL:", supabaseUrl);
    
    const supabaseAdmin = createClient(
      supabaseUrl ?? "",
      serviceRoleKey ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error("Error creating user:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create profile (or update if exists)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: roles,
        is_active: true,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Try to delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ error: "Failed to create user profile: " + profileError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email notification to the new user
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("RESEND_API_KEY exists:", !!resendApiKey);
    console.log("RESEND_API_KEY length:", resendApiKey?.length || 0);
    
    if (resendApiKey) {
      console.log("Attempting to send welcome email to:", email);
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Inventory MS <onboarding@resend.dev>",
            to: ["iamrehman941@gmail.com"], // Resend free tier: only your email works
            subject: `Welcome to Inventory MS - Account Created for ${email}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome to Inventory MS!</h2>
                <p><strong>Note:</strong> This email is sent to you (admin) because Resend free tier only allows sending to verified addresses.</p>
                <hr>
                <p>New account created for: <strong>${fullName}</strong></p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>User Email:</strong> ${email}</p>
                  <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
                  <p style="margin: 5px 0;"><strong>Role(s):</strong> ${roles.join(", ")}</p>
                </div>
                <p style="color: #dc2626;"><strong>Important:</strong> Please share these credentials with the user and ask them to change their password after first login.</p>
                <p>Thank you,<br>Inventory MS Team</p>
              </div>
            `,
          }),
        });

        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          console.log("✅ Email sent successfully:", emailData);
        } else {
          const errorText = await emailResponse.text();
          console.error("❌ Email send failed. Status:", emailResponse.status);
          console.error("Error details:", errorText);
        }
      } catch (emailError) {
        console.error("❌ Email send exception:", emailError.message);
      }
    } else {
      console.log("⚠️ RESEND_API_KEY not found in environment variables");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User created successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          roles,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
