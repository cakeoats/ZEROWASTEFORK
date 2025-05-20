import React from "react";
import { Button } from "flowbite-react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import NavbarComponent from "../components/NavbarComponent";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslate } from "../utils/languageUtils";

function LandingPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const translate = useTranslate(language);

  // Data kategori produk
  const kategoriProduk = [
    {
      nama: "Men Fashion",
      gambar: "https://forgecraftmensjewelry.com/cdn/shop/articles/minimalist-mens-fashion-beige-shirt-and-trousers.jpg?v=1737391858&width=1100",
      jumlah: 120,
      link: "/product-list?category=Men%20Fashion",
      warna: "bg-pink-100",
    },
    {
      nama: "Women Fashion",
      gambar: "https://img.freepik.com/free-photo/black-woman-trendy-grey-leather-jacket-posing-beige-background-studio-winter-autumn-fashion-look_273443-141.jpg",
      jumlah: 85,
      link: "/product-list?category=Women%20Fashion",
      warna: "bg-blue-100",
    },
    {
      nama: "Automotive",
      gambar: "https://img.freepik.com/premium-photo/brown-car-isolated-white-background_140916-41243.jpg",
      jumlah: 64,
      link: "/product-list?category=Automotive",
      warna: "bg-amber-100",
    },
    {
      nama: "Gadget",
      gambar: "https://img.freepik.com/free-photo/modern-stationary-collection-arrangement_23-2149309643.jpg",
      jumlah: 42,
      link: "/product-list?category=Gadget",
      warna: "bg-purple-100",
    },
    {
      nama: "Dekoration",
      gambar: "https://kumbanews.com/wp-content/uploads/2018/11/home-insurance-e1479125215618.jpg",
      jumlah: 42,
      link: "/product-list?category=Dekoration",
      warna: "bg-purple-100",
    },
    {
      nama: "Sport",
      gambar: "https://media.istockphoto.com/id/1355687112/photo/various-sport-equipment-gear.jpg?s=612x612&w=0&k=20&c=JOizKZg68gs_7lxjM3YLrngeS-7dGhBXL8b-wDBrYUE=",
      jumlah: 42,
      link: "/product-list?category=Sport",
      warna: "bg-purple-100",
    },
    {
      nama: "Health And Beauty",
      gambar: "https://rhiannonbosse.com/wp-content/uploads/2020/03/RhisBeautyFaves3.jpg",
      jumlah: 42,
      link: "/product-list?category=Health%20And%20Beauty",
      warna: "bg-purple-100",
    },
    {
      nama: "Kids",
      gambar: "https://raisingchildren.net.au/__data/assets/image/0013/100660/play-shop-activity-guide.jpg",
      jumlah: 42,
      link: "/product-list?category=Kids",
      warna: "bg-purple-100",
    }
  ];

  return (
    <div className="min-h-screen w-full bg-amber-50">
      <NavbarComponent />
      {/* Bagian Hero */}
      <main className="w-full h-screen flex items-center justify-center px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Konten Kiri */}
            <div className="w-full md:w-1/2 mb-12 md:mb-0">
              <h2 className="text-gray-700 font-bold mb-4">
                {translate('home.hero.welcome')}
              </h2>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                {translate('home.hero.title')}
              </h1>
              <p className="mb-5 mt-5 text-gray-700">
                {translate('home.hero.trends')}
              </p>
              <div className="flex space-x-5">
                <Link to="/product-list">
                  <Button color="blue" className="px-7 py-2 font-semibold">
                    {translate('home.hero.shopNow')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Gambar Kanan */}
            <div className="md:w-100 mt-10 md:mt-0">
              <img
                src="https://images.squarespace-cdn.com/content/v1/5c2cd3c49f8770b74f22e01a/1676882810879-6CLLFPK4YXQR5JG36W0E/Recycle+general.png"
                alt="Produk unggulan"
                className="w-full max-w-xl mx-auto rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Section Kategori - Gambar Full Card */}
      <section className="py-16 bg-white px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">{translate('home.categories.title')}</h2>
            <p className="text-gray-600 mt-3">{translate('home.categories.subtitle')}</p>
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
      <Footer />
    </div>
  );
}

export default LandingPage;