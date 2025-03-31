-- Create necessary tables for Family Calendar Assistant

-- Users table is already provided by Supabase Auth

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Families
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_calendar_id TEXT
);

-- Family members
CREATE TYPE family_role AS ENUM ('parent', 'child', 'other');

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role family_role NOT NULL DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  color TEXT,
  UNIQUE(family_id, user_id)
);

-- To-dos
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE todo_status AS ENUM ('pending', 'in_progress', 'completed');

CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority priority_level NOT NULL DEFAULT 'medium',
  status todo_status NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Chores
CREATE TYPE frequency AS ENUM ('daily', 'weekly', 'monthly');

CREATE TABLE chores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency frequency NOT NULL DEFAULT 'weekly',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rotation BOOLEAN NOT NULL DEFAULT false,
  rotation_members UUID[] DEFAULT NULL,
  current_assignee_index INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  next_due TIMESTAMP WITH TIME ZONE,
  last_completed TIMESTAMP WITH TIME ZONE
);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role family_role NOT NULL DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false
);

-- Chat history
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for families
CREATE POLICY "Family members can view their families" ON families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = families.id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create families" ON families
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Only family creators can update families" ON families
  FOR UPDATE USING (auth.uid() = created_by);

-- Create policies for family_members
CREATE POLICY "Family members can view other members" ON family_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members AS fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can add family members" ON family_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members AS fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'parent'
    )
  );

CREATE POLICY "Parents can update family members" ON family_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_members AS fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'parent'
    )
  );

CREATE POLICY "Parents can delete family members" ON family_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM family_members AS fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'parent'
    )
  );

-- Create policies for todos
CREATE POLICY "Family members can view todos" ON todos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = todos.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create todos" ON todos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = todos.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can update todos" ON todos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = todos.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can delete todos" ON todos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = todos.family_id
      AND family_members.user_id = auth.uid()
    )
  );

-- Create policies for chores
CREATE POLICY "Family members can view chores" ON chores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = chores.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create chores" ON chores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = chores.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can update chores" ON chores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = chores.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can delete chores" ON chores
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = chores.family_id
      AND family_members.user_id = auth.uid()
    )
  );

-- Create policies for invitations
CREATE POLICY "Family members can view invitations" ON invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = invitations.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = invitations.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'parent'
    )
  );

CREATE POLICY "Parents can update invitations" ON invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = invitations.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'parent'
    )
  );

-- Create policies for chat_history
CREATE POLICY "Family members can view chat history" ON chat_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = chat_history.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can insert chat history" ON chat_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = chat_history.family_id
      AND family_members.user_id = auth.uid()
    )
  );

-- Create functions and triggers

-- Function to update next_due date when a chore is completed
CREATE OR REPLACE FUNCTION update_next_due()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_completed IS NOT NULL AND 
     (OLD.last_completed IS NULL OR NEW.last_completed != OLD.last_completed) THEN
    
    -- Calculate next due date based on frequency
    CASE NEW.frequency
      WHEN 'daily' THEN
        NEW.next_due := NEW.last_completed + INTERVAL '1 day';
      WHEN 'weekly' THEN
        NEW.next_due := NEW.last_completed + INTERVAL '7 days';
      WHEN 'monthly' THEN
        NEW.next_due := NEW.last_completed + INTERVAL '1 month';
    END CASE;
    
    -- Update next assignee if rotation is enabled
    IF NEW.rotation = TRUE AND NEW.rotation_members IS NOT NULL AND 
       array_length(NEW.rotation_members, 1) > 0 THEN
      
      -- Increment assignee index
      IF NEW.current_assignee_index IS NULL THEN
        NEW.current_assignee_index := 0;
      ELSE
        NEW.current_assignee_index := (NEW.current_assignee_index + 1) % array_length(NEW.rotation_members, 1);
      END IF;
      
      -- Set new assignee
      NEW.assigned_to := NEW.rotation_members[NEW.current_assignee_index + 1]; -- Arrays in PostgreSQL are 1-indexed
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chore_completed
BEFORE UPDATE ON chores
FOR EACH ROW EXECUTE FUNCTION update_next_due();

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'), 
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();