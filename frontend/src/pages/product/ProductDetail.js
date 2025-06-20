import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import NavbarComponent from '../../components/NavbarComponent';
import ProductImage from '../../components/ProductImage';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import Footer from '../../components/Footer';
import { Alert } from 'flowbite-react';
import { getApiUrl, getProductImageUrl, getAuthHeaders } from '../../config/api';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { language } = useLanguage();
  const translate = useTranslate(language);
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoved, setIsLoved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showFullscreenCarousel, setShowFullscreenCarousel] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Debug logging for development only
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Current URL:", window.location.pathname);
      console.log("ID from useParams:", id);
      console.log("API Config:", {
        apiUrl: process.env.REACT_APP_API_URL,
        environment: process.env.NODE_ENV
      });
    }
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        console.error('ID produk tidak ditemukan');
        setError('ID produk tidak ditemukan');
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching product with ID: ${id}`);
        const res = await axios.get(getApiUrl(`api/products/${id}`));
        console.log("Product data:", res.data);
        setProduct(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Gagal mengambil data produk:', err);
        setError('Produk tidak ditemukan atau terjadi kesalahan');
        setLoading(false);
      }
    };

    fetchProduct();

    // Check wishlist status
    const checkWishlistStatus = async () => {
      if (!token || !id) return;

      try {
        const response = await axios.get(getApiUrl(`api/wishlist/check/${id}`), {
          headers: getAuthHeaders()
        });
        setIsLoved(response.data.inWishlist);
      } catch (err) {
        console.error('Error checking wishlist status:', err);
      }
    };

    checkWishlistStatus();
  }, [id, token]);

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-800 relative">
        <NavbarComponent />
        <div className="flex items-center justify-center pt-24 px-6 pb-12 bg-[#FFF5E4]">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-10 space-y-6 text-center">
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-16 h-16 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-red-500">{error}</h2>
            <p>Pastikan URL yang Anda akses sudah benar.</p>
            <button
              onClick={() => navigate('/product-list')}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-md transition-all duration-300 transform hover:scale-105"
            >
              Kembali ke Daftar Produk
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FFF5E4]">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-700 font-medium">Memuat detail produk...</p>
      </div>
    );
  }

  const toggleWishlist = async () => {
    if (!token) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    try {
      if (isLoved) {
        await axios.delete(getApiUrl(`api/wishlist/${id}`), {
          headers: getAuthHeaders()
        });
      } else {
        await axios.post(getApiUrl('api/wishlist'), {
          productId: id
        }, {
          headers: getAuthHeaders()
        });
      }
      setIsLoved(!isLoved);
    } catch (err) {
      console.error('Error updating wishlist:', err);
    }
  };

  const handleBuy = () => {
    if (!product?.seller_id?.phone) {
      alert('Penjual belum menambahkan nomor telepon.');
      return;
    }

    const phone = product.seller_id.phone.replace(/^0/, '62');
    const message = `Halo, saya tertarik dengan produk ${product.name} yang Anda jual di ZeroWasteMarket. Apakah masih tersedia?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePayment = () => {
    if (!token) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    navigate(`/payment/${id}`);
  };

  // REMOVED: quantity parameter - now fixed to 1
  const handleAddToCart = () => {
    addToCart(product, 1); // Fixed quantity of 1
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
    }, 3000);
  };

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FFF5E4]">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-700 font-medium">Memuat detail produk...</p>
      </div>
    );
  }

  // Process product images using the improved logic
  const productImages = (() => {
    // If product has multiple images, process them all
    if (product.images && Array.isArray(product.images) && product.images.length > 1) {
      return product.images.map(img => {
        if (img.startsWith('http')) {
          console.log('🌐 Using full URL for image:', img);
          return img;
        }

        const cleanPath = img.startsWith('/') ? img.slice(1) : img;
        const fullUrl = `${getApiUrl('')}${cleanPath}`;
        console.log('🔗 Constructed image URL:', fullUrl);
        return fullUrl;
      });
    }

    // Return array with single image from getProductImageUrl
    const primaryImageUrl = getProductImageUrl(product);
    return [primaryImageUrl];
  })();

  console.log('🖼️ Processed product images:', productImages);

  // Create product objects for each image to work with ProductImage component
  const imageProducts = productImages.map((imageUrl, index) => ({
    ...product,
    imageUrl: imageUrl,
    images: [imageUrl] // Ensure ProductImage gets the specific image
  }));

  return (
    <div className="min-h-screen bg-white text-gray-800 relative">
      <NavbarComponent />

      <div className="pt-24 px-6 pb-12 bg-[#FFF5E4]">
        {/* Cart notification */}
        {addedToCart && (
          <div className="fixed top-20 right-4 z-50">
            <Alert color="success" className="animate-fadeIn shadow-lg">
              {language === 'id'
                ? 'Produk ditambahkan ke keranjang!'
                : 'Product added to cart!'}
              <Link to="/cart" className="ml-2 underline font-medium">
                {language === 'id' ? 'Lihat Keranjang' : 'View Cart'}
              </Link>
            </Alert>
          </div>
        )}

        <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-10">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <span className="hover:text-amber-500 cursor-pointer" onClick={() => navigate('/')}>Beranda</span>
              <span className="mx-2">/</span>
              <span className="hover:text-amber-500 cursor-pointer" onClick={() => navigate('/product-list')}>Produk</span>
              <span className="mx-2">/</span>
              <span className="text-amber-500">{product.name}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-start">
              {/* Image Carousel */}
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-xl shadow-md bg-gray-100 aspect-square">
                  <div className="relative h-full">
                    <div className="relative h-full overflow-hidden">
                      <ProductImage
                        product={imageProducts[activeImage]}
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-105 cursor-pointer"
                        alt={`${product.name} - view ${activeImage + 1}`}
                        showPlaceholder={true}
                        onImageLoad={(url) => console.log('✅ Main image loaded:', url)}
                        onImageError={() => console.log('❌ Main image error for:', product.name)}
                      />

                      {/* Click overlay for fullscreen */}
                      <div
                        className="absolute inset-0 cursor-pointer z-10"
                        onClick={() => setShowFullscreenCarousel(true)}
                      />

                      {/* Navigation Arrows */}
                      {productImages.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImage((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 transition-all duration-300 text-gray-800 z-20"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImage((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 transition-all duration-300 text-gray-800 z-20"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Carousel Indicators */}
                      {productImages.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 z-20">
                          {productImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImage(index);
                              }}
                              className={`w-2 h-2 rounded-full transition-all ${activeImage === index ? 'bg-amber-500 w-4' : 'bg-white bg-opacity-50'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {product.discount && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-30">
                      {product.discount}% OFF
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {productImages.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {imageProducts.map((imgProduct, index) => (
                      <div
                        key={index}
                        onClick={() => setActiveImage(index)}
                        className={`cursor-pointer rounded-lg overflow-hidden w-20 h-20 flex-shrink-0 border-2 transition-all ${activeImage === index ? 'border-amber-500 scale-105' : 'border-gray-200'}`}
                      >
                        <ProductImage
                          product={imgProduct}
                          className="w-full h-full object-cover"
                          alt={`${product.name} - thumbnail ${index + 1}`}
                          showPlaceholder={true}
                          onImageLoad={(url) => console.log('✅ Thumbnail loaded:', url)}
                          onImageError={() => console.log('❌ Thumbnail error for index:', index)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">{product.name}</h1>
                    <button
                      onClick={toggleWishlist}
                      className="p-2 rounded-full bg-gray-100 hover:bg-red-100 transition-all duration-300"
                      title={isLoved ? "Hapus dari wishlist" : "Tambah ke wishlist"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill={isLoved ? "red" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className={`w-7 h-7 ${isLoved ? "text-red-500" : "text-gray-500"} transition-colors duration-300`}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="py-4 border-t border-b border-gray-100">
                  <div className="text-3xl font-bold text-amber-600">
                    {product.tipe === 'Donation' ? (
                      <span className="text-purple-600">GRATIS</span>
                    ) : product.tipe === 'Swap' ? (
                      <span className="text-blue-600">TUKAR</span>
                    ) : (
                      `Rp ${product.price.toLocaleString('id-ID')}`
                    )}
                  </div>
                  {product.old_price && (
                    <div className="mt-1 text-gray-500 line-through text-sm">
                      Rp {product.old_price.toLocaleString('id-ID')}
                    </div>
                  )}
                  {/* Product availability indicator */}
                  <div className="mt-2 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      1 unit tersedia
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Informasi Produk</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Penjual</div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="font-medium">{product.seller_id?.username || product.seller_id?.full_name || 'Penjual'}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Kondisi</div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="font-medium capitalize">{product.condition === 'used' ? 'Bekas' : 'Baru'}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Kategori</div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                          </svg>
                        </div>
                        <span className="font-medium capitalize">{product.category}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Tipe</div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                            <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                          </svg>
                        </div>
                        <span className="font-medium capitalize">
                          {product.tipe === 'Sell' ? 'Jual' :
                            product.tipe === 'Donation' ? 'Donasi' :
                              product.tipe === 'Swap' ? 'Tukar' : product.tipe}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Deskripsi</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{product.description}</p>
                  </div>
                </div>

                {/* REMOVED: Quantity selector - now shows fixed quantity info */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        {language === 'id'
                          ? 'Produk ini dijual dalam jumlah 1 unit. Setelah terjual, produk akan dihapus dari sistem.'
                          : 'This product is sold in quantity of 1 unit. After sold, the product will be removed from the system.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Add to Cart Button - only show for Sell type */}
                    {product.tipe === 'Sell' && (
                      <button
                        onClick={handleAddToCart}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-base font-medium w-full transition-all duration-300 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {language === 'id' ? 'Tambah ke Keranjang' : 'Add to Cart'}
                      </button>
                    )}

                    <button
                      onClick={handleBuy}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-base font-medium w-full transition-all duration-300 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {product.tipe === 'Donation' ?
                        (language === 'id' ? 'Ambil via WhatsApp' : 'Claim via WhatsApp') :
                        product.tipe === 'Swap' ?
                          (language === 'id' ? 'Tukar via WhatsApp' : 'Swap via WhatsApp') :
                          (language === 'id' ? 'Beli via WhatsApp' : 'Buy via WhatsApp')
                      }
                    </button>

                    {/* Midtrans Payment - only show for Sell type */}
                    {product.tipe === 'Sell' && (
                      <button
                        onClick={handlePayment}
                        className="border border-amber-500 bg-white text-amber-500 hover:bg-amber-50 px-4 py-2 rounded-lg text-base font-medium w-full transition-all duration-300 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        {language === 'id' ? 'Beli dengan Midtrans' : 'Buy with Midtrans'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Carousel Modal */}
      {showFullscreenCarousel && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center" onClick={() => setShowFullscreenCarousel(false)}>
          <div className="relative w-full max-w-4xl h-full max-h-screen p-4">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullscreenCarousel(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Fullscreen Image */}
            <div className="h-full flex items-center justify-center">
              <ProductImage
                product={imageProducts[activeImage]}
                className="max-h-full max-w-full object-contain"
                alt={`${product.name} - fullscreen view ${activeImage + 1}`}
                showPlaceholder={true}
                onImageLoad={(url) => console.log('✅ Fullscreen image loaded:', url)}
                onImageError={() => console.log('❌ Fullscreen image error for:', product.name)}
              />
            </div>

            {/* Navigation Arrows */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3 transition-all duration-300 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3 transition-all duration-300 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            {productImages.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 px-4">
                <div className="bg-black bg-opacity-50 rounded-lg p-2 flex space-x-2 overflow-x-auto">
                  {imageProducts.map((imgProduct, index) => (
                    <div
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImage(index);
                      }}
                      className={`cursor-pointer rounded-lg overflow-hidden w-16 h-16 flex-shrink-0 border-2 transition-all ${activeImage === index ? 'border-amber-500' : 'border-transparent'}`}
                    >
                      <ProductImage
                        product={imgProduct}
                        className="w-full h-full object-cover"
                        alt={`${product.name} - fullscreen thumbnail ${index + 1}`}
                        showPlaceholder={true}
                        onImageLoad={(url) => console.log('✅ Fullscreen thumbnail loaded:', url)}
                        onImageError={() => console.log('❌ Fullscreen thumbnail error for index:', index)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}