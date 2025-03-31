import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export interface Todo {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to: string | null;
  created_at: string;
  created_by: string;
  assignee_name?: string;
  creator_name?: string;
}

interface TodosContextType {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  createTodo: (todo: Omit<Todo, 'id' | 'family_id' | 'created_at' | 'created_by'>) => Promise<Todo>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<Todo>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodoStatus: (id: string) => Promise<Todo>;
  filterTodos: (criteria: {
    assignedTo?: string | null;
    status?: 'pending' | 'in_progress' | 'completed' | 'active';
    priority?: 'low' | 'medium' | 'high';
    dueSoon?: boolean;
  }) => Todo[];
}

const TodosContext = createContext<TodosContextType | undefined>(undefined);

export function TodosProvider({ children }: { children: React.ReactNode }) {
  const { user, currentFamily, familyMembers } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load todos when family changes
  useEffect(() => {
    if (user && currentFamily) {
      loadTodos();
    } else {
      setTodos([]);
    }
  }, [user, currentFamily]);

  // Load todos from database
  const loadTodos = async () => {
    if (!currentFamily) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('todos')
        .select(`
          *,
          assignee:users!assigned_to(user_profiles(full_name)),
          creator:users!created_by(user_profiles(full_name))
        `)
        .eq('family_id', currentFamily.id)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const formattedTodos = data.map(todo => ({
          ...todo,
          assignee_name: (todo.assignee && 'full_name' in todo.assignee) ? todo.assignee.full_name as string | undefined : undefined,
          creator_name: (todo.creator && 'full_name' in todo.creator) ? todo.creator.full_name as string | undefined : undefined
        }));
        
        setTodos(formattedTodos);
      }
    } catch (err) {
      console.error('Error loading todos:', err);
      setError('Failed to load to-dos');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new todo
  const createTodo = async (todo: Omit<Todo, 'id' | 'family_id' | 'created_at' | 'created_by'>): Promise<Todo> => {
    if (!user || !currentFamily) {
      throw new Error('User not authenticated or no family selected');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('todos')
        .insert([{
          ...todo,
          family_id: currentFamily.id,
          created_by: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create to-do');
      
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
      
      const newTodo: Todo = {
        ...data,
        assignee_name: assigneeName ?? undefined,
        creator_name: creatorName ?? undefined
      };
      
      setTodos(prevTodos => [...prevTodos, newTodo]);
      
      return newTodo;
    } catch (err) {
      console.error('Error creating todo:', err);
      setError('Failed to create to-do');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing todo
  const updateTodo = async (id: string, updates: Partial<Todo>): Promise<Todo> => {
    if (!currentFamily) {
      throw new Error('No family selected');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Remove computed fields
      const { assignee_name, creator_name, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', id)
        .eq('family_id', currentFamily.id)
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to update to-do');
      
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
      
      const updatedTodo: Todo = {
        ...data,
        assignee_name: assigneeName ?? undefined,
        creator_name: creatorName ?? undefined
      };
      
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id ? updatedTodo : todo
        )
      );
      
      return updatedTodo;
    } catch (err) {
      console.error('Error updating todo:', err);
      setError('Failed to update to-do');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a todo
  const deleteTodo = async (id: string): Promise<void> => {
    if (!currentFamily) {
      throw new Error('No family selected');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('family_id', currentFamily.id);
      
      if (error) throw error;
      
      setTodos(prevTodos => 
        prevTodos.filter(todo => todo.id !== id)
      );
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError('Failed to delete to-do');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle todo status (complete/incomplete)
  const toggleTodoStatus = async (id: string): Promise<Todo> => {
    const todo = todos.find(t => t.id === id);
    if (!todo) {
      throw new Error('To-do not found');
    }
    
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    
    return updateTodo(id, { status: newStatus });
  };

  // Filter todos by various criteria
  const filterTodos = (criteria: {
    assignedTo?: string | null;
    status?: 'pending' | 'in_progress' | 'completed' | 'active';
    priority?: 'low' | 'medium' | 'high';
    dueSoon?: boolean;
  }): Todo[] => {
    return todos.filter(todo => {
      // Filter by assignee
      if (criteria.assignedTo !== undefined && todo.assigned_to !== criteria.assignedTo) {
        return false;
      }
      
      // Filter by status
      if (criteria.status === 'active' && todo.status === 'completed') {
        return false;
      } else if (criteria.status && criteria.status !== 'active' && todo.status !== criteria.status) {
        return false;
      }
      
      // Filter by priority
      if (criteria.priority && todo.priority !== criteria.priority) {
        return false;
      }
      
      // Filter by due soon (next 48 hours)
      if (criteria.dueSoon && todo.due_date) {
        const dueDate = new Date(todo.due_date);
        const now = new Date();
        const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (diffHours > 48) {
          return false;
        }
      }
      
      return true;
    });
  };

  const value = {
    todos,
    isLoading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodoStatus,
    filterTodos
  };

  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>;
}

export function useTodos() {
  const context = useContext(TodosContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodosProvider');
  }
  return context;
}
