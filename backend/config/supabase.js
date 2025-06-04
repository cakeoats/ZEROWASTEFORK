// backend/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials not found in environment variables');
    throw new Error('Missing Supabase credentials');
}

console.log('🔧 Initializing Supabase client...');
console.log('📍 Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Test connection
const testConnection = async () => {
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('❌ Supabase connection test failed:', error.message);
        } else {
            console.log('✅ Supabase connected successfully');
            console.log('📦 Available buckets:', data.map(b => b.name));
        }
    } catch (err) {
        console.error('❌ Supabase connection error:', err.message);
    }
};

// Test connection on startup (only in development)
if (process.env.NODE_ENV !== 'production') {
    testConnection();
}

module.exports = supabase;