import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NavbarComponent from '../components/NavbarComponent';

export default function ProductDetail() {
  const [isLoved, setIsLoved] = useState(false);

  const toggleWishlist = () => {
    setIsLoved(!isLoved);
  };

  const kategoriProduk = [/* ...kategoriProduk tetap sama seperti sebelumnya */];

  return (
    <div className="min-h-screen bg-white text-gray-800 relative">
      <NavbarComponent />

      {/* Detail Produk */}
      <div className="flex items-center justify-center pt-24 px-6 pb-12 bg-[#FFF5E4]">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-10 space-y-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <img
              src="/sepeda.jpg"
              alt="Sepeda Gunung MXV23"
              className="rounded-xl shadow-md object-cover w-full h-auto"
            />

            <div className="space-y-5">
              <h1 className="text-3xl font-semibold">Sepeda Gunung MXV23</h1>
              <p className="text-gray-500">oleh AsepSaepul021</p>
              <div className="text-2xl font-bold text-green-600">Rp 850.000</div>

              <ul className="space-y-1 text-sm text-gray-600">
                <li><strong>Merk:</strong> MXV23</li>
                <li><strong>Kondisi:</strong> Bekas, baik & terawat</li>
                <li><strong>Cocok untuk:</strong> Gunung, olahraga, harian</li>
                <li><strong>Tampilan:</strong> Stylish dan modern</li>
              </ul>

              <div className="flex items-center space-x-3 pt-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm">
                  Beli Sekarang
                </button>

                {/* Wishlist Button */}
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

      {/* Section kategori tetap seperti sebelumnya */}
      {/* ... */}
    </div>
  );
}
