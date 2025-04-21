import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavbarComponent from '../../components/NavbarComponent';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoved, setIsLoved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showFullscreenCarousel, setShowFullscreenCarousel] = useState(false);

  console.log("Current URL:", window.location.pathname);
  console.log("ID from useParams:", id);

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
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
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
  }, [id]);

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

  const toggleWishlist = () => {
    setIsLoved(!isLoved);
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

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FFF5E4]">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-700 font-medium">Memuat detail produk...</p>
      </div>
    );
  }

  // Pastikan product.images adalah array
  const productImages = Array.isArray(product.images) ? product.images :
    (product.images ? [product.images] : ['/default-product.jpg']);

  return (
    <div className="min-h-screen bg-white text-gray-800 relative">
      <NavbarComponent />

      <div className="pt-24 px-6 pb-12 bg-[#FFF5E4]">
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
                    {/* Main Carousel */}
                    <div className="relative h-full overflow-hidden">
                      <img
                        src={productImages[activeImage]}
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-105 cursor-pointer"
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
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 transition-all duration-300 text-gray-800"
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 transition-all duration-300 text-gray-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Carousel Indicators */}
                      {productImages.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2">
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

                  {/* Discount Badge (if needed) */}
                  {product.discount && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                      {product.discount}% OFF
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {productImages.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {productImages.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setActiveImage(index)}
                        className={`cursor-pointer rounded-lg overflow-hidden w-20 h-20 flex-shrink-0 border-2 transition-all ${activeImage === index ? 'border-amber-500 scale-105' : 'border-gray-200'}`}
                      >
                        <img src={img} alt={`${product.name} - view ${index + 1}`} className="w-full h-full object-cover" />
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

                  <div className="flex items-center mt-2">
                    <div className="text-amber-500 font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 mr-1">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      <span>{product.rating || '4.5'}</span>
                    </div>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-gray-500">Terjual {product.sold || '50'}+</span>
                  </div>
                </div>

                <div className="py-4 border-t border-b border-gray-100">
                  <div className="text-3xl font-bold text-amber-600">
                    Rp {product.price.toLocaleString('id-ID')}
                  </div>
                  {product.old_price && (
                    <div className="mt-1 text-gray-500 line-through text-sm">
                      Rp {product.old_price.toLocaleString('id-ID')}
                    </div>
                  )}
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
                        <span className="font-medium capitalize">{product.tipe}</span>
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

                <div className="pt-6 border-t border-gray-100">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      onClick={handleBuy}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-base font-medium w-full transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Beli Sekarang via WhatsApp
                    </button>

                    <button
                      className="border border-amber-500 text-amber-500 hover:bg-amber-50 px-6 py-3 rounded-lg text-base font-medium w-full transition-all duration-300 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tanya Produk
                    </button>
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
              <img
                src={productImages[activeImage]}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
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
                  {productImages.map((img, index) => (
                    <div
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImage(index);
                      }}
                      className={`cursor-pointer rounded-lg overflow-hidden w-16 h-16 flex-shrink-0 border-2 transition-all ${activeImage === index ? 'border-amber-500' : 'border-transparent'}`}
                    >
                      <img src={img} alt={`${product.name} - view ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}