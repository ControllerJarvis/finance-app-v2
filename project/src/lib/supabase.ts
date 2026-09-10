import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://zgidvdupjiphonfhpjhn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaWR2ZHVwamlwaG9uZmhwamhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODUwNTUsImV4cCI6MjEwNDM2MTA1NX0.GeUpNuI0VBWtyFhwyjew43Ir1JJ6lqGJALQ5Du8_70I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
