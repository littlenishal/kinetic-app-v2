import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, signInWithGoogle, signOut } from '../lib/supabaseClient';
import { Database } from '../types/supabase';

type FamilyMember = Database['public']['Tables']['family_members']['Row'] & {
  profile?: {
    full_name: string;
    avatar_url: string | null;
    email: string | null;
  }
};

type Family = Database['public']['Tables']['families']['Row'] & {
  members?: FamilyMember[];
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  families: Family[];
  currentFamily: Family | null;
  setCurrentFamily: (family: Family | null) => void;
  familyMembers: FamilyMember[];
  login: () => Promise<void>;
  logout: () => Promise<void>;
  createNewFamily: (name: string) => Promise<Family>;
  addFamilyMember: (email: string, role: 'parent' | 'child' | 'other') => Promise<void>;
  email: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setEmail(session?.user?.email || null);
        // If user is logged in, load their families   
        
        if (session?.user) {
          // Load user's families
          await loadUserFamilies(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setEmail(session?.user?.email || null);
        // Handle sign-in and sign-out events
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserFamilies(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setFamilies([]);
          setCurrentFamily(null);
          setFamilyMembers([]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load user's families and set the current one
  const loadUserFamilies = async (userId: string) => {
    try {
      // Get families where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId);
      
      if (memberError) throw memberError;
      
      if (memberData && memberData.length > 0) {
        // Get family details
        const familyIds = memberData.map(m => m.family_id);
        const { data: familiesData, error: familiesError } = await supabase
          .from('families')
          .select('*')
          .in('id', familyIds);
        
        if (familiesError) throw familiesError;
        
        if (familiesData && familiesData.length > 0) {
          setFamilies(familiesData);
          
          // Set the first family as current by default
          const firstFamily = familiesData[0];
          setCurrentFamily(firstFamily);
          
          // Load members for this family
          await loadFamilyMembers(firstFamily.id);
        }
      }
    } catch (error) {
      console.error('Error loading user families:', error);
    }
  };

  // Load members for a specific family
  const loadFamilyMembers = async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          profile:user_profiles(full_name, avatar_url)
        `)
        .eq('family_id', familyId);
      
      if (error) throw error;
      
      if (data) {
        setFamilyMembers(
          data.map(member => ({
            ...member,
            profile: member.profile && 'full_name' in member.profile && 'avatar_url' in member.profile
              ? member.profile
              : undefined,
          })) as FamilyMember[]
        );
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  // Handle family change
  useEffect(() => {
    if (currentFamily) {
      loadFamilyMembers(currentFamily.id);
    }
  }, [currentFamily]);

  // Login with Google
  const login = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      setUser(null);
      setFamilies([]);
      setCurrentFamily(null);
      setFamilyMembers([]);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new family
  const createNewFamily = async (name: string): Promise<Family> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      
      // Create the family
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert([{ name, created_by: user.id }])
        .select()
        .single();
      
      if (familyError) throw familyError;
      if (!familyData) throw new Error('Failed to create family');
      
      // Add the creator as a parent member
      const { error: memberError } = await supabase
        .from('family_members')
        .insert([{
          family_id: familyData.id,
          user_id: user.id,
          role: 'parent',
          color: '#4285F4' // Default blue color
        }]);
      
      if (memberError) throw memberError;
      
      // Update state
      const newFamily = { ...familyData, members: [] } as Family;
      setFamilies([...families, newFamily]);
      setCurrentFamily(newFamily);
      
      return newFamily;
    } catch (error) {
      console.error('Error creating family:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a member to the current family
  const addFamilyMember = async (email: string, role: 'parent' | 'child' | 'other') => {
    if (!user) throw new Error('User not authenticated');
    if (!currentFamily) throw new Error('No family selected');
    
    try {
      setIsLoading(true);
      
      // First, check if user exists
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      
      if (userError && userError.code !== 'PGSQL_ERROR_NO_DATA_FOUND') throw userError;
      
      if (!userData) {
        // Create an invitation
        const { error: inviteError } = await supabase
          .from('invitations')
          .insert([{
            family_id: currentFamily.id,
            email,
            role,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            accepted: false
          }]);
        
        if (inviteError) throw inviteError;
      } else {
        // Add existing user as a member
        const { error: memberError } = await supabase
          .from('family_members')
          .insert([{
            family_id: currentFamily.id,
            user_id: userData.user_id,
            role,
            color: role === 'parent' ? '#EA4335' : role === 'child' ? '#34A853' : '#FBBC05'
          }]);
        
        if (memberError) throw memberError;
        
        // Reload family members
        await loadFamilyMembers(currentFamily.id);
      }
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    email,
    isLoading,
    families,
    currentFamily,
    setCurrentFamily,
    familyMembers,
    login,
    logout,
    createNewFamily,
    addFamilyMember
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}