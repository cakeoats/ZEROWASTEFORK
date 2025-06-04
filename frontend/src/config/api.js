// frontend/src/config/api.js - FIXED getMidtransConfig function

// FIXED: Enhanced Midtrans Configuration with better error handling
let cachedMidtransConfig = null;
let configFetchPromise = null;

export const getMidtransConfig = async (maxRetries = 2) => {
    console.log('🔧 Fetching Midtrans config from backend...');

    // Return cached config if available and not expired
    if (cachedMidtransConfig) {
        const cacheAge = Date.now() - (cachedMidtransConfig._cached || 0);
        const maxCacheAge = 5 * 60 * 1000; // 5 minutes

        if (cacheAge < maxCacheAge) {
            console.log('📋 Using cached Midtrans config:', {
                environment: cachedMidtransConfig.environment,
                scriptUrl: cachedMidtransConfig.scriptUrl,
                clientKeyPrefix: cachedMidtransConfig.clientKey ? cachedMidtransConfig.clientKey.substring(0, 15) + '...' : 'NOT_SET'
            });
            return cachedMidtransConfig;
        } else {
            console.log('⏰ Cache expired, fetching fresh config...');
            cachedMidtransConfig = null;
        }
    }

    // Prevent multiple simultaneous requests
    if (configFetchPromise) {
        console.log('⏳ Config fetch already in progress, waiting...');
        return configFetchPromise;
    }

    configFetchPromise = fetchMidtransConfigWithRetry(maxRetries);

    try {
        const result = await configFetchPromise;
        return result;
    } finally {
        configFetchPromise = null;
    }
};

const fetchMidtransConfigWithRetry = async (maxRetries) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Fetching Midtrans config (attempt ${attempt}/${maxRetries})...`);

            // FIXED: Enhanced timeout and error handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

            const response = await fetch(getApiUrl('api/payment/config'), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ HTTP Error Response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📦 Received data:', data);

            if (!data.success) {
                throw new Error(data.message || 'Config fetch failed');
            }

            const backendConfig = data.config;
            console.log('🔧 Backend config:', backendConfig);

            // FIXED: Enhanced config validation
            if (!backendConfig) {
                throw new Error('No config data received from backend');
            }

            if (!backendConfig.clientKey) {
                throw new Error('Client key not available from backend');
            }

            // Build frontend config based on backend response
            const config = {
                clientKey: backendConfig.clientKey,
                isProduction: backendConfig.isProduction || false,
                environment: backendConfig.environment || (backendConfig.isProduction ? 'PRODUCTION' : 'SANDBOX'),
                scriptUrl: backendConfig.isProduction
                    ? 'https://app.midtrans.com/snap/snap.js'
                    : 'https://app.sandbox.midtrans.com/snap/snap.js',
                _cached: Date.now()
            };

            console.log('✅ Midtrans config processed successfully:', {
                environment: config.environment,
                scriptUrl: config.scriptUrl,
                clientKeyPrefix: config.clientKey.substring(0, 15) + '...',
                isProduction: config.isProduction,
                attempt: attempt
            });

            // Validate key format
            const expectedPrefix = config.isProduction ? 'Mid-client-' : 'SB-Mid-client-';
            if (!config.clientKey.startsWith(expectedPrefix)) {
                console.warn(`⚠️ Unexpected client key format. Expected: ${expectedPrefix}*, Got: ${config.clientKey.substring(0, 15)}...`);
            }

            // Cache the config
            cachedMidtransConfig = config;
            return config;

        } catch (error) {
            lastError = error;
            console.error(`❌ Attempt ${attempt} failed:`, {
                message: error.message,
                name: error.name,
                code: error.code,
                stack: error.stack
            });

            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000); // Max 3 seconds
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All retries failed, use fallback
    console.error('❌ All attempts failed, using fallback config');
    console.error('Last error details:', {
        message: lastError?.message,
        name: lastError?.name,
        code: lastError?.code
    });

    // FIXED: More reliable fallback config
    const fallbackConfig = {
        scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js',
        clientKey: 'SB-Mid-client-FHBq0wtUSyCEStlH', // Your sandbox key from .env
        isProduction: false,
        environment: 'SANDBOX (FALLBACK)',
        _cached: Date.now(),
        _fallback: true // Flag to indicate this is fallback
    };

    console.log('⚠️ Using fallback Midtrans config:', {
        environment: fallbackConfig.environment,
        scriptUrl: fallbackConfig.scriptUrl,
        clientKeyPrefix: fallbackConfig.clientKey.substring(0, 15) + '...'
    });

    // Cache fallback config for short time
    cachedMidtransConfig = fallbackConfig;
    return fallbackConfig;
};