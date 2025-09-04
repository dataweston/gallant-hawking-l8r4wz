import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Example function to fetch data from a Supabase table
async function fetchData() {
    const { data, error } = await supabase
        .from('your-table-name')
        .select('*');

    if (error) {
        console.error('Error fetching data:', error);
    } else {
        console.log('Data fetched:', data);
    }
}

// Call the fetchData function
fetchData();