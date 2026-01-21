import { createClient } from '@supabase/supabase-js';
import { config } from './index.js';

// Create Supabase client
export const supabase = createClient(
  config.supabase.url,
  config.supabase.publishableKey
);

// Create Supabase admin client (for server-side operations)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.secretKey || config.supabase.publishableKey
);

export default supabase;
