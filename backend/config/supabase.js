// backend/config/supabase.js - UPDATED FOR PROFILE PICTURES COMPATIBILITY
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials missing:');
    console.error('SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ SET' : '❌ MISSING');

    if (process.env.NODE_ENV === 'production') {
        throw new Error('Missing Supabase credentials in environment variables');
    }
}

console.log('🔧 Initializing Supabase client...');
console.log('📍 Supabase URL:', supabaseUrl?.substring(0, 30) + '...');

let supabase = null;

try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: {
                'x-application-name': 'zerowastemarket-backend'
            }
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
                getPublicUrl: () => ({ data: { publicUrl: null } }),
                listBuckets: () => Promise.reject(new Error('Supabase not configured'))
            })
        }
    };
}

// Configuration for your bucket
const BUCKET_NAME = 'product-image';

// Enhanced connection test with bucket verification
const testConnection = async () => {
    if (!supabase || !supabaseUrl || !supabaseServiceKey) {
        console.log('⚠️ Supabase not properly configured, skipping connection test');
        return false;
    }

    try {
        console.log('🔄 Testing Supabase connection...');

        // Test 1: List buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            console.error('❌ Failed to list buckets:', bucketsError.message);
            return false;
        }

        console.log('✅ Supabase connected successfully');
        console.log('📦 Available buckets:', buckets.map(b => b.name));

        // Test 2: Check if 'product-image' bucket exists
        const productImageBucket = buckets.find(bucket => bucket.name === BUCKET_NAME);

        if (!productImageBucket) {
            console.log(`⚠️ "${BUCKET_NAME}" bucket not found. Please create it manually.`);
            console.log('📝 Bucket creation instructions:');
            console.log('1. Go to Supabase Dashboard → Storage → Buckets');
            console.log(`2. Create bucket named: ${BUCKET_NAME}`);
            console.log('3. Make it public');
            console.log('4. Set file size limit: 10MB');
            console.log('5. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp');
            return false;
        } else {
            console.log(`✅ "${BUCKET_NAME}" bucket found and ready`);
        }

        // Test 3: Test upload/delete with a small test file
        try {
            const testFileName = `test-connection-${Date.now()}.txt`;
            const testContent = 'Connection test file - safe to delete';

            console.log(`🧪 Testing upload to ${BUCKET_NAME}...`);
            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(testFileName, testContent, {
                    contentType: 'text/plain'
                });

            if (uploadError) {
                console.error('❌ Test upload failed:', uploadError.message);
                console.log('💡 Check bucket permissions and RLS policies');
                return false;
            }

            console.log('✅ Test upload successful');

            // Clean up test file
            const { error: deleteError } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([testFileName]);

            if (deleteError) {
                console.log('⚠️ Test cleanup failed (not critical):', deleteError.message);
            } else {
                console.log('✅ Test cleanup successful');
            }

        } catch (testError) {
            console.error('❌ Upload/delete test failed:', testError.message);
            return false;
        }

        console.log('🎉 Supabase setup verification completed successfully');
        return true;

    } catch (err) {
        console.error('❌ Supabase connection test error:', err.message);
        return false;
    }
};

// Helper function to get bucket info
const getBucketInfo = async () => {
    try {
        const { data, error } = await supabase.storage.listBuckets();
        return { data, error };
    } catch (err) {
        return { data: null, error: err };
    }
};

// Helper function to ensure bucket exists
const ensureBucketExists = async (bucketName = BUCKET_NAME) => {
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            throw new Error(`Failed to list buckets: ${error.message}`);
        }

        const bucketExists = buckets.some(bucket => bucket.name === bucketName);

        if (!bucketExists) {
            console.log(`⚠️ Bucket "${bucketName}" not found`);
            console.log('❌ Cannot auto-create bucket with service role key');
            console.log('📝 Please create the bucket manually in Supabase Dashboard');
            return false;
        }

        console.log(`✅ Bucket "${bucketName}" exists and ready`);
        return true;
    } catch (error) {
        console.error(`❌ Error checking bucket:`, error.message);
        return false;
    }
};

// Get public URL helper
const getPublicUrl = (fileName) => {
    try {
        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return data?.publicUrl || null;
    } catch (error) {
        console.error('❌ Error getting public URL:', error);
        return null;
    }
};

// Upload file helper
const uploadFile = async (fileName, fileBuffer, options = {}) => {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, fileBuffer, {
                upsert: false,
                ...options
            });

        if (error) {
            throw error;
        }

        return {
            success: true,
            data,
            publicUrl: getPublicUrl(fileName)
        };
    } catch (error) {
        console.error('❌ Upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Delete file helper
const deleteFile = async (fileName) => {
    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([fileName]);

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Delete multiple files helper
const deleteFiles = async (fileNames) => {
    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(fileNames);

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Batch delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// ADDED: Helper function untuk extract file path dari URL Supabase
const extractFilePathFromUrl = (url) => {
    try {
        if (!url || typeof url !== 'string') return null;

        // URL format: https://project.supabase.co/storage/v1/object/public/bucket/path
        const urlParts = url.split('/');
        const bucketIndex = urlParts.findIndex(part => part === BUCKET_NAME);

        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
            return urlParts.slice(bucketIndex + 1).join('/');
        }

        return null;
    } catch (error) {
        console.error('❌ Error extracting file path:', error);
        return null;
    }
};

// Initialize and test connection (non-blocking)
const initializeSupabase = async () => {
    try {
        const isConnected = await testConnection();

        if (!isConnected) {
            console.log('📋 Setup Instructions for product-image bucket:');
            console.log('1. Go to https://supabase.com/dashboard');
            console.log('2. Select your project');
            console.log('3. Go to Storage → Buckets');
            console.log('4. Create new bucket:');
            console.log(`   - Name: ${BUCKET_NAME}`);
            console.log('   - Public: ✅ Yes');
            console.log('   - File size limit: 10485760 (10MB)');
            console.log('   - Allowed MIME types:');
            console.log('     * image/jpeg');
            console.log('     * image/png');
            console.log('     * image/gif');
            console.log('     * image/webp');
            console.log('5. Set up RLS policies if needed');
            console.log('6. Enable "Allow uploads from anonymous users" if using anon key');
        }

        return isConnected;
    } catch (error) {
        console.error('❌ Supabase initialization error:', error.message);
        return false;
    }
};

// Run initialization in development (delayed to not block startup)
if (process.env.NODE_ENV !== 'production') {
    setTimeout(initializeSupabase, 2000);
}

// COMPATIBILITY: Export dalam format yang kompatibel dengan userController
const supabaseExport = {
    // Main client methods
    storage: supabase?.storage || null,

    // Direct access to the client
    client: supabase,

    // Configuration
    BUCKET_NAME,

    // Helper functions
    getBucketInfo,
    ensureBucketExists,
    testConnection,
    getPublicUrl,
    uploadFile,
    deleteFile,
    deleteFiles,
    extractFilePathFromUrl, // ADDED untuk userController

    // COMPATIBILITY: Direct storage access (untuk spread operator di userController)
    from: (bucketName) => {
        if (!supabase) {
            throw new Error('Supabase not configured');
        }
        return supabase.storage.from(bucketName);
    },

    // Configuration info
    config: {
        url: supabaseUrl,
        bucket: BUCKET_NAME,
        initialized: !!supabase,
        serviceKeyConfigured: !!supabaseServiceKey
    }
};

// Export main client and all helpers
module.exports = supabaseExport;

// COMPATIBILITY: Allow accessing as if it's the Supabase client directly
Object.setPrototypeOf(module.exports, supabase || {});