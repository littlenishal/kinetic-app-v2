import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { addDays, format } from 'date-fns';

export interface Chore {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  assigned_to: string | null;
  rotation: boolean;
  rotation_members: string[] | null;
  current_assignee_index: number | null;
  created_at: string;
  created_by: string;
  next_due: string | null;
  last_completed: string | null;
  assignee_name?: string;
  creator_name?: string;
}

interface ChoresContextType {
  chores: Chore[];
  isLoading: boolean;
  error: string | null;
  createChore: (chore: Omit<Chore, 'id' | 'family_id' | 'created_at' | 'created_by' | 'next_due' | 'last_completed'>) => Promise<Chore>;
  updateChore: (id: string, updates: Partial<Chore>) => Promise<Chore>;
  deleteChore: (id: string) => Promise<void>;
  completeChore: (id: string) => Promise<Chore>;
  getDueChores: () => Chore[];
  getChoresByAssignee: (userId: string) => Chore[];
}

const ChoresContext = createContext<ChoresContextType | undefined>(undefined);

export function ChoresProvider({ children }: { children: React.ReactNode }) {
  const { user, currentFamily, familyMembers } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load chores when family changes
  useEffect(() => {
    if (user && currentFamily) {
      loadChores();
    } else {
      setChores([]);
    }
  }, [user, currentFamily]);

  // Load chores from database
  const loadChores = async () => {
    if (!currentFamily) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('chores')
        .select(`
          *,
          assignee:users!assigned_to(user_profiles(full_name)),
          creator:users!created_by(user_profiles(full_name))
        `)
        .eq('family_id', currentFamily.id)
        .order('next_due', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedChores = data.map(chore => ({
          ...chore,
          assignee_name: (chore.assignee as unknown as { full_name: string } | null)?.full_name || undefined,
          creator_name: (chore.creator as unknown as { full_name: string } | null)?.full_name || undefined
        }));
        
        setChores(formattedChores);
      }
    } catch (err) {
      console.error('Error loading chores:', err);
      setError('Failed to load chores');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate next due date based on frequency
  const calculateNextDueDate = (frequency: 'daily' | 'weekly' | 'monthly', lastCompleted: string | null = null): string => {
    const startDate = lastCompleted ? new Date(lastCompleted) : new Date();
    
    let nextDue: Date;
    
    switch (frequency) {
      case 'daily':
        nextDue = addDays(startDate, 1);
        break;
      case 'weekly':
        nextDue = addDays(startDate, 7);
        break;
      case 'monthly':
        nextDue = new Date(startDate);
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
      default:
        nextDue = addDays(startDate, 1);
    }
    
    return format(nextDue, "yyyy-MM-dd'T'HH:mm:ss");
  };

  // Get the next assignee in the rotation
  const getNextAssignee = (chore: Chore): string | null => {
    if (!chore.rotation || !chore.rotation_members || chore.rotation_members.length === 0) {
      return chore.assigned_to;
    }
    
    const nextIndex = chore.current_assignee_index !== null 
      ? (chore.current_assignee_index + 1) % chore.rotation_members.length
      : 0;
    
    return chore.rotation_members[nextIndex];
  };

  // Create a new chore
  const createChore = async (chore: Omit<Chore, 'id' | 'family_id' | 'created_at' | 'created_by' | 'next_due' | 'last_completed'>): Promise<Chore> => {
    if (!user || !currentFamily) {
      throw new Error('User not authenticated or no family selected');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Calculate initial next due date
      const nextDue = calculateNextDueDate(chore.frequency);
      
      const { data, error } = await supabase
        .from('chores')
        .insert([{
          ...chore,
          family_id: currentFamily.id,
          created_by: user.id,
          next_due: nextDue,
          last_completed: null
        }])
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create chore');
      
      // Get assignee name if assigned
      let assigneeName = null;
      if (data.assigned_to) {
        const member = familyMembers.find(m => m.user_id === data.assigned_to);
        assigneeName = member?.profile?.full_name || null;
      }
      
      // Get creator name
      let creatorName = null;
      const creator = familyMembers.find(m => m.user_id === user.id);
      creatorName = creator?.profile?.full_name || null;
      
      const newChore: Chore = {
        ...data,
        assignee_name: assigneeName ?? undefined,
        creator_name: creatorName ?? undefined
      };
      
      setChores(prevChores => [...prevChores, newChore]);
      
      return newChore;
    } catch (err) {
      console.error('Error creating chore:', err);
      setError('Failed to create chore');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing chore
  const updateChore = async (id: string, updates: Partial<Chore>): Promise<Chore> => {
    if (!currentFamily) {
      throw new Error('No family selected');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Remove computed fields
      const { assignee_name, creator_name, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('chores')
        .update(updateData)
        .eq('id', id)
        .eq('family_id', currentFamily.id)
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to update chore');
      
      // Get assignee name if assigned
      let assigneeName = null;
      if (data.assigned_to) {
        const member = familyMembers.find(m => m.user_id === data.assigned_to);
        assigneeName = member?.profile?.full_name || null;
      }
      
      // Get creator name
      let creatorName = null;
      const creator = familyMembers.find(m => m.user_id === data.created_by);
      creatorName = creator?.profile?.full_name || null;
      
      const updatedChore: Chore = {
        ...data,
        assignee_name: assigneeName ?? undefined,
        creator_name: creatorName ?? undefined
      };
      
      setChores(prevChores => 
        prevChores.map(chore => 
          chore.id === id ? updatedChore : chore
        )
      );
      
      return updatedChore;
    } catch (err) {
      console.error('Error updating chore:', err);
      setError('Failed to update chore');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a chore
  const deleteChore = async (id: string): Promise<void> => {
    if (!currentFamily) {
      throw new Error('No family selected');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', id)
        .eq('family_id', currentFamily.id);
      
      if (error) throw error;
      
      setChores(prevChores => 
        prevChores.filter(chore => chore.id !== id)
      );
    } catch (err) {
      console.error('Error deleting chore:', err);
      setError('Failed to delete chore');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Mark a chore as completed
  const completeChore = async (id: string): Promise<Chore> => {
    const chore = chores.find(c => c.id === id);
    if (!chore) {
      throw new Error('Chore not found');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Update completion status
      const now = new Date().toISOString();
      const nextDue = calculateNextDueDate(chore.frequency, now);
      
      // Get next assignee if using rotation
      const nextAssignee = getNextAssignee(chore);
      const nextAssigneeIndex = chore.rotation && chore.rotation_members 
        ? (chore.current_assignee_index !== null 
            ? (chore.current_assignee_index + 1) % chore.rotation_members.length
            : 0)
        : chore.current_assignee_index;
      
      const updates = {
        last_completed: now,
        next_due: nextDue,
        assigned_to: nextAssignee,
        current_assignee_index: nextAssigneeIndex
      };
      
      return updateChore(id, updates);
    } catch (err) {
      console.error('Error completing chore:', err);
      setError('Failed to mark chore as completed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get all chores that are due
  const getDueChores = (): Chore[] => {
    const now = new Date();
    
    return chores.filter(chore => {
      if (!chore.next_due) return false;
      
      const dueDate = new Date(chore.next_due);
      return dueDate <= now;
    });
  };

  // Get chores assigned to a specific user
  const getChoresByAssignee = (userId: string): Chore[] => {
    return chores.filter(chore => chore.assigned_to === userId);
  };

  const value = {
    chores,
    isLoading,
    error,
    createChore,
    updateChore,
    deleteChore,
    completeChore,
    getDueChores,
    getChoresByAssignee
  };

  return <ChoresContext.Provider value={value}>{children}</ChoresContext.Provider>;
}

export function useChores() {
  const context = useContext(ChoresContext);
  if (context === undefined) {
    throw new Error('useChores must be used within a ChoresProvider');
  }
  return context;
}