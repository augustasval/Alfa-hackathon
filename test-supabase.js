// Quick test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://stxxtzpttrvpyqhccgme.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eHh0enB0dHJ2cHlxaGNjZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzUzNTcsImV4cCI6MjA3OTU1MTM1N30.SU9Roa_xMtt9F6cXMo1uoBkverafbqvZrgMK1meYDtE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('learning_plans')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Connection error:', error);
    } else {
      console.log('Connection successful! Plan count:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
