import React from 'react';
import { Link } from 'react-router-dom';
import NavbarComponent from '../components/NavbarComponent';



export default function ProductDetail() {
  // Data kategori produk
  const kategoriProduk = [
    {
      nama: "Men Fashion",
      gambar: "https://forgecraftmensjewelry.com/cdn/shop/articles/minimalist-mens-fashion-beige-shirt-and-trousers.jpg?v=1737391858&width=1100",
      jumlah: 120,
      link: "/kategori/men-fashion",
      warna: "bg-pink-100",
    },
    {
      nama: "Women Fashion",
      gambar: "https://img.freepik.com/free-photo/black-woman-trendy-grey-leather-jacket-posing-beige-background-studio-winter-autumn-fashion-look_273443-141.jpg",
      jumlah: 85,
      link: "/kategori/women-fashion",
      warna: "bg-blue-100",
    },
    {
      nama: "Automotive",
      gambar: "https://img.freepik.com/premium-photo/brown-car-isolated-white-background_140916-41243.jpg",
      jumlah: 64,
      link: "/kategori/automotive",
      warna: "bg-amber-100",
    },
    {
      nama: "Gadget",
      gambar: "https://img.freepik.com/free-photo/modern-stationary-collection-arrangement_23-2149309643.jpg",
      jumlah: 42,
      link: "/kategori/gadget",
      warna: "bg-purple-100",
    },
    {
      nama: "Dekoration",
      gambar: "https://kumbanews.com/wp-content/uploads/2018/11/home-insurance-e1479125215618.jpg",
      jumlah: 42,
      link: "/kategori/decoration",
      warna: "bg-purple-100",
    },
    {
      nama: "Sport",
      gambar: "https://media.istockphoto.com/id/1355687112/photo/various-sport-equipment-gear.jpg?s=612x612&w=0&k=20&c=JOizKZg68gs_7lxjM3YLrngeS-7dGhBXL8b-wDBrYUE=",
      jumlah: 42,
      link: "/kategori/sport",
      warna: "bg-purple-100",
    },
    {
      nama: "Health And Beauty",
      gambar: "https://rhiannonbosse.com/wp-content/uploads/2020/03/RhisBeautyFaves3.jpg",
      jumlah: 42,
      link: "/kategori/health-beauty",
      warna: "bg-purple-100",
    },
    {
      nama: "Kids",
      gambar: "https://raisingchildren.net.au/__data/assets/image/0013/100660/play-shop-activity-guide.jpg",
      jumlah: 42,
      link: "/kategori/kids",
      warna: "bg-purple-100",
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 relative">
      <NavbarComponent />
      {/* Container Tengah */}
      <div className="flex items-center justify-center pt-24 px-6 pb-12 bg-[#FFF5E4]">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-10 space-y-10">


          {/* Konten Produk */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Gambar Produk */}
            <img
              src="/sepeda.jpg"
              alt="Sepeda Gunung MXV23"
              className="rounded-xl shadow-md object-cover w-full h-auto"
            />

            {/* Informasi Produk */}
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

              <div className="flex space-x-3 pt-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm">Beli Sekarang</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Kategori - Gambar Full Card */}
      <section className="py-16 bg-white px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Temukan Kategori Favoritmu</h2>
            <p className="text-gray-600 mt-3">Jelajahi koleksi terbaik kami</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {kategoriProduk.map((kategori, index) => (
              <Link
                to={kategori.link}
                key={index}
                className="mt-6 group relative block h-64 overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                <img
                  src={kategori.gambar}
                  alt={kategori.nama}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-600 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-4">
                  <h3 className="text-xl font-bold text-white">{kategori.nama}</h3>
                  <p className="text-white/90">{kategori.jumlah}+ produk</p>
                </div>
                <div className={`absolute top-4 right-4 ${kategori.warna} px-3 py-1 rounded-full text-sm font-medium`}>
                  Hot
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
