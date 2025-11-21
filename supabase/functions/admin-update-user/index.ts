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
    const { userId, updates } = await req.json();

    if (!userId || !updates) {
      return new Response(
        JSON.stringify({ error: "User ID and updates are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Update auth user if email or password is being changed
    const authUpdates: any = {};
    if (updates.email) authUpdates.email = updates.email;
    if (updates.password) {
      if (updates.password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      authUpdates.password = updates.password;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdates
      );

      if (authError) {
        console.error("Error updating auth user:", authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Update profile
    const profileUpdates: any = {};
    if (updates.email) profileUpdates.email = updates.email;
    if (updates.fullName) profileUpdates.full_name = updates.fullName;
    if (updates.roles) profileUpdates.role = updates.roles;
    if (updates.isActive !== undefined) profileUpdates.is_active = updates.isActive;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        return new Response(
          JSON.stringify({ error: "Failed to update user profile" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Send email notification (async, don't wait)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && updates.email) {
      supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single()
        .then(({ data: userData }) => {
          const changedFields = [];
          if (updates.email) changedFields.push("Email");
          if (updates.password) changedFields.push("Password");
          if (updates.fullName) changedFields.push("Full Name");
          if (updates.roles) changedFields.push("Roles");
          if (updates.isActive !== undefined) changedFields.push("Account Status");

          return fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Inventory MS <onboarding@resend.dev>",
              to: [updates.email],
              subject: "Your Account Has Been Updated",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">Account Update Notification</h2>
                  <p>Hello <strong>${userData?.full_name || "User"}</strong>,</p>
                  <p>Your account has been updated by an administrator.</p>
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Updated Fields:</strong></p>
                    <ul style="margin: 10px 0;">
                      ${changedFields.map(field => `<li>${field}</li>`).join("")}
                    </ul>
                    ${updates.email ? `<p style="margin: 5px 0;"><strong>New Email:</strong> ${updates.email}</p>` : ""}
                    ${updates.fullName ? `<p style="margin: 5px 0;"><strong>New Name:</strong> ${updates.fullName}</p>` : ""}
                    ${updates.roles ? `<p style="margin: 5px 0;"><strong>New Role(s):</strong> ${updates.roles.join(", ")}</p>` : ""}
                    ${updates.password ? `<p style="color: #dc2626;"><strong>Password Changed:</strong> Please use your new password to login.</p>` : ""}
                    ${updates.isActive !== undefined ? `<p style="margin: 5px 0;"><strong>Status:</strong> ${updates.isActive ? "Active" : "Inactive"}</p>` : ""}
                  </div>
                  <p>If you did not request these changes, please contact your administrator immediately.</p>
                  <p>Thank you,<br>Inventory MS Team</p>
                </div>
              `,
            }),
          });
        })
        .catch(err => console.error("Email send error:", err));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User updated successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
