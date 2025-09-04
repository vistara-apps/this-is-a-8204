import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database initialization and table creation
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    
    // Create users table
    const { error: usersError } = await supabaseAdmin.rpc('create_users_table');
    if (usersError && !usersError.message.includes('already exists')) {
      console.error('Error creating users table:', usersError);
    }
    
    // Create ad_batches table
    const { error: batchesError } = await supabaseAdmin.rpc('create_ad_batches_table');
    if (batchesError && !batchesError.message.includes('already exists')) {
      console.error('Error creating ad_batches table:', batchesError);
    }
    
    // Create ad_variations table
    const { error: variationsError } = await supabaseAdmin.rpc('create_ad_variations_table');
    if (variationsError && !variationsError.message.includes('already exists')) {
      console.error('Error creating ad_variations table:', variationsError);
    }
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

export { supabase, supabaseAdmin };
export default supabase;
