import React, { useState } from "react";
import NavbarComponent from "../../components/NavbarComponent";

const UploadProduct = () => {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    dealType: "",
    images: [],
  });

  const [formattedPrice, setFormattedPrice] = useState(""); // Untuk tampilan harga
  const [previews, setPreviews] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "images") {
      const selectedFiles = Array.from(files).slice(0, 10); // Maksimal 10 gambar
      setProduct({ ...product, images: selectedFiles });

      const imagePreviews = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviews(imagePreviews);
    } else if (name === "price") {
      const rawValue = value.replace(/[^\d]/g, ""); // Hanya angka
      const number = parseInt(rawValue || "0");
      const formatted = new Intl.NumberFormat("id-ID").format(number);
      setFormattedPrice(`Rp ${formatted}`);
      setProduct({ ...product, price: number });
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Data produk:", product);

    // Reset form
    setProduct({
      name: "",
      description: "",
      price: "",
      category: "",
      condition: "",
      dealType: "",
      images: [],
    });
    setFormattedPrice("");
    setPreviews([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="bg-[#fef3e2] min-h-screen">
      <NavbarComponent />

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Upload Produk
          </h2>

          {showSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm text-center">
              Produk berhasil diupload!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nama Produk */}
            <input
              type="text"
              name="name"
              value={product.name}
              onChange={handleChange}
              required
              placeholder="Nama Produk"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
            />

            {/* Deskripsi */}
            <textarea
              name="description"
              rows="4"
              value={product.description}
              onChange={handleChange}
              required
              placeholder="Deskripsi Produk"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none resize-none"
            />

            {/* Harga */}
            <input
              type="text"
              name="price"
              value={formattedPrice}
              onChange={handleChange}
              placeholder="Harga (Rp)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
            />

            {/* Jenis Transaksi */}
            <select
              name="dealType"
              value={product.dealType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 bg-white"
            >
              <option value="" disabled>
                Pilih Jenis Transaksi
              </option>
              <option value="harga">Harga</option>
              <option value="gratis">Gratis</option>
              <option value="barter">Barter</option>
            </select>

            {/* Kondisi Produk */}
            <select
              name="condition"
              value={product.condition}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 bg-white"
            >
              <option value="" disabled>
                Pilih Kondisi Produk
              </option>
              <option value="baru">Baru</option>
              <option value="bekas">Bekas</option>
            </select>

            {/* Kategori */}
            <select
              name="category"
              value={product.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 bg-white"
            >
              <option value="" disabled>
                Pilih Kategori
              </option>
              <option value="elektronik">Elektronik</option>
              <option value="fashion">Fashion</option>
              <option value="buku">Buku</option>
              <option value="rumah-tangga">Rumah Tangga</option>
              <option value="mainan-anak">Mainan Anak</option>
              <option value="kecantikan">Kecantikan</option>
              <option value="alat-dapur">Alat Dapur</option>
              <option value="olahraga">Olahraga</option>
              <option value="lainnya">Lainnya</option>
            </select>

            {/* Upload Gambar */}
            <input
              type="file"
              name="images"
              accept="image/*"
              onChange={handleChange}
              multiple
              required
              className="w-full"
            />

            {/* Preview Gambar */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {previews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-32 object-cover rounded border border-gray-300"
                  />
                ))}
              </div>
            )}

            {/* Tombol Submit */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
            >
              Upload Produk
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadProduct;
