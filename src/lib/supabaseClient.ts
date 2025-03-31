import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper functions for user management
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      redirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Family management functions
export const createFamily = async (familyName: string, creatorId: string) => {
  const { data, error } = await supabase
    .from('families')
    .insert([{ name: familyName, created_by: creatorId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getFamilyMembers = async (familyId: string) => {
  const { data, error } = await supabase
    .from('family_members')
    .select(`
      id,
      role,
      users (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('family_id', familyId);
  
  if (error) throw error;
  return data;
};

export const addFamilyMember = async (familyId: string, email: string, role: 'parent' | 'child' | 'other') => {
  // First check if user exists
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (userError && userError.code !== 'PGSQL_ERROR_NO_DATA_FOUND') throw userError;
  
  // If user doesn't exist, create an invitation
  if (!userData) {
    const { data: inviteData, error: inviteError } = await supabase
      .from('invitations')
      .insert([{ family_id: familyId, email, role }])
      .select()
      .single();
    
    if (inviteError) throw inviteError;
    return { invitation: inviteData };
  }
  
  // If user exists, add them to the family
  const { data: memberData, error: memberError } = await supabase
    .from('family_members')
    .insert([{ family_id: familyId, user_id: userData.id, role }])
    .select()
    .single();
  
  if (memberError) throw memberError;
  return { member: memberData };
};