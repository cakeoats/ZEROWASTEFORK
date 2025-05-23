import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavbarComponent from '../../components/NavbarComponent';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslate } from '../../utils/languageUtils';
import Footer from '../../components/Footer';

// Konstanta untuk API
const API_URL = 'https://zerowastemarket-production.up.railway.app';

export default function ProductUpload() {
  // Hooks
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { language } = useLanguage();
  const translate = useTranslate(language);

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
      setError(language === 'id' ? 'Maksimum 5 gambar yang diperbolehkan' : 'Maximum 5 images allowed');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newImagePreviews = [...imagePreviews];
    const newImages = [...formData.images];

    files.forEach(file => {
      if (!file.type.match('image.*')) {
        setError(language === 'id' ? 
          'Harap upload file gambar saja (JPG, PNG, atau GIF)' : 
          'Please upload image files only (JPG, PNG, or GIF)');
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
      setError(language === 'id' ? 'Nama produk harus diisi' : 'Product name is required');
      return false;
    }
    if (!formData.price) {
      setError(language === 'id' ? 'Harga produk harus diisi' : 'Price is required');
      return false;
    }
    if (!formData.category) {
      setError(language === 'id' ? 'Kategori produk harus dipilih' : 'Category is required');
      return false;
    }
    if (!formData.tipe) {
      setError(language === 'id' ? 'Tipe produk harus dipilih' : 'Product type is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError(language === 'id' ? 'Deskripsi produk harus diisi' : 'Description is required');
      return false;
    }
    if (formData.images.length === 0) {
      setError(language === 'id' ? 'Upload minimal 1 gambar produk' : 'Upload at least 1 product image');
      return false;
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
        setError(language === 'id' ? 
          'Anda harus login untuk mengunggah produk. Silakan login dan coba lagi.' : 
          'You must be logged in to upload a product. Please login and try again.');
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
        setError(language === 'id' ? 
          'Otentikasi gagal. Silakan login kembali dan coba lagi.' : 
          'Authentication failed. Please log in again and try again.');
      } else {
        setError(err.response?.data?.message || 
          (language === 'id' ? 
            'Gagal mengunggah produk. Silakan coba lagi.' : 
            'Failed to upload product. Please try again.'));
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
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {translate('product.uploadSuccess')}
                </h2>
                <p className="text-gray-600 mb-4">
                  {translate('product.thanksContribute')}
                </p>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => navigate('/product-list')} 
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg" 
                    type="button"
                  >
                    {language === 'id' ? 'Lihat Produk' : 'View Products'}
                  </button>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 border border-amber-500 text-amber-500 hover:bg-amber-50 rounded-lg" 
                    type="button"
                  >
                    {language === 'id' ? 'Upload Lagi' : 'Upload Again'}
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

                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {translate('product.upload')}
                </h2>

                {/* Upload Photos */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translate('product.uploadPhotos')} <span className="text-red-500">*</span>
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
                                  {language === 'id' ? 'Utama' : 'Main'}
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
                        <p className="text-xs text-gray-500">
                          {translate('product.mainPhoto')}. {translate('product.maxPhotos')}.
                        </p>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer flex flex-col items-center py-4"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-600 mb-1">
                          {language === 'id' ? 'Klik untuk mengunggah foto produk' : 'Click to upload product photos'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {language === 'id' ? 'Format: JPG, PNG, GIF (Maks. 5 foto)' : 'Format: JPG, PNG, GIF (Max. 5 photos)'}
                        </p>
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
                        {translate('product.productName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder={language === 'id' ? "Nama produk" : "Product name"}
                      />
                    </div>

                    {/* Harga */}
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        {translate('product.price')} (Rp) <span className="text-red-500">*</span>
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
                        {translate('product.categories')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      >
                        <option value="" disabled>
                          {language === 'id' ? 'Pilih kategori' : 'Select category'}
                        </option>
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
                        {language === 'id' ? 'Tipe Produk' : 'Product Type'} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="tipe"
                        name="tipe"
                        value={formData.tipe}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      >
                        <option value="Sell">{language === 'id' ? 'Jual' : 'Sell'}</option>
                        <option value="Donation">{language === 'id' ? 'Donasi' : 'Donation'}</option>
                        <option value="Swap">{language === 'id' ? 'Tukar' : 'Swap'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Kondisi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {translate('product.condition')} <span className="text-red-500">*</span>
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
                        <span>{language === 'id' ? 'Baru' : 'New'}</span>
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
                        <span>{language === 'id' ? 'Bekas' : 'Used'}</span>
                      </label>
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      {translate('product.description')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder={language === 'id' ? 
                        "Deskripsikan produk Anda secara detail, termasuk bahan, ukuran, dan cara penggunaan." : 
                        "Describe your product in detail, including materials, size, and usage instructions."}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.description.length}/1000 {language === 'id' ? 'karakter' : 'characters'}
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
                        {language === 'id' ? 'Mengunggah...' : 'Uploading...'}
                      </span>
                    ) : translate('product.upload')}
                  </button>
                </div>
              </form>
            )}

            {/* Footer Note */}
            {!success && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-center text-xs text-gray-500">
                {language === 'id' ? 
                  'Dengan mengupload produk, Anda menyetujui persyaratan layanan kami.' : 
                  'By uploading a product, you agree to our terms of service.'}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}