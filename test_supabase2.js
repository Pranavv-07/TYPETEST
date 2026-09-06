import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://felqveyqlcmhbdzuaxaf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbHF2ZXlxbGNtaGJkenVheGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTYxNTYsImV4cCI6MjEwNDA3MjE1Nn0.XGKLX5q-foaQJbnIKHbPYdUFmiEQuRGATdNIDHCjYsI');

async function test() {
  const { data, error } = await supabase.from('students').insert([{
    roll_number: '24P31A42S4',
    name: 'TEST STUDENT',
    class_id: '8df943bd-88c7-4b52-bf21-d8039cf448e4',
    batch_id: 'b0000000-0000-0000-0000-000000000001'
  }]);
  console.log('Error:', error);
}

test();
