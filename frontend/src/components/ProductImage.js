// frontend/src/components/ProductImage.js
// Reusable image component dengan error handling yang robust

import React, { useState, useEffect } from 'react';
import { getProductImageUrl, validateImageUrl } from '../config/api';

const ProductImage = ({
    product,
    className = "",
    alt = "",
    showPlaceholder = true,
    fallbackImage = "https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=center&auto=format&q=80",
    onImageLoad = null,
    onImageError = null
}) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    const maxRetries = 2;

    useEffect(() => {
        const loadImage = async () => {
            if (!product) {
                setImageSrc(fallbackImage);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setImageError(false);

            const imageUrl = getProductImageUrl(product);
            console.log('🔄 Loading image:', imageUrl);

            try {
                // Validate image before setting
                const isValid = await validateImageUrl(imageUrl, 8000); // 8 second timeout

                if (isValid) {
                    setImageSrc(imageUrl);
                    console.log('✅ Image loaded successfully');
                    onImageLoad && onImageLoad(imageUrl);
                } else {
                    throw new Error('Image validation failed');
                }
            } catch (error) {
                console.log('❌ Image load error:', error.message);
                handleImageError();
            }

            setIsLoading(false);
        };

        loadImage();
    }, [product, retryCount]);

    const handleImageError = () => {
        console.log('❌ Image error occurred, retry count:', retryCount);

        if (retryCount < maxRetries) {
            // Retry loading
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
            }, 1000 * (retryCount + 1)); // Progressive delay
        } else {
            // Use fallback
            setImageSrc(fallbackImage);
            setImageError(true);
            onImageError && onImageError();
        }
    };

    const handleDirectImageError = () => {
        console.log('❌ Direct image error, switching to fallback');
        if (!imageError) {
            setImageSrc(fallbackImage);
            setImageError(true);
            onImageError && onImageError();
        }
    };

    // Loading placeholder
    if (isLoading && showPlaceholder) {
        return (
            <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={alt || product?.name || 'Product image'}
            className={className}
            onError={handleDirectImageError}
            loading="lazy"
            style={{
                objectFit: 'cover',
                backgroundColor: '#f3f4f6' // Fallback background
            }}
        />
    );
};

// Higher-order component untuk lazy loading
export const LazyProductImage = ({
    product,
    className = "",
    alt = "",
    threshold = 0.1
}) => {
    const [inView, setInView] = useState(false);
    const [ref, setRef] = useState(null);

    useEffect(() => {
        if (!ref) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );

        observer.observe(ref);

        return () => observer.disconnect();
    }, [ref, threshold]);

    return (
        <div ref={setRef} className={className}>
            {inView ? (
                <ProductImage
                    product={product}
                    className="w-full h-full"
                    alt={alt}
                />
            ) : (
                <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default ProductImage;