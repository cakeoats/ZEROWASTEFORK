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
            <h2 className="text-2xl font-semibold text-red-500">{error}</h2>
            <p>Pastikan URL yang Anda akses sudah benar.</p>
            <button 
              onClick={() => navigate('/product-list')} 
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md"
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
      <div className="min-h-screen flex justify-center items-center">
        <p>Memuat detail produk...</p>
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
      <div className="min-h-screen flex justify-center items-center">
        <p>Memuat detail produk...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 relative">
      <NavbarComponent />

      <div className="flex items-center justify-center pt-24 px-6 pb-12 bg-[#FFF5E4]">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-10 space-y-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <img
              src={product.images?.[0] || '/default-product.jpg'}
              alt={product.name}
              className="rounded-xl shadow-md object-cover w-full h-auto"
            />

            <div className="space-y-5">
              <h1 className="text-3xl font-semibold">{product.name}</h1>
              <p className="text-gray-500">oleh {product.seller_id?.username || product.seller_id?.full_name || 'Penjual'}</p>
              <div className="text-2xl font-bold text-green-600">
                Rp {product.price.toLocaleString('id-ID')}
              </div>

              <ul className="space-y-1 text-sm text-gray-600">
                <li><strong>Kategori:</strong> {product.category}</li>
                <li><strong>Kondisi:</strong> {product.condition === 'used' ? 'Bekas' : 'Baru'}</li>
                <li><strong>Tipe:</strong> {product.tipe}</li>
                <li><strong>Deskripsi:</strong> {product.description}</li>
              </ul>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleBuy}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md text-sm"
                >
                  Beli Sekarang via WhatsApp
                </button>

                <button
                  onClick={toggleWishlist}
                  className="p-2 rounded-full bg-gray-100 hover:bg-red-100 transition"
                  title={isLoved ? "Hapus dari wishlist" : "Tambah ke wishlist"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill={isLoved ? "red" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className={`w-6 h-6 ${isLoved ? "text-red-500" : "text-gray-500"}`}
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
          </div>
        </div>
      </div>
    </div>
  );
}
