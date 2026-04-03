const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'platform', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing with URL:', supabaseUrl);
console.log('Testing with Service Role Key length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('companies').select('id').limit(1);
  if (error) {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  } else {
    console.log('Connection successful! Found', data.length, 'companies.');
  }
}

test();
