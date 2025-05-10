import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavbarComponent from '../../components/NavbarComponent';

// Konstanta untuk API
const API_URL = 'http://localhost:5000';

export default function ProductUpload() {
  // Hooks
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    condition: 'new',
    tipe: 'Sell', // Default to "Sell" to match enum
    description: '',
    images: []
  });

  // Categories untuk dropdown
  const categories = [
    'Men Fashion', 'Women Fashion', 'Automotive', 'Gadget',
    'Decoration', 'Sports', 'Health and Beauty'
  ];

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'price' && value !== '' && !/^\d+$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);

    if (formData.images.length + files.length > 5) {
      setError('Maksimum 5 gambar yang diperbolehkan');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newImagePreviews = [...imagePreviews];
    const newImages = [...formData.images];

    files.forEach(file => {
      if (!file.type.match('image.*')) {
        setError('Harap upload file gambar saja (JPG, PNG, atau GIF)');
        setTimeout(() => setError(null), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          newImagePreviews.push(e.target.result.toString());
          setImagePreviews([...newImagePreviews]);
        }
      };
      reader.readAsDataURL(file);
      newImages.push(file);
    });

    setFormData(prev => ({ ...prev, images: newImages }));
    if (e.target) e.target.value = '';
  };

  const removeImage = (index) => {
    const newImagePreviews = [...imagePreviews];
    newImagePreviews.splice(index, 1);

    const newImages = [...formData.images];
    newImages.splice(index, 1);

    setImagePreviews(newImagePreviews);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nama produk harus diisi'); return false;
    }
    if (!formData.price) {
      setError('Harga produk harus diisi'); return false;
    }
    if (!formData.category) {
      setError('Kategori produk harus dipilih'); return false;
    }
    if (!formData.tipe) {
      setError('Tipe produk harus dipilih'); return false;
    }
    if (!formData.description.trim()) {
      setError('Deskripsi produk harus diisi'); return false;
    }
    if (formData.images.length === 0) {
      setError('Upload minimal 1 gambar produk'); return false;
    }
    return true;
  };

  // Submit form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('name', formData.name);
      uploadData.append('price', formData.price);
      uploadData.append('category', formData.category);
      uploadData.append('condition', formData.condition);
      uploadData.append('tipe', formData.tipe);
      uploadData.append('description', formData.description);

      // Upload file gambar
      formData.images.forEach(image => uploadData.append('images', image));

      // Ambil token dari localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Anda harus login untuk mengunggah produk. Silakan login dan coba lagi.');
        setLoading(false);
        navigate('/login', { state: { from: '/upload-product' } });
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/products/upload`,
        uploadData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
        }
      );

      console.log("Upload successful:", response.data);
      setSuccess(true);
      
      // Navigasi ke halaman product-list setelah 2 detik
      setTimeout(() => navigate(`/products/${response.data.product._id}`), 2000);
    } catch (err) {
      console.error('Error uploading product:', err);
      if (err.response?.status === 401) {
        setError('Otentikasi gagal. Silakan login kembali dan coba lagi.');
      } else {
        setError(err.response?.data?.message || 'Gagal mengunggah produk. Silakan coba lagi.');
      }
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <NavbarComponent />
      <div className="bg-[#FFF5E4] min-h-screen pt-6 pb-12 px-4">
        <div className="w-full max-w-3xl mx-auto">
          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Success message */}
            {success && (
              <div className="p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Produk Berhasil Diunggah!</h2>
                <p className="text-gray-600 mb-4">Terima kasih telah berkontribusi pada gaya hidup zero waste.</p>
                <div className="flex space-x-4">
                  <button onClick={() => navigate('/product-list')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg" type="button">
                    Lihat Produk
                  </button>
                  <button onClick={() => window.location.reload()} className="px-4 py-2 border border-amber-500 text-amber-500 hover:bg-amber-50 rounded-lg" type="button">
                    Upload Lagi
                  </button>
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="p-6">
                {/* Error message */}
                {error && (
                  <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg border-l-4 border-red-500">
                    <p>{error}</p>
                  </div>
                )}

                <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Produk Zero Waste</h2>

                {/* Upload Photos */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto Produk <span className="text-red-500">*</span>
                  </label>

                  <div className="border-2 border-dashed border-amber-200 rounded-lg p-4 bg-amber-50">
                    {imagePreviews.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-5 gap-2 mb-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                                <img src={preview} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                              </div>
                              {index === 0 && (
                                <span className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-1 rounded">
                                  Utama
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}

                          {imagePreviews.length < 5 && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current && fileInputRef.current.click()}
                              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Foto pertama akan menjadi foto utama. Maksimal 5 foto.</p>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer flex flex-col items-center py-4"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-600 mb-1">Klik untuk mengunggah foto produk</p>
                        <p className="text-xs text-gray-500">Format: JPG, PNG, GIF (Maks. 5 foto)</p>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  {/* Nama & Harga dalam 1 baris */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nama Produk */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Produk <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Nama produk"
                      />
                    </div>

                    {/* Harga */}
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        Harga (Rp) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500">Rp</span>
                        </div>
                        <input
                          type="text"
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                          placeholder="50000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category & Tipe dalam 1 baris */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Kategori */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      >
                        <option value="" disabled>Pilih kategori</option>
                        {categories.map((category) => (
                          <option key={category} value={category.toLowerCase()}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tipe sebagai dropdown */}
                    <div>
                      <label htmlFor="tipe" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipe Produk <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="tipe"
                        name="tipe"
                        value={formData.tipe}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      >
                        <option value="Sell">Jual</option>
                        <option value="Donation">Donasi</option>
                        <option value="Swap">Tukar</option>
                      </select>
                    </div>
                  </div>

                  {/* Kondisi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kondisi <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      <label className={`flex items-center px-3 py-2 border rounded-lg cursor-pointer ${formData.condition === 'new' ? 'bg-amber-50 border-amber-300' : 'border-gray-200'}`}>
                        <input
                          type="radio"
                          name="condition"
                          value="new"
                          checked={formData.condition === 'new'}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        <span>Baru</span>
                      </label>

                      <label className={`flex items-center px-3 py-2 border rounded-lg cursor-pointer ${formData.condition === 'used' ? 'bg-amber-50 border-amber-300' : 'border-gray-200'}`}>
                        <input
                          type="radio"
                          name="condition"
                          value="used"
                          checked={formData.condition === 'used'}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        <span>Bekas</span>
                      </label>
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi Produk <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="Deskripsikan produk Anda secara detail, termasuk bahan, ukuran, dan cara penggunaan."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.description.length}/1000 karakter
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-white font-medium transition-all shadow"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Mengunggah...
                      </span>
                    ) : 'Upload Produk'}
                  </button>
                </div>
              </form>
            )}

            {/* Footer Note */}
            {!success && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-center text-xs text-gray-500">
                Dengan mengupload produk, Anda menyetujui persyaratan layanan kami.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}