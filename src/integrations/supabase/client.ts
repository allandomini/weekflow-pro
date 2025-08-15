import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.types';

const SUPABASE_URL = "https://lpvzaqouyffctdzqvibc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdnphcW91eWZmY3RkenF2aWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTUwNDUsImV4cCI6MjA3MDY3MTA0NX0.BoGBXE5F1zALDQkRtm2l2QI692LDzYdrISj7l7zutME";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});