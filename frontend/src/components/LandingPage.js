import React from "react";
import { Button } from "flowbite-react";
import { Link } from "react-router-dom";
import "../index.css";

function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-amber-50">
      {/* Konten Utama */}
      <main className="w-full h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between">
            {/* Kiri */}
            <div className="w-full md:w-1/2 mb-12 md:mb-0">
              <h2 className="text-gray-700 font-bold mb-4">
                <br></br>
                Hallo, Selamat Datang
              </h2>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Temukan Barang<br />Murah Impianmu
              </h1>
              <p className="mb-5 mt-5 text-gray-700">
                Trending : Zara, iPhone, Dress, iPad, Adidas, Crocs, Apple Watch, Furniture
              </p>
              <div className="flex space-x-5">
                <Link to="">
                  <Button color="blue" size="sm" className="px-7 py-2 font-medium">
                    Shop Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Kanan - Gambar */}
            <div className="md:w-1/2 mt-10 md:mt-0 relative z-10">
              <img
                src="/bglanding.png"
                alt="Product showcase"
                className="w-full max-w-lg mx-auto" // Diubah dari max-w-lg ke max-w-2xl
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;