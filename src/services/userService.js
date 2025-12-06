import { supabase } from '../lib/supabaseClient';

// Create new user via edge function (admin only)
export const createUserByAdmin = async (email, password, fullName, roles) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email, password, fullName, roles }
    });

    if (error) throw error;
    if (data?.success) {
      return { success: true, message: 'User created successfully', data: data.user };
    }
    return { success: false, message: data?.message || 'Failed to create user' };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, message: error.message };
  }
};

// Update user data including email and password (admin only)
export const updateUserData = async (userId, updates) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-update-user', {
      body: { userId, updates }
    });

    if (error) throw error;
    if (data?.success) {
      return { success: true, message: 'User updated successfully' };
    }
    return { success: false, message: data?.message || 'Failed to update user' };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, message: error.message };
  }
};

// Delete user completely (admin only)
export const deleteUserCompletely = async (userId) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { userId }
    });

    if (error) throw error;
    if (data?.success) {
      return { success: true, message: 'User deleted successfully' };
    }
    return { success: false, message: data?.message || 'Failed to delete user' };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: error.message };
  }
};

// Get all OTPs (admin only)
export const getAllOTPs = async () => {
  try {
    const { data, error } = await supabase
      .from('otp_verification')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching OTPs:', error);
    return { success: false, message: error.message };
  }
};

// Get all users (admin only) - using edge function to bypass RLS
export const getAllUsers = async () => {
  try {
    // First try direct query (if RLS allows)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Direct query error:', error);
      // If direct query fails, user might not have admin permissions
      // RLS might be blocking
      throw error;
    }
    
    console.log('Fetched users count:', data?.length || 0);
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, message: error.message };
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, newRoles) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRoles })
      .eq('id', userId);

    if (error) throw error;
    return { success: true, message: 'User role updated successfully' };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, message: error.message };
  }
};

// Delete user (legacy - use deleteUserCompletely instead)
export const deleteUser = async (userId) => {
  return await deleteUserCompletely(userId);
};



// Toggle user active status
export const toggleUserStatus = async (userId, isActive) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) throw error;
    return { success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully` };
  } catch (error) {
    console.error('Error toggling user status:', error);
    return { success: false, message: error.message };
  }
};

// Get current user profile
export const getCurrentUserProfile = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching profile:', error);
        return { success: false, message: error.message };
    }
};

// Update current user profile
export const updateCurrentUserProfile = async (userId, updates) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;
        return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, message: error.message };
    }
};

// --- Biodata Management ---

// Save or Update Biodata
export const saveBiodata = async (userId, biodata) => {
    try {
        const { error } = await supabase
            .from('user_biodata')
            .upsert({ 
                user_id: userId, 
                data: biodata,
                verification_status: 'idle', // Reset status on edit so user can re-request
                admin_remarks: null, // Clear remarks
                admin_details: null // Clear admin details
             }, { onConflict: 'user_id' });

        if (error) throw error;
        return { success: true, message: 'Biodata saved successfully' };
    } catch (error) {
        console.error('Error saving biodata:', error);
        return { success: false, message: error.message };
    }
};

// Get Biodata
export const getBiodata = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('user_biodata')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(); // maybeSingle because it might not exist yet

        if (error) throw error;
        
        // Return flatten structure if needed, or just data object
        if (data) {
             return { success: true, data: { ...data.data, verification_status: data.verification_status, admin_remarks: data.admin_remarks, admin_details: data.admin_details } };
        }
        return { success: true, data: null };
    } catch (error) {
        console.error('Error fetching biodata:', error);
        return { success: false, message: error.message };
    }
};

// Request Verification
export const requestBiodataVerification = async (userId) => {
    try {
        const { error } = await supabase
            .from('user_biodata')
            .update({ verification_status: 'pending' })
            .eq('user_id', userId);

        if (error) throw error;

        // Notify User
        await createNotification({
            userId,
            type: 'info',
            title: 'Verification Pending',
            message: 'Your request has been submitted to the administration for review.'
        });

        // Notify Admins
        // Use RPC to get admin IDs to bypass RLS restrictions if active
        // Fallback to client-side query if RPC not exists (but RPC is safer for RLS)
        let adminIds = [];
        
        // Try getting via RPC first (we'll creating this function next)
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_ids');
        
        if (!rpcError && rpcData) {
            adminIds = rpcData;
        } else {
            // Fallback: This might fail if RLS prevents reading other profiles
            const { data: admins } = await supabase.from('profiles').select('id').contains('role', ['admin']);
            if (admins) adminIds = admins.map(a => a.id);
        }

        if (adminIds.length > 0) {
            for (const adminObj of adminIds) {
                 // Handle both RPC object result {id: ...} and direct ID string if fallback used map
                 const targetAdminId = adminObj.id || adminObj;
                 
                 await createNotification({
                    userId: targetAdminId,
                    type: 'info',
                    title: 'New Biodata Request',
                    message: 'A user has requested biodata verification. Please review it.',
                    link: JSON.stringify({ tab: 'biodata', id: userId }) // Store target tab and ID
                });
            }
        }

        return { success: true, message: 'Verification requested' };
    } catch (error) {
        console.error('Error requesting verification:', error);
        return { success: false, message: error.message };
    }
};

// Request Role/Location Assignment (Controller -> Admin)
export const requestRoleAssignment = async (userId, userName) => {
    try {
        // Get Admin IDs
        let adminIds = [];
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_ids');
        
        if (!rpcError && rpcData) {
            adminIds = rpcData;
        } else {
            const { data: admins } = await supabase.from('profiles').select('id').contains('role', ['admin']);
            if (admins) adminIds = admins.map(a => a.id);
        }

        if (adminIds.length > 0) {
            for (const adminObj of adminIds) {
                const targetAdminId = adminObj.id || adminObj;
                await createNotification({
                    userId: targetAdminId,
                    type: 'warning',
                    title: 'Role/Location Assignment Needed',
                    message: `${userName} has requested a role or location assignment. Please update their profile.`,
                    link: JSON.stringify({ tab: 'users', id: userId }) // Link to User Management
                });
            }
        }
        return { success: true, message: 'Admins notified' };
    } catch (error) {
        console.error('Error requesting role assignment:', error);
        return { success: false, message: error.message };
    }
};

// Get All Biodata Requests (Admin)
export const getAllBiodataRequests = async () => {
    try {
        // We join with profiles to get names
        const { data, error } = await supabase
            .from('user_biodata')
            .select('*, profiles:user_id(full_name, email)')
            .eq('verification_status', 'pending');

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching requests:', error);
        return { success: false, message: error.message };
    }
};

// Review Biodata Request (Admin)
export const reviewBiodataRequest = async (userId, status, remarks, adminName) => {
    try {
        const updates = {
            verification_status: status,
            admin_remarks: remarks,
            admin_details: status === 'approved' ? { name: adminName, date: new Date().toISOString() } : null
        };

        const { error } = await supabase
            .from('user_biodata')
            .update(updates)
            .eq('user_id', userId);

        if (error) throw error;

        // Notify User
        await createNotification({
            userId,
            type: status === 'approved' ? 'success' : 'error',
            title: `Biodata Verification ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            message: status === 'approved' 
                ? `Your biodata has been verified by ${adminName}. You can now download your official PDF.` 
                : `Your biodata verification was rejected. Remarks: ${remarks}`,
        });

        return { success: true, message: `Request ${status}` };
    } catch (error) {
        console.error('Error reviewing request:', error);
        return { success: false, message: error.message };
    }
};

// --- Notifications ---

export const getNotifications = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, message: error.message };
    }
};

export const markNotificationRead = async (notificationId) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error marking notification read:', error);
        return { success: false, message: error.message };
    }
};

export const markAllNotificationsRead = async (userId) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error marking all notifications read:', error);
        return { success: false, message: error.message };
    }
};

export const createNotification = async ({ userId, type = 'info', title, message, link = null }) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                link
            });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false, message: error.message };
    }
};
