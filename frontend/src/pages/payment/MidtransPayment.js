// frontend/src/pages/payment/MidtransPayment.js - ENHANCED with better debugging

// Fetch Midtrans configuration from backend - FIXED
useEffect(() => {
  const fetchMidtransConfig = async () => {
    try {
      console.log('🔧 Starting Midtrans configuration fetch...');
      console.log('🔗 API Base URL:', API_BASE_URL);
      console.log('🔗 Config endpoint:', getApiUrl('api/payment/config'));

      setError(null); // Clear any previous errors

      const config = await getMidtransConfig();

      if (config._fallback) {
        console.warn('⚠️ Using fallback configuration due to API issues');
        setError('Using fallback payment configuration. Some features may be limited.');
      }

      setMidtransConfig(config);
      console.log('✅ Midtrans config loaded successfully:', {
        environment: config.environment,
        scriptUrl: config.scriptUrl,
        hasClientKey: !!config.clientKey,
        isFallback: !!config._fallback
      });

    } catch (error) {
      console.error('❌ Failed to load Midtrans config:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      });

      setError(`Failed to load payment configuration: ${error.message}. Please refresh and try again.`);
    }
  };

  fetchMidtransConfig();
}, []);

// Load Midtrans script - ENHANCED with better error handling
useEffect(() => {
  if (!midtransConfig) {
    console.log('⏳ Waiting for Midtrans config...');
    return;
  }

  // Check if script is already loaded
  if (document.getElementById('midtrans-snap')) {
    console.log('✅ Midtrans script already loaded');
    setSnapScriptLoaded(true);
    return;
  }

  console.log('🔧 Loading Midtrans Snap script...');
  console.log('🔧 Script details:', {
    environment: midtransConfig.environment,
    scriptUrl: midtransConfig.scriptUrl,
    clientKeyPrefix: midtransConfig.clientKey ? midtransConfig.clientKey.substring(0, 15) + '...' : 'NOT_SET',
    isFallback: !!midtransConfig._fallback
  });

  // Load Midtrans Snap JS when component mounts
  const script = document.createElement('script');
  script.id = 'midtrans-snap';
  script.src = midtransConfig.scriptUrl;
  script.setAttribute('data-client-key', midtransConfig.clientKey);

  script.onload = () => {
    console.log('✅ Midtrans Snap script loaded successfully');
    console.log('🌍 Environment:', midtransConfig.environment);
    console.log('🪟 Window.snap available:', !!window.snap);
    setSnapScriptLoaded(true);
  };

  script.onerror = (event) => {
    console.error('❌ Failed to load Midtrans Snap script');
    console.error('Script URL:', midtransConfig.scriptUrl);
    console.error('Error event:', event);
    setError(`Failed to load payment gateway script (${midtransConfig.environment}). Please check your internet connection and try again.`);
  };

  document.body.appendChild(script);

  return () => {
    // Clean up on unmount
    const existingScript = document.getElementById('midtrans-snap');
    if (existingScript) {
      document.body.removeChild(existingScript);
    }
  };
}, [midtransConfig]);

// Enhanced payment handler with better error messages
const handlePayment = async () => {
  console.log('🚀 Starting payment process...');
  console.log('🔧 Pre-flight checks:', {
    hasToken: !!token,
    hasProduct: !!product,
    snapScriptLoaded,
    hasWindowSnap: !!window.snap,
    hasMidtransConfig: !!midtransConfig,
    configEnvironment: midtransConfig?.environment,
    isFallbackConfig: !!midtransConfig?._fallback
  });

  if (!token) {
    console.log('❌ No token, redirecting to login');
    navigate('/login', { state: { from: `/payment/${id}` } });
    return;
  }

  if (!product) {
    console.log('❌ No product data');
    setError('Product information not available');
    return;
  }

  if (!snapScriptLoaded || !window.snap) {
    console.log('❌ Snap script not loaded');
    setError('Payment gateway is still loading. Please wait a moment and try again.');
    return;
  }

  if (!midtransConfig) {
    console.log('❌ Midtrans config not loaded');
    setError('Payment configuration not loaded. Please refresh and try again.');
    return;
  }

  setPaymentLoading(true);
  setError(null);

  try {
    console.log('📦 Creating transaction with data:', {
      productId: product._id,
      quantity: quantity,
      totalAmount: totalPrice,
      environment: midtransConfig.environment,
      isFallback: midtransConfig._fallback,
      API_BASE_URL
    });

    // Enhanced request with better error handling
    const response = await axios({
      method: 'POST',
      url: getApiUrl('api/payment/create-transaction'),
      data: {
        productId: product._id,
        quantity: quantity,
        totalAmount: totalPrice,
      },
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      timeout: 30000, // 30 second timeout
      validateStatus: function (status) {
        return status < 500; // Don't reject on 4xx errors
      }
    });

    console.log('📡 Transaction response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.data?.message || response.statusText}`);
    }

    const { token: snapToken, success, message, environment } = response.data;

    if (!success) {
      throw new Error(message || 'Transaction creation failed');
    }

    if (!snapToken) {
      throw new Error('Payment token not received from server');
    }

    console.log('🎫 Snap token received, opening payment popup...');
    console.log('🌍 Backend environment:', environment);
    console.log('🔧 Frontend config environment:', midtransConfig.environment);

    // Reset loading state before opening snap
    setPaymentLoading(false);

    // Enhanced Snap payment with better callbacks
    window.snap.pay(snapToken, {
      onSuccess: function (result) {
        console.log('✅ Payment success:', result);
        console.log('🌍 Payment completed in:', midtransConfig.environment, 'mode');
        navigate('/payment/success?order_id=' + result.order_id + '&transaction_status=' + result.transaction_status);
      },
      onPending: function (result) {
        console.log('⏳ Payment pending:', result);
        console.log('🌍 Payment pending in:', midtransConfig.environment, 'mode');
        navigate('/payment/pending?order_id=' + result.order_id + '&payment_type=' + result.payment_type);
      },
      onError: function (result) {
        console.error('❌ Payment error:', result);
        console.error('🌍 Payment error in:', midtransConfig.environment, 'mode');
        setError(`Payment failed (${midtransConfig.environment}): ` + (result.status_message || 'Please try again.'));
      },
      onClose: function () {
        console.log('🚫 Payment window closed');
        console.log('🌍 Payment closed in:', midtransConfig.environment, 'mode');
        setError('Payment canceled. Please try again to complete your purchase.');
      }
    });

  } catch (err) {
    console.error('💥 Payment error details:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      code: err.code,
      name: err.name,
      environment: midtransConfig?.environment
    });

    let errorMessage = `Failed to process payment (${midtransConfig?.environment || 'Unknown'}). Please try again.`;

    if (err.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please check your connection and try again.';
    } else if (err.code === 'ERR_NETWORK') {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (err.response?.status === 500) {
      errorMessage = 'Server error occurred. Please try again later or contact support.';
    } else if (err.response?.status === 401) {
      errorMessage = 'Authentication failed. Please login again.';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }

    setError(errorMessage);
    setPaymentLoading(false);
  }
};