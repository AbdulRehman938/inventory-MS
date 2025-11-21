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
