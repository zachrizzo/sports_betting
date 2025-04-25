-- Drop any existing tables that we don't need
DROP TABLE IF EXISTS player_props;
DROP TABLE IF EXISTS betting_odds;
DROP TABLE IF EXISTS player_stats;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS games;

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  balance DECIMAL(10, 2) DEFAULT 0.0,
  total_winnings DECIMAL(10, 2) DEFAULT 0.0,
  total_losses DECIMAL(10, 2) DEFAULT 0.0,
  total_bets INTEGER DEFAULT 0,
  won_bets INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user bets table
CREATE TABLE IF NOT EXISTS user_bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL, -- External ID from DraftKings
  player_id TEXT, -- External ID from DraftKings (if applicable)
  bet_type TEXT NOT NULL, -- spread, moneyline, over/under, player prop
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  odds TEXT NOT NULL,
  potential_payout DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, won, lost
  settled_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user or assistant
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user simulations table
CREATE TABLE IF NOT EXISTS user_simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL, -- Store simulation parameters
  results JSONB NOT NULL, -- Store simulation results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_simulations ENABLE ROW LEVEL SECURITY;

-- User profiles policy
CREATE POLICY "Users can view their own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);

-- User bets policy
CREATE POLICY "Users can view their own bets" 
ON user_bets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bets" 
ON user_bets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Chat messages policy
CREATE POLICY "Users can view their own chat messages" 
ON chat_messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages" 
ON chat_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- User simulations policy
CREATE POLICY "Users can view their own simulations" 
ON user_simulations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simulations" 
ON user_simulations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulations" 
ON user_simulations FOR UPDATE 
USING (auth.uid() = user_id);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_bets_updated_at
BEFORE UPDATE ON user_bets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_simulations_updated_at
BEFORE UPDATE ON user_simulations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
