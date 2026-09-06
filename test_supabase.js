import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://felqveyqlcmhbdzuaxaf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbHF2ZXlxbGNtaGJkenVheGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTYxNTYsImV4cCI6MjEwNDA3MjE1Nn0.XGKLX5q-foaQJbnIKHbPYdUFmiEQuRGATdNIDHCjYsI');

async function test() {
  const { data, error } = await supabase.from('classes').select('*');
  console.log('Classes:', data);
  console.log('Error:', error);
}

test();
