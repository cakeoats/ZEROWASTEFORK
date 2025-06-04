// backend/config/supabase.js - FIXED VERSION
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials not found in environment variables');
    console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
    // Don't throw error in production to prevent crash
    if (process.env.NODE_ENV !== 'production') {
        throw new Error('Missing Supabase credentials');
    }
}

console.log('🔧 Initializing Supabase client...');
console.log('📍 Supabase URL:', supabaseUrl);

let supabase = null;

try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log('✅ Supabase client created successfully');
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error.message);
    // Create dummy client to prevent crashes
    supabase = {
        storage: {
            from: () => ({
                upload: () => Promise.reject(new Error('Supabase not configured')),
                remove: () => Promise.reject(new Error('Supabase not configured')),
                getPublicUrl: () => ({ data: { publicUrl: null } })
            })
        }
    };
}

// Test connection function (non-blocking)
const testConnection = async () => {
    if (!supabase || !supabaseUrl || !supabaseServiceKey) {
        console.log('⚠️ Supabase not properly configured, skipping connection test');
        return;
    }

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

// Test connection on startup (only in development and non-blocking)
if (process.env.NODE_ENV !== 'production') {
    setTimeout(testConnection, 1000); // Delay to prevent blocking startup
}

module.exports = supabase;